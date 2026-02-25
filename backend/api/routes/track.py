"""Track Me — Health trends & anomaly detection endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()


class HealthDataPoint(BaseModel):
    metric: str  # e.g. "heart_rate", "blood_pressure", "weight"
    value: float
    unit: str
    timestamp: Optional[datetime] = None


class TrendResponse(BaseModel):
    metric: str
    data_points: int
    trend: str  # "increasing", "decreasing", "stable"
    anomalies: list[dict] = []


@router.post("/log")
async def log_health_data(data: HealthDataPoint):
    """Log a health data point for tracking."""
    # TODO: Store in database
    return {
        "status": "logged",
        "metric": data.metric,
        "value": data.value,
        "timestamp": data.timestamp or datetime.utcnow(),
    }


@router.get("/trends/{metric}", response_model=TrendResponse)
async def get_trends(metric: str):
    """Get trend analysis for a specific health metric."""
    # TODO: Query database & run anomaly detection
    return TrendResponse(
        metric=metric,
        data_points=0,
        trend="stable",
        anomalies=[],
    )


@router.get("/summary")
async def get_health_summary():
    """Get an overall health summary with key metrics."""
    # TODO: Aggregate all metrics
    return {
        "summary": "No health data recorded yet.",
        "metrics": [],
        "last_updated": None,
    }
