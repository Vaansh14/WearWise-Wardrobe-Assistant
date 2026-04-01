from fastapi import FastAPI, UploadFile, File, Body
from fastapi import Body
from google import genai
from PIL import Image
import io
import json
import os


client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

model = "gemini-2.5-flash"


@app.post("/analyze")
async def analyze_clothing(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))

    prompt = """
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
        contents=[prompt, image]
    )

    text = response.text.strip()

    try:
        data = json.loads(text)
    except:
        start = text.find("{")
        end = text.rfind("}") + 1
        data = json.loads(text[start:end])

    return {
        "category": data.get("category", ""),
        "type": data.get("type", ""),
        "color": data.get("color", ""),
        "season": data.get("season", ""),
        "gender": data.get("gender", ""),
        "occasion": data.get("occasion", "")
    }


# ================= OUTFIT (no prompt) =================
@app.post("/outfit")
async def generate_outfit(data: dict = Body(...)):
    items = data.get("items", [])
    temperature = data.get("temperature")
    occasion = data.get("occasion")
    events = data.get("events", [])

    # Build calendar context only if events are provided
    if events:
        events_block = "Today's Calendar Events:\n" + "\n".join(f"    - {e}" for e in events)
        events_instruction = "Consider the user's schedule when picking the outfit. Prioritize the most important or formal event of the day."
    else:
        events_block = "No calendar connected — ignore events."
        events_instruction = ""

    prompt = f"""
    You are a professional fashion stylist.

    User wardrobe:
    {items}

    Temperature: {temperature}
    Occasion: {occasion}

    {events_block}

    Task:
    - Choose the BEST possible outfit combination.
    {events_instruction}

    Rules:
    - Pick 1 Top (category = Top)
    - Pick 1 Bottom (category = Bottom)
    - Pick 1 Footwear (category = Footwear)
    - Optionally pick:
      - Outerwear
      - Accessory

    - Only choose items from correct categories
    - Return Indexes from the list
    - Prioritize color coordination, style compatibility, and season

    IMPORTANT:
    - You MUST include "reason"
    - Keep reason to 1–2 short sentences (max 25 words)
    - If calendar events were provided, mention how the outfit suits the schedule
    - Do NOT skip any field

    Return ONLY JSON:
    {{
      "top": number,
      "bottom": number,
      "footwear": number,
      "outerwear": number or null,
      "accessory": number or null,
      "reason": "short explanation"
    }}

    Include temperature reasoning in explanation
    """

    response = client.models.generate_content(
        model=model,
        contents=prompt
    )

    text = response.text.strip()
    print("AI RAW:", text)

    try:
        return json.loads(text)
    except:
        start = text.find("{")
        end = text.rfind("}") + 1
        return json.loads(text[start:end])


# ================= OUTFIT (with prompt) =================
@app.post("/outfit/prompt")
async def generate_outfit_with_prompt(data: dict = Body(...)):
    items = data.get("items", [])
    user_prompt = data.get("prompt", "")

    prompt = f"""
    You are a professional fashion stylist.

    User wardrobe:
    {items}

    User request: "{user_prompt}"

    Task:
    - Carefully read the user's request — it may describe an occasion, vibe, weather, style, or specific items they want to wear.
    - Choose the BEST outfit from the wardrobe that satisfies the request.

    Rules:
    - Pick 1 Top (category = Top)
    - Pick 1 Bottom (category = Bottom)
    - Pick 1 Footwear (category = Footwear)
    - Optionally pick:
      - Outerwear (if weather or style warrants it)
      - Accessory (if it complements the look)

    - Only choose items from correct categories
    - Return indexes from the wardrobe list
    - Prioritize the user's request above all else
    - If the user mentions specific items (e.g. "my red jacket"), find the closest match in the wardrobe

    IMPORTANT:
    - You MUST include "reason"
    - Keep reason to 1–2 short sentences (max 25 words)
    - Mention how the outfit matches the user's request
    - Do NOT skip any field

    Return ONLY JSON:
    {{
      "top": number,
      "bottom": number,
      "footwear": number,
      "outerwear": number or null,
      "accessory": number or null,
      "reason": "short explanation"
    }}
    """

    response = client.models.generate_content(
        model=model,
        contents=prompt
    )

    text = response.text.strip()
    print("AI PROMPT RAW:", text)

    try:
        return json.loads(text)
    except:
        start = text.find("{")
        end = text.rfind("}") + 1
        return json.loads(text[start:end])