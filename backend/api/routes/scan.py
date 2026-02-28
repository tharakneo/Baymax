"""Scan Me — Image analysis endpoints powered by Groq Vision (Llama 4 Scout)."""
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from core.image_pipeline import analyze_image

router = APIRouter()


class ScanResult(BaseModel):
    label: str
    severity: str = "unknown"
    confidence: float = 0.0
    description: str
    recommendations: list[str] = []
    see_doctor: bool = False
    top_predictions: list[dict] = []


@router.post("/skin", response_model=ScanResult)
async def scan_skin(image: UploadFile = File(...)):
    """
    Analyze any skin/medical image using Groq Vision.
    Handles wounds, cuts, pimples, rashes, burns, skin conditions — anything.
    """
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    image_bytes = await image.read()

    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 10MB.")

    result = await analyze_image(image_bytes, content_type=image.content_type)
    return ScanResult(**result)


@router.post("/nutrition", response_model=ScanResult)
async def scan_nutrition(image: UploadFile = File(...)):
    """Nutrition analysis — coming in Phase 2."""
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    return ScanResult(
        label="Coming Soon",
        severity="unknown",
        description="Nutrition analysis is coming in the next update. Stay tuned!",
        recommendations=["Check back soon for food and nutrition analysis."],
        see_doctor=False,
    )
