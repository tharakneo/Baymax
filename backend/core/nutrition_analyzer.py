"""
Baymax Nutrition Analyzer — Groq LLM
Parses natural-language food descriptions and estimates calories, macros, micros.
"""

import json
import httpx
from config import get_settings

settings = get_settings()

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.1-8b-instant"

NUTRITION_PROMPT = """You are Baymax, a nutrition analysis assistant.
The user will describe what they ate in natural language. Analyze it and return a JSON object with these fields:

{
  "items": [
    {
      "name": "item name",
      "quantity": "amount described",
      "calories": estimated_calories_number,
      "protein_g": grams,
      "carbs_g": grams,
      "fat_g": grams,
      "fiber_g": grams,
      "sugar_g": grams
    }
  ],
  "totals": {
    "calories": total_calories,
    "protein_g": total,
    "carbs_g": total,
    "fat_g": total,
    "fiber_g": total,
    "sugar_g": total
  },
  "summary": "One sentence Baymax-style summary of the nutritional value"
}

Rules:
- Estimate as accurately as possible based on standard serving sizes
- If quantities are vague, use reasonable defaults
- Always return valid JSON only, no other text
- Round numbers to 1 decimal place
"""


async def analyze_nutrition(food_description: str) -> dict:
    """Send food description to Groq and get nutrition breakdown."""
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": NUTRITION_PROMPT},
            {"role": "user", "content": food_description},
        ],
        "max_tokens": 1024,
        "temperature": 0.2,
    }

    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(GROQ_URL, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()

        raw = data["choices"][0]["message"]["content"].strip()

        # Strip markdown fences
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        return json.loads(raw)

    except json.JSONDecodeError:
        return {
            "items": [],
            "totals": {"calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "fiber_g": 0, "sugar_g": 0},
            "summary": "I couldn't analyze that. Try describing your meal more clearly.",
        }
    except Exception:
        return {
            "items": [],
            "totals": {"calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "fiber_g": 0, "sugar_g": 0},
            "summary": "Nutrition analysis is temporarily unavailable.",
        }
