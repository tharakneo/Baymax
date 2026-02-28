"""
Baymax Health Insights — Groq-powered anomaly detection
Analyzes patterns in sleep, food, water over the past 7 days.
"""

import json
import httpx
from config import get_settings

settings = get_settings()

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.1-8b-instant"

INSIGHT_PROMPT = """You are Baymax, a health pattern analyst. You receive 7 days of health data (sleep hours, water intake in cups, and food descriptions with calories).

Analyze the data and return a JSON array of insights. Each insight should have:
{
  "type": "warning" | "tip" | "positive",
  "title": "Short title",
  "body": "1-2 sentence explanation in Baymax's caring tone",
  "category": "sleep" | "water" | "food" | "general"
}

Rules:
- Look for bad patterns: too little sleep, inconsistent sleep, low water, too much sugar/fat, repetitive unhealthy foods, skipped meals
- Also highlight good patterns: consistent sleep, good hydration, balanced meals
- Return 3-6 insights max
- Be specific about what you observed (mention actual numbers/foods)
- Always return valid JSON array only, no other text
- Use Baymax's gentle, caring personality
"""


async def generate_weekly_insights(daily_data: list[dict]) -> list[dict]:
    """Analyze 7 days of health logs and return anomaly insights."""
    summary = ""
    for day in daily_data:
        summary += f"\n{day['date']}:\n"
        summary += f"  Sleep: {day.get('sleep_hours', 0)} hours\n"
        summary += f"  Water: {day.get('water_cups', 0)} cups\n"
        meals = day.get('meals', [])
        if meals:
            summary += f"  Food: {', '.join(meals)}\n"
        else:
            summary += "  Food: nothing logged\n"

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": INSIGHT_PROMPT},
            {"role": "user", "content": f"Here is my health data for the past week:\n{summary}"},
        ],
        "max_tokens": 1024,
        "temperature": 0.3,
    }

    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            response = await client.post(GROQ_URL, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()

        raw = data["choices"][0]["message"]["content"].strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        return json.loads(raw)
    except Exception:
        return [
            {
                "type": "tip",
                "title": "Keep Logging",
                "body": "I need more data to find patterns. Keep logging your sleep, water, and food daily.",
                "category": "general",
            }
        ]
