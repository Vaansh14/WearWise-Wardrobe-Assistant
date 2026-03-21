from fastapi import FastAPI, UploadFile, File
from fastapi import Body
from google import genai
from PIL import Image
import io
import json
import os

app = FastAPI()

# initialize Gemini client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

model = "gemini-2.5-flash"


@app.post("/analyze")
async def analyze_clothing(file: UploadFile = File(...)):

    contents = await file.read()

    image = Image.open(io.BytesIO(contents))

    prompt = """
    You are a fashion AI.

    Analyze the clothing item in the image.

    Return ONLY valid JSON in this format:

    {
     "category": "Shirt | Pants | Shoes | Jacket | Other",
     "color": "main visible color",
     "season": "Summer | Winter | All Season"
    }

    Rules:
    - Choose ONLY one category.
    - Use simple color names like Black, Blue, White, Red.
    - Do NOT return explanations.
    - Do NOT return markdown.
    - Return ONLY JSON.
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
    return data



@app.post("/outfit")
async def generate_outfit(data: dict = Body(...)):

    items = data.get("items", [])

    prompt = f"""
    You are a fashion stylist AI.

    Based on this wardrobe:

    {items}

    Pick the BEST outfit combination.

    Return ONLY JSON:

    {{
      "shirt": <index>,
      "pants": <index>,
      "shoes": <index>,
      "reason": "short explanation"
    }}
    """

    response = client.models.generate_content(
        model=model,
        contents=prompt
    )

    text = response.text.strip()

    try:
        return json.loads(text)
    except:
        start = text.find("{")
        end = text.rfind("}") + 1
        return json.loads(text[start:end])