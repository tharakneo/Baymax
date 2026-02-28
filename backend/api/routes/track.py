"""Track Me — Health logging & Health Card endpoints (PostgreSQL)."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc
from db.database import get_db
from db.models import HealthLog, User
from core.nutrition_analyzer import analyze_nutrition
import json

router = APIRouter()


# ─── Schemas ──────────────────────────────────────────────────────────────────

class FoodLogRequest(BaseModel):
    meal_type: str          # breakfast, lunch, dinner, snack
    description: str        # "4 mashed potatoes, 2 cubes butter, 1 cup milk"
    date_str: str | None = None # e.g. "2023-10-25"

class LogEntry(BaseModel):
    log_type: str       # sleep, water, food
    value: float | None = None
    notes: str | None = None
    date_str: str | None = None # e.g. "2023-10-25"

class LogResponse(BaseModel):
    id: int
    log_type: str
    value: float | None
    notes: str | None
    logged_at: datetime

class HealthCardUpdate(BaseModel):
    height: float | None = None   # cm
    weight: float | None = None   # kg
    age: int | None = None
    gender: str | None = None
    calorie_goal: int | None = None

class HealthCardResponse(BaseModel):
    height: float | None = None
    weight: float | None = None
    age: int | None = None
    gender: str | None = None
    calorie_goal: int | None = None


# ─── Helpers ──────────────────────────────────────────────────────────────────

DEFAULT_USER_ID = 1

def _ensure_default_user(db: Session) -> User:
    """Get or create a default user (no auth yet)."""
    user = db.query(User).filter(User.id == DEFAULT_USER_ID).first()
    if not user:
        user = User(
            id=DEFAULT_USER_ID,
            email="default@baymax.local",
            name="User",
            hashed_password="none",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


# ─── Log a health entry ──────────────────────────────────────────────────────

@router.post("/log", response_model=LogResponse)
async def log_health_data(entry: LogEntry, db: Session = Depends(get_db)):
    if entry.log_type not in ("sleep", "water", "food"):
        raise HTTPException(400, "log_type must be sleep, water, or food")

    _ensure_default_user(db)

    # Determine logged_at timestamp
    logged_at_val = datetime.utcnow()
    if entry.date_str:
        try:
            d = datetime.strptime(entry.date_str, "%Y-%m-%d")
            # Set time to 12:00 PM UTC on the target date
            logged_at_val = datetime(d.year, d.month, d.day, 12, 0, 0)
        except ValueError:
            pass # fallback to now if invalid

    log = HealthLog(
        user_id=DEFAULT_USER_ID,
        log_type=entry.log_type,
        value=entry.value,
        notes=entry.notes,
        logged_at=logged_at_val,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    return LogResponse(
        id=log.id,
        log_type=log.log_type,
        value=log.value,
        notes=log.notes,
        logged_at=log.logged_at,
    )


# ─── Get recent logs ─────────────────────────────────────────────────────────

@router.get("/logs/{log_type}")
async def get_logs(log_type: str, days: int = 7, db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=days)
    logs = (
        db.query(HealthLog)
        .filter(
            HealthLog.user_id == DEFAULT_USER_ID,
            HealthLog.log_type == log_type,
            HealthLog.logged_at >= since,
        )
        .order_by(desc(HealthLog.logged_at))
        .limit(50)
        .all()
    )
    return [
        {
            "id": l.id,
            "value": l.value,
            "notes": l.notes,
            "logged_at": l.logged_at.isoformat() if l.logged_at else None,
        }
        for l in logs
    ]


# ─── Today summary ───────────────────────────────────────────────────────────

@router.get("/summary")
async def get_today_summary(date: str | None = None, tz_offset: int = 0, db: Session = Depends(get_db)):
    """tz_offset = minutes from getTimezoneOffset() (EST = 300, i.e. UTC-5)"""
    offset_delta = timedelta(minutes=tz_offset)
    if date:
        from datetime import date as date_type
        d = date_type.fromisoformat(date)
        # UTC start = local midnight + offset
        day_start = datetime(d.year, d.month, d.day) + offset_delta
    else:
        # local today = UTC - offset
        today_local = datetime.utcnow() - offset_delta
        # UTC start = local midnight + offset
        day_start = datetime(today_local.year, today_local.month, today_local.day) + offset_delta
    
    day_end = day_start + timedelta(days=1)
    logs = (
        db.query(HealthLog)
        .filter(
            HealthLog.user_id == DEFAULT_USER_ID,
            HealthLog.logged_at >= day_start,
            HealthLog.logged_at < day_end,
        )
        .all()
    )

    sleep_logs = [l for l in logs if l.log_type == "sleep"]
    water_logs = [l for l in logs if l.log_type == "water"]
    food_logs  = [l for l in logs if l.log_type == "food"]

    return {
        "sleep": {
            "total_hours": sum(l.value or 0 for l in sleep_logs),
            "entries": len(sleep_logs),
            "logs": [{"id": l.id, "value": l.value, "notes": l.notes, "logged_at": l.logged_at.isoformat() if l.logged_at else None} for l in sleep_logs],
        },
        "water": {
            "total_cups": sum(l.value or 0 for l in water_logs),
            "entries": len(water_logs),
            "logs": [{"id": l.id, "value": l.value, "notes": l.notes, "logged_at": l.logged_at.isoformat() if l.logged_at else None} for l in water_logs],
        },
        "food": {
            "entries": len(food_logs),
            "meals": [l.notes for l in food_logs if l.notes],
        },
    }


# ─── Delete a log entry ──────────────────────────────────────────────────────────────

@router.delete("/logs/{log_id}")
async def delete_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(HealthLog).filter(HealthLog.id == log_id, HealthLog.user_id == DEFAULT_USER_ID).first()
    if not log:
        raise HTTPException(404, "Log not found")
    db.delete(log)
    db.commit()
    return {"deleted": True}


# ─── Health Card ──────────────────────────────────────────────────────────────

@router.get("/health-card", response_model=HealthCardResponse)
async def get_health_card(db: Session = Depends(get_db)):
    user = _ensure_default_user(db)
    return HealthCardResponse(
        height=user.height,
        weight=user.weight,
        age=user.age,
        gender=user.gender,
        calorie_goal=user.calorie_goal,
    )


@router.put("/health-card", response_model=HealthCardResponse)
async def update_health_card(card: HealthCardUpdate, db: Session = Depends(get_db)):
    user = _ensure_default_user(db)
    if card.height is not None:
        user.height = card.height
    if card.weight is not None:
        user.weight = card.weight
    if card.age is not None:
        user.age = card.age
    if card.gender is not None:
        user.gender = card.gender
    if card.calorie_goal is not None:
        user.calorie_goal = card.calorie_goal
    db.commit()
    db.refresh(user)
    return HealthCardResponse(
        height=user.height,
        weight=user.weight,
        age=user.age,
        gender=user.gender,
        calorie_goal=user.calorie_goal,
    )


# ─── Food Analysis (Groq-powered) ────────────────────────────────────────────

@router.post("/food/analyze")
async def analyze_food(req: FoodLogRequest, db: Session = Depends(get_db)):
    _ensure_default_user(db)

    # Get nutrition analysis from Groq
    nutrition = await analyze_nutrition(req.description)

    # Store as a food log entry with nutrition data in notes
    log_data = {
        "meal_type": req.meal_type,
        "description": req.description,
        "nutrition": nutrition,
    }

    # Determine logged_at timestamp
    logged_at_val = datetime.utcnow()
    if req.date_str:
        try:
            d = datetime.strptime(req.date_str, "%Y-%m-%d")
            # Set time to 12:00 PM UTC on the target date
            logged_at_val = datetime(d.year, d.month, d.day, 12, 0, 0)
        except ValueError:
            pass # fallback to now if invalid

    log = HealthLog(
        user_id=DEFAULT_USER_ID,
        log_type="food",
        value=nutrition.get("totals", {}).get("calories", 0),
        notes=json.dumps(log_data),
        logged_at=logged_at_val,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    return {
        "id": log.id,
        "meal_type": req.meal_type,
        "description": req.description,
        "nutrition": nutrition,
        "logged_at": log.logged_at.isoformat() if log.logged_at else None,
    }


# ─── Get today's food logs ───────────────────────────────────────────────────

@router.get("/food/today")
async def get_todays_food(db: Session = Depends(get_db)):
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    logs = (
        db.query(HealthLog)
        .filter(
            HealthLog.user_id == DEFAULT_USER_ID,
            HealthLog.log_type == "food",
            HealthLog.logged_at >= today_start,
        )
        .order_by(HealthLog.logged_at.asc())
        .all()
    )

    meals = []
    for l in logs:
        try:
            data = json.loads(l.notes) if l.notes else {}
        except json.JSONDecodeError:
            data = {"description": l.notes, "meal_type": "snack"}

        meals.append({
            "id": l.id,
            "meal_type": data.get("meal_type", "snack"),
            "description": data.get("description", l.notes or ""),
            "calories": l.value or 0,
            "nutrition": data.get("nutrition"),
            "logged_at": l.logged_at.isoformat() if l.logged_at else None,
        })

    return {"meals": meals}

