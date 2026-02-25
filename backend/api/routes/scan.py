"""Scan Me — Skin & nutrition image analysis endpoints."""

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ScanResult(BaseModel):
    label: str
    confidence: float
    description: str
    recommendations: list[str] = []


@router.post("/skin", response_model=ScanResult)
async def scan_skin(image: UploadFile = File(...)):
    """Analyze a skin image for potential conditions."""
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")
    # TODO: Wire up image_model for skin classification
    return ScanResult(
        label="Healthy",
        confidence=0.0,
        description="Skin analysis model not yet connected.",
        recommendations=["Connect the CV model to enable real analysis."],
    )


@router.post("/nutrition", response_model=ScanResult)
async def scan_nutrition(image: UploadFile = File(...)):
    """Analyze a food image for nutritional information."""
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")
    # TODO: Wire up image_model for food classification
    return ScanResult(
        label="Unknown Food",
        confidence=0.0,
        description="Nutrition analysis model not yet connected.",
        recommendations=["Connect the CV model to enable real analysis."],
    )
