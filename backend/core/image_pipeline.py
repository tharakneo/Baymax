"""
Baymax Image Pipeline — Groq Vision
=====================================
Uses Groq's Llama 4 Scout vision model to analyze any skin/medical image.
Covers wounds, cuts, pimples, rashes, burns, skin conditions — anything.

No model downloads needed — uses your existing GROQ_API_KEY.
"""

import base64
import httpx
import json
from config import get_settings

settings = get_settings()

GROQ_VISION_URL = "https://api.groq.com/openai/v1/chat/completions"
VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

BAYMAX_VISION_PROMPT = """You are Baymax, a personal healthcare companion. A user has uploaded an image for you to analyze.

Examine the image carefully and respond as Baymax would — warm, calm, caring, never alarming.

Your response MUST be a valid JSON object with exactly these fields:
{
  "label": "short condition name (e.g. 'Minor Cut', 'Acne', 'Eczema', 'Bruise', 'Burn')",
  "severity": "low, medium, or high",
  "description": "2-3 sentences describing what you see in Baymax's warm voice",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "see_doctor": true or false
}

Rules:
- NEVER diagnose definitively — use 'appears to be', 'may suggest', 'looks like'
- severity 'high' = needs medical attention soon
- severity 'medium' = worth monitoring or seeing a doctor
- severity 'low' = manageable at home
- Always include 2-4 recommendations
- If the image is not medical/skin related, set label to 'Not a medical image' and explain kindly
- Respond ONLY with the JSON object, no other text
"""


async def analyze_image(image_bytes: bytes, content_type: str = "image/jpeg") -> dict:
    """
    Sends image to Groq Vision (Llama 4 Scout) with Baymax medical prompt.
    Returns structured analysis result.
    """
    # ── Encode image to base64 ────────────────────────────────────────────────
    b64_image = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:{content_type};base64,{b64_image}"

    # ── Build Groq API request ────────────────────────────────────────────────
    payload = {
        "model": VISION_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": BAYMAX_VISION_PROMPT,
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": data_url},
                    },
                ],
            }
        ],
        "max_tokens": 1024,
        "temperature": 0.3,  # lower temp for more consistent structured output
    }

    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json",
    }

    # ── Call Groq API ─────────────────────────────────────────────────────────
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                GROQ_VISION_URL,
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()

        raw_text = data["choices"][0]["message"]["content"].strip()

        # ── Parse JSON response ───────────────────────────────────────────────
        # Strip markdown code fences if model adds them
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        raw_text = raw_text.strip()

        result = json.loads(raw_text)

        # ── Validate and normalize fields ─────────────────────────────────────
        return {
            "label": result.get("label", "Unknown"),
            "severity": result.get("severity", "unknown"),
            "description": result.get("description", "I was unable to analyze this image clearly."),
            "recommendations": result.get("recommendations", ["Please consult a healthcare professional."]),
            "see_doctor": result.get("see_doctor", False),
            "confidence": 0.0,  # kept for schema compatibility
            "top_predictions": [],
        }

    except json.JSONDecodeError:
        # Model didn't return valid JSON — return raw text as description
        return {
            "label": "Analysis Complete",
            "severity": "unknown",
            "description": raw_text if 'raw_text' in locals() else "I was unable to analyze this image.",
            "recommendations": ["Please consult a healthcare professional for proper evaluation."],
            "see_doctor": True,
            "confidence": 0.0,
            "top_predictions": [],
        }
    except Exception as e:
        return {
            "label": "Analysis Failed",
            "severity": "unknown",
            "description": "I was unable to analyze this image. Please ensure it is a clear, well-lit photo.",
            "recommendations": [
                "Try again with a clearer image",
                "Ensure good lighting",
                "See a healthcare professional for in-person evaluation",
            ],
            "see_doctor": True,
            "confidence": 0.0,
            "top_predictions": [],
        }
