"""
Baymax Health Insights Routes
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from db.database import get_db
from db.models import HealthLog
from core.insights_analyzer import generate_weekly_insights

router = APIRouter()

DEFAULT_USER_ID = 1


@router.get("/weekly")
async def get_weekly_insights(tz_offset: int = 0, db: Session = Depends(get_db)):
    """Get anomaly-detection insights for the past 7 days."""
    offset_delta = timedelta(minutes=tz_offset)
    # tz_offset is how many minutes to *add* to local to get UTC. So local = UTC - offset.
    today_local = datetime.utcnow() - offset_delta
    daily_data = []

    for i in range(7):
        d = today_local - timedelta(days=i)
        # To get the UTC timestamp for the start of the *local* day: UTC = local + offset
        day_start = datetime(d.year, d.month, d.day) + offset_delta
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

        sleep_total = sum(l.value or 0 for l in logs if l.log_type == "sleep")
        water_total = sum(l.value or 0 for l in logs if l.log_type == "water")
        food_logs = [l for l in logs if l.log_type == "food"]

        meals = []
        for fl in food_logs:
            if fl.notes:
                try:
                    import json
                    parsed = json.loads(fl.notes)
                    desc = parsed.get("description", fl.notes[:80])
                except (json.JSONDecodeError, TypeError):
                    desc = fl.notes[:80]
                meals.append(desc)

        daily_data.append({
            "date": d.strftime("%Y-%m-%d"),
            "sleep_hours": round(sleep_total, 1),
            "water_cups": round(water_total, 1),
            "meals": meals,
        })

    insights = await generate_weekly_insights(daily_data)
    return {"insights": insights, "period": f"{daily_data[-1]['date']} to {daily_data[0]['date']}"}
