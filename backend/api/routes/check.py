"""Check Me — Wellness & mental health assessment endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class AssessmentAnswer(BaseModel):
    question_id: int
    answer: int  # Likert scale 1-5


class AssessmentRequest(BaseModel):
    assessment_type: str  # "wellness", "stress", "sleep", "mood"
    answers: list[AssessmentAnswer]


class AssessmentResult(BaseModel):
    assessment_type: str
    score: float
    max_score: float
    interpretation: str
    recommendations: list[str] = []


@router.get("/questions/{assessment_type}")
async def get_assessment_questions(assessment_type: str):
    """Get questions for a specific assessment type."""
    # TODO: Load from database
    questions = {
        "wellness": [
            {"id": 1, "text": "How would you rate your overall energy level today?"},
            {"id": 2, "text": "How well did you sleep last night?"},
            {"id": 3, "text": "How would you rate your stress level?"},
            {"id": 4, "text": "How balanced has your diet been today?"},
            {"id": 5, "text": "How much physical activity did you get today?"},
        ],
    }
    return {
        "assessment_type": assessment_type,
        "questions": questions.get(assessment_type, []),
    }


@router.post("/submit", response_model=AssessmentResult)
async def submit_assessment(request: AssessmentRequest):
    """Submit assessment answers and receive results."""
    # TODO: Scoring logic & AI-powered recommendations
    total = sum(a.answer for a in request.answers)
    max_score = len(request.answers) * 5
    return AssessmentResult(
        assessment_type=request.assessment_type,
        score=total,
        max_score=max_score,
        interpretation="Assessment engine not yet connected.",
        recommendations=["Connect the assessment engine for personalized insights."],
    )
