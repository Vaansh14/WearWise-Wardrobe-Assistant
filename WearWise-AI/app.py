from fastapi import FastAPI, UploadFile, File, Body, HTTPException
from google import genai
from PIL import Image
import io
import json
import os

app = FastAPI()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

model = "gemini-2.5-flash"



# SHARED HELPERS


def _parse_ai_json(text: str) -> dict:
    """
    Robustly parse JSON from an AI response.
    Strips markdown fences (```json ... ```) and extracts the first {...} block.
    Raises ValueError if no valid JSON can be found.
    """
    text = text.strip()

    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.splitlines()
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines).strip()

    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Fallback: extract the first {...} block
    start = text.find("{")
    end = text.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError(f"No JSON object found in AI response: {text!r}")

    return json.loads(text[start:end])


def _build_wardrobe_lines(items: list) -> tuple[str, set, dict]:
    """
    Returns:
    - wardrobe_lines: items grouped by category with clear headers
    - valid_ids: set of all integer IDs in the wardrobe
    - category_ids: dict mapping category name → list of valid IDs in that category
    """
    valid_ids: set = set()
    category_ids: dict = {}

    for item in items:
        item_id = item.get("id")
        cat = item.get("category", "Unknown")
        if item_id is not None:
            valid_ids.add(int(item_id))
            category_ids.setdefault(cat, []).append(int(item_id))

    # Build grouped display
    lines = ""
    for cat, ids in sorted(category_ids.items()):
        lines += f"  [{cat}]\n"
        for item in items:
            if item.get("category") == cat:
                lines += (
                    f"    - id={item.get('id')} | type={item.get('type')}"
                    f" | color={item.get('color')} | season={item.get('season')}"
                    f" | occasion={item.get('occasion')} | gender={item.get('gender')}\n"
                )

    return lines, valid_ids, category_ids


def _validate_outfit_response(data: dict, valid_ids: set, category_ids: dict) -> list[str]:
    """
    Validates that the AI outfit response:
    - Has all required fields pointing to real wardrobe IDs
    - Does NOT reuse the same ID across multiple slots
    - Each slot ID belongs to the correct category
    Returns a list of error strings (empty = valid).
    """
    errors = []

    SLOT_CATEGORY = {
        "top":       "Top",
        "bottom":    "Bottom",
        "footwear":  "Footwear",
        "outerwear": "Outerwear",
        "accessory": "Accessory",
    }

    seen_ids: set = set()

    for field, expected_cat in SLOT_CATEGORY.items():
        value = data.get(field)

        if value is None:
            if field in ("top", "bottom", "footwear"):
                # Required only if the category has items in the wardrobe
                if category_ids.get(expected_cat):
                    errors.append(
                        f"'{field}' is null but the wardrobe has {expected_cat} items — must pick one"
                    )
            # optional slots being null is fine
            continue

        try:
            int_val = int(value)
        except (TypeError, ValueError):
            errors.append(f"'{field}' has non-numeric value: {value!r}")
            continue

        # Must be a real wardrobe ID
        if int_val not in valid_ids:
            errors.append(f"'{field}' id={int_val} does not exist in the wardrobe")
            continue

        # Must belong to the correct category
        if int_val not in (category_ids.get(expected_cat) or []):
            errors.append(
                f"'{field}' id={int_val} is not a {expected_cat} item "
                f"— it belongs to a different category"
            )
            continue

        # Must not be reused across slots
        if int_val in seen_ids:
            errors.append(
                f"'{field}' id={int_val} is already used in another slot — each item can only appear once"
            )
        else:
            seen_ids.add(int_val)

    if "reason" not in data or not data.get("reason"):
        errors.append("'reason' is missing or empty")

    return errors


async def _generate_outfit_with_retry(
    prompt: str,
    valid_ids: set,
    category_ids: dict,
    max_retries: int = 3
) -> dict:
    """
    Calls Gemini with the given prompt, validates the response, and retries
    up to max_retries times if the response is incomplete or invalid.
    Raises HTTPException(503) if all retries are exhausted.
    """
    last_error = "Unknown error"

    for attempt in range(1, max_retries + 1):
        print(f" Outfit generation attempt {attempt}/{max_retries}")

        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt
            )
            text = response.text.strip()
            print(f" AI RAW (attempt {attempt}):", text)

            data = _parse_ai_json(text)
            errors = _validate_outfit_response(data, valid_ids, category_ids)

            if not errors:
                # Normalize optional null fields
                data["outerwear"] = data.get("outerwear")
                data["accessory"] = data.get("accessory")
                return data

            last_error = f"Validation failed: {'; '.join(errors)}"
            print(f"  Attempt {attempt} invalid — {last_error}")

        except (json.JSONDecodeError, ValueError) as e:
            last_error = f"JSON parse error: {e}"
            print(f"  Attempt {attempt} parse error — {last_error}")

        except Exception as e:
            last_error = f"Unexpected error: {e}"
            print(f" Attempt {attempt} unexpected error — {last_error}")

    raise HTTPException(
        status_code=503,
        detail=f"AI failed to generate a valid outfit after {max_retries} attempts. Last error: {last_error}"
    )



# ENDPOINT: /analyze


@app.post("/analyze")
async def analyze_clothing(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))

    #  Validate that the image contains a clothing item
    validation_prompt = """
You are a fashion AI image validator.

Look at the image and determine STRICTLY whether it contains a clothing item or fashion accessory
(e.g. shirt, jeans, dress, shoes, jacket, bag, hat).

Return ONLY one of the two JSON objects below. No explanation, no markdown.

If it IS a clothing item:
{"is_clothing": true}

If it is NOT a clothing item (e.g. a person, animal, vehicle, food, scenery, selfie, etc.):
{"is_clothing": false}
"""

    val_response = client.models.generate_content(
        model=model,
        contents=[validation_prompt, image]
    )

    try:
        val_data = _parse_ai_json(val_response.text)
    except ValueError:
        val_data = {"is_clothing": False}

    if not val_data.get("is_clothing", False):
        return {"invalid": True}

    #  Analyze the clothing item
    analysis_prompt = """
You are a fashion AI.

Analyze the clothing item in the image.

STRICT RULES:
- Return ONLY valid JSON
- DO NOT include explanations
- DO NOT include markdown
- ALWAYS include ALL fields

JSON FORMAT:
{
  "category": "Top | Bottom | Footwear | Outerwear | Accessory",
  "type": "e.g. hoodie, jeans, skirt, heels",
  "color": "single simple color",
  "season": "Summer | Winter | All Season",
  "gender": "Male | Female | Unisex",
  "occasion": "Casual | Formal | Gym | Party"
}
"""

    response = client.models.generate_content(
        model=model,
        contents=[analysis_prompt, image]
    )

    try:
        data = _parse_ai_json(response.text)
    except ValueError:
        raise HTTPException(status_code=500, detail="AI failed to analyze the clothing item")

    return {
        "invalid": False,
        "category": data.get("category", ""),
        "type": data.get("type", ""),
        "color": data.get("color", ""),
        "season": data.get("season", ""),
        "gender": data.get("gender", ""),
        "occasion": data.get("occasion", "")
    }



# ENDPOINT: /outfit  (no user prompt — AI picks best outfit automatically)


@app.post("/outfit")
async def generate_outfit(data: dict = Body(...)):
    items = data.get("items", [])
    temperature = data.get("temperature")
    occasion = data.get("occasion")
    events = data.get("events", [])

    if not items:
        raise HTTPException(status_code=400, detail="Wardrobe is empty")

    wardrobe_lines, valid_ids, category_ids = _build_wardrobe_lines(items)

    if events:
        events_block = "Today's Calendar Events:\n" + "\n".join(f"    - {e}" for e in events)
        events_instruction = "Consider the user's schedule when picking the outfit. Prioritize the most important or formal event of the day."
    else:
        events_block = "No calendar connected — ignore events."
        events_instruction = ""

    # Pre-compute what's available per slot so the prompt never asks for something that doesn't exist
    top_ids      = category_ids.get("Top", [])
    bottom_ids   = category_ids.get("Bottom", [])
    footwear_ids = category_ids.get("Footwear", [])
    outer_ids    = category_ids.get("Outerwear", [])
    acc_ids      = category_ids.get("Accessory", [])

    prompt = f"""
You are a professional fashion stylist.

User wardrobe grouped by category (use ONLY these id values):
{wardrobe_lines}
Temperature: {temperature}°C
Occasion: {occasion}

{events_block}

Task: Choose the BEST possible outfit from the wardrobe above.
{events_instruction}

STRICT RULES — follow exactly:
1. Each clothing item (id) can only be used in ONE slot. Never repeat the same id.
2. Only pick items from the correct category for each slot:
   - "top"       → ONLY from Top items:      {top_ids if top_ids else 'NONE AVAILABLE — set to null'}
   - "bottom"    → ONLY from Bottom items:    {bottom_ids if bottom_ids else 'NONE AVAILABLE — set to null'}
   - "footwear"  → ONLY from Footwear items:  {footwear_ids if footwear_ids else 'NONE AVAILABLE — set to null'}
   - "outerwear" → ONLY from Outerwear items: {outer_ids if outer_ids else 'NONE AVAILABLE — set to null'}
   - "accessory" → ONLY from Accessory items: {acc_ids if acc_ids else 'NONE AVAILABLE — set to null'}
3. If a category has no items (shown as NONE AVAILABLE), set that field to null.
4. Do NOT invent ids. Do NOT use array indexes. Use only the exact id numbers listed above.
5. "reason" must be 1–2 sentences (max 25 words).
{events_instruction if events_instruction else ''}

Return ONLY this JSON (no markdown, no extra text):
{{
  "top": <integer id or null>,
  "bottom": <integer id or null>,
  "footwear": <integer id or null>,
  "outerwear": <integer id or null>,
  "accessory": <integer id or null>,
  "reason": "<short explanation>"
}}
"""

    return await _generate_outfit_with_retry(prompt, valid_ids, category_ids)



# PROMPT VALIDATION HELPER (internal — no FastAPI Body dependency)

async def _check_fashion_prompt(user_prompt: str) -> bool:
    """Returns True if the prompt is fashion-related, False otherwise."""
    if not user_prompt.strip():
        return False

    validation_prompt = f"""
You are a fashion prompt validator.

Determine STRICTLY whether the following user input is related to fashion, clothing, outfits, style, or wardrobe.

Examples of VALID fashion prompts:
- "casual look for a beach day"
- "formal office outfit"
- "streetwear with my red jacket"
- "something warm for winter"
- "party outfit for tonight"

Examples of INVALID prompts:
- "what is the weather today"
- "tell me a joke"
- "who won the world cup"
- "how do I cook pasta"
- "2+2"

User input: "{user_prompt}"

Return ONLY one of the two JSON objects below. No explanation, no markdown.

If it IS fashion-related:
{{"valid": true}}

If it is NOT fashion-related:
{{"valid": false}}
"""

    response = client.models.generate_content(
        model=model,
        contents=validation_prompt
    )

    try:
        result = _parse_ai_json(response.text)
    except ValueError:
        return False

    return result.get("valid", False)



# ENDPOINT: /validate-prompt  (public endpoint)


@app.post("/validate-prompt")
async def validate_fashion_prompt(data: dict = Body(...)):
    user_prompt = data.get("prompt", "")
    is_valid = await _check_fashion_prompt(user_prompt)
    return {"valid": is_valid}



# ENDPOINT: /outfit/prompt  (AI picks outfit based on user's text prompt)


@app.post("/outfit/prompt")
async def generate_outfit_with_prompt(data: dict = Body(...)):
    items = data.get("items", [])
    user_prompt = data.get("prompt", "")

    if not items:
        raise HTTPException(status_code=400, detail="Wardrobe is empty")

    #  Reject non-fashion prompts
    is_valid = await _check_fashion_prompt(user_prompt)
    if not is_valid:
        raise HTTPException(status_code=422, detail="Invalid fashion prompt")

    #  Build wardrobe context
    wardrobe_lines, valid_ids, category_ids = _build_wardrobe_lines(items)

    top_ids      = category_ids.get("Top", [])
    bottom_ids   = category_ids.get("Bottom", [])
    footwear_ids = category_ids.get("Footwear", [])
    outer_ids    = category_ids.get("Outerwear", [])
    acc_ids      = category_ids.get("Accessory", [])

    prompt = f"""
You are a professional fashion stylist.

User wardrobe grouped by category (use ONLY these id values):
{wardrobe_lines}
User request: "{user_prompt}"

Task: Choose the BEST outfit from the wardrobe that satisfies the user's request.

STRICT RULES — follow exactly:
1. Each clothing item (id) can only be used in ONE slot. Never repeat the same id.
2. Only pick items from the correct category for each slot:
   - "top"       → ONLY from Top items:      {top_ids if top_ids else 'NONE AVAILABLE — set to null'}
   - "bottom"    → ONLY from Bottom items:    {bottom_ids if bottom_ids else 'NONE AVAILABLE — set to null'}
   - "footwear"  → ONLY from Footwear items:  {footwear_ids if footwear_ids else 'NONE AVAILABLE — set to null'}
   - "outerwear" → ONLY from Outerwear items: {outer_ids if outer_ids else 'NONE AVAILABLE — set to null'}
   - "accessory" → ONLY from Accessory items: {acc_ids if acc_ids else 'NONE AVAILABLE — set to null'}
3. If a category has no items (shown as NONE AVAILABLE), set that field to null.
4. Do NOT invent ids. Do NOT use array indexes. Use only the exact id numbers listed above.
5. Prioritize the user's request above all else.
6. If the user mentions a specific item (e.g. "my red jacket"), pick the closest match from the correct category.
7. "reason" must be 1–2 sentences (max 25 words) explaining how the outfit matches the request.

Return ONLY this JSON (no markdown, no extra text):
{{
  "top": <integer id or null>,
  "bottom": <integer id or null>,
  "footwear": <integer id or null>,
  "outerwear": <integer id or null>,
  "accessory": <integer id or null>,
  "reason": "<short explanation>"
}}
"""

    #  Generate with retry + validation
    return await _generate_outfit_with_retry(prompt, valid_ids, category_ids)