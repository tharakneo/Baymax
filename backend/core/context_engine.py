"""
Baymax Context Engine
=====================
Pulls recent user health data from PostgreSQL and builds a natural language
context summary that gets injected into Baymax's system prompt.

This is what makes Baymax a real companion — he connects dots across modules:
  - "I feel like puking" + logged junk food yesterday = meaningful response
  - "I have a headache" + 5hrs sleep logged = meaningful response
  - "I feel anxious" + declining mood trend = meaningful response
"""

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from db.models import HealthLog, Message, Conversation
import re

# ─── Health-related keyword detection ────────────────────────────────────────
# If a message contains any of these, we pull user context before responding.
HEALTH_KEYWORDS = {
    # Symptoms
    "pain", "ache", "hurt", "hurting", "sore", "nausea", "nauseous", "puke",
    "vomit", "dizzy", "dizziness", "tired", "fatigue", "fatigued", "exhausted",
    "headache", "fever", "cough", "cold", "flu", "sick", "ill", "unwell",
    "rash", "itch", "itchy", "swollen", "swelling", "bleed", "bleeding",
    "burn", "burning", "cramp", "cramping", "bloated", "bloating", "constipated",
    "diarrhea", "shortness", "breath", "breathing", "chest", "heart",
    "anxious", "anxiety", "depressed", "depression", "stress", "stressed",
    "sad", "hopeless", "panic", "overwhelmed", "mood", "mental",
    "chill", "chills", "sweat", "sweating", "pulse", "beat", "palpitation",

    # Body parts
    "head", "stomach", "back", "throat", "eye", "eyes", "skin", "leg",
    "arm", "shoulder", "neck", "knee", "foot", "feet", "hand", "wrist",
    "bowel", "gut",

    # Health activities / functions
    "sleep", "slept", "sleeping", "insomnia", "ate", "eat", "eating",
    "food", "drink", "drinking", "water", "exercise", "workout", "weight",
    "urine", "pee", "urinate", "dehydrate", "dehydrated", "dehydration", "thirst", "thirsty",
    "poop", "stool", "gas", "gassy", "acid", "reflux", "heartburn",

    # Medical terms
    "symptom", "diagnosis", "medicine", "medication", "pill", "doctor",
    "hospital", "allergy", "allergic", "infection", "virus", "bacteria",
    "diabetes", "pressure", "sugar", "cholesterol", "vitamin", "supplement",
}


def is_health_related(message: str) -> bool:
    """
    Lightweight check — does this message warrant pulling health context?
    Returns True if any health keyword is found in the message.
    """
    message_lower = message.lower()
    words = set(re.findall(r'\b\w+\b', message_lower))
    return bool(words & HEALTH_KEYWORDS)


async def get_user_context(user_id: int, db: Session, days: int = 3) -> str:
    """
    Pulls last N days of health data for a user and returns a natural
    language summary to inject into Baymax's system prompt.

    Args:
        user_id: The user's ID
        db: SQLAlchemy DB session
        days: How many days back to look (default 3)

    Returns:
        A natural language string summarizing the user's recent health data,
        or empty string if no data exists yet.
    """
    if not user_id:
        return ""

    since = datetime.utcnow() - timedelta(days=days)

    # ── Pull health logs ──────────────────────────────────────────────────────
    logs = db.query(HealthLog).filter(
        HealthLog.user_id == user_id,
        HealthLog.logged_at >= since,
    ).all()

    if not logs:
        return ""

    # ── Organize by type ──────────────────────────────────────────────────────
    sleep_logs = [l for l in logs if l.log_type == "sleep"]
    mood_logs = [l for l in logs if l.log_type == "mood"]
    water_logs = [l for l in logs if l.log_type == "water"]
    symptom_logs = [l for l in logs if l.log_type == "symptom"]
    nutrition_logs = [l for l in logs if l.log_type == "nutrition"]
    exercise_logs = [l for l in logs if l.log_type == "exercise"]
    weight_logs = [l for l in logs if l.log_type == "weight"]

    context_parts = [f"User health data (last {days} days):"]

    # ── Sleep ─────────────────────────────────────────────────────────────────
    if sleep_logs:
        avg_sleep = _daily_average(sleep_logs)
        trend = _get_trend([l.value for l in sleep_logs if l.value]) # Trend can stay raw or be updated later
        if avg_sleep < 7:
            qualifier = "below recommended. They may be exhausted. If they complain about a headache or fatigue, point out their low sleep."
            context_parts.append(
                f"- Sleep logged recently: averaging {avg_sleep:.1f} hours/night ({qualifier}){trend}"
            )
        else:
            context_parts.append(
                f"- SLEEP STATUS: User has logged adequate sleep ({avg_sleep:.1f} hours/night){trend}. DO NOT ASK IF THEY ARE SLEEPING ENOUGH. If they complain about a symptom like a headache or fatigue, explicitly reassure them that their sleep looks healthy and investigate other causes."
            )

    # ── Mood ──────────────────────────────────────────────────────────────────
    if mood_logs:
        avg_mood = sum(l.value for l in mood_logs if l.value) / len(mood_logs)
        trend = _get_trend([l.value for l in mood_logs if l.value])
        mood_label = _mood_label(avg_mood)
        context_parts.append(
            f"- Mood: averaging {avg_mood:.1f}/10 ({mood_label}){trend}"
        )

    # ── Water intake ──────────────────────────────────────────────────────────
    if water_logs:
        # Sum all water logs for the same day, then average those daily totals cross the period
        avg_water = _daily_average(water_logs)
        if avg_water < 6:
            qualifier = "low — they may be dehydrated"
            context_parts.append(
                f"- Water intake logged today: averaging {avg_water:.1f} cups/day ({qualifier})"
            )
        else:
            qualifier = "adequate"
            context_parts.append(
                f"- HYDRATION STATUS: User has logged adequate water intake ({avg_water:.1f} cups/day). DO NOT ASK IF THEY HAVE DRANK ENOUGH WATER. If they complain about yellow urine or thirst, reassure them their water intake looks healthy and suggest other causes."
            )

    # ── Recent symptoms ───────────────────────────────────────────────────────
    if symptom_logs:
        symptom_notes = [l.notes for l in symptom_logs if l.notes]
        if symptom_notes:
            recent = symptom_notes[-3:]  # last 3 symptom notes
            context_parts.append(
                f"- Recent symptoms logged: {', '.join(recent)}"
            )

    # ── Recent nutrition ──────────────────────────────────────────────────────
    if nutrition_logs:
        nutrition_notes = [l.notes for l in nutrition_logs if l.notes]
        if nutrition_notes:
            recent = nutrition_notes[-3:]
            context_parts.append(
                f"- Recent meals logged: {', '.join(recent)}"
            )

    # ── Exercise ──────────────────────────────────────────────────────────────
    if exercise_logs:
        total_exercise = sum(l.value for l in exercise_logs if l.value)
        context_parts.append(
            f"- Exercise: {total_exercise:.0f} minutes total in last {days} days"
        )

    # ── Weight ────────────────────────────────────────────────────────────────
    if weight_logs:
        latest_weight = weight_logs[-1].value
        if latest_weight:
            context_parts.append(f"- Latest weight logged: {latest_weight} kg")

    # ── Anomaly detection (simple rules) ─────────────────────────────────────
    anomalies = _detect_anomalies(sleep_logs, mood_logs, water_logs)
    if anomalies:
        context_parts.append(f"- Notable patterns: {'; '.join(anomalies)}")

    # ── Return context string ─────────────────────────────────────────────────
    if len(context_parts) == 1:
        return ""  # Only had the header, no real data

    return "\n".join(context_parts)

def _daily_average(logs) -> float:
    """
    Groups health logs by calendar day, sums the values for each day, 
    and returns the average of those daily totals.
    This is critical for cumulative metrics like water and sleep, where 
    the user may add multiple partial entries throughout the same day.
    """
    if not logs:
        return 0.0
    
    daily_totals = {}
    for l in logs:
        if l.value and l.logged_at:
            day_str = l.logged_at.strftime("%Y-%m-%d")
            daily_totals[day_str] = daily_totals.get(day_str, 0) + l.value

    if not daily_totals:
        return 0.0

    return sum(daily_totals.values()) / len(daily_totals)

def _get_trend(values: list) -> str:
    """Returns a trend description if values are consistently going up or down."""
    if len(values) < 2:
        return ""
    diffs = [values[i+1] - values[i] for i in range(len(values)-1)]
    if all(d < 0 for d in diffs):
        return " (declining trend)"
    if all(d > 0 for d in diffs):
        return " (improving trend)"
    return ""


def _mood_label(avg: float) -> str:
    if avg >= 8:
        return "good"
    elif avg >= 6:
        return "moderate"
    elif avg >= 4:
        return "low"
    else:
        return "very low"


def _detect_anomalies(sleep_logs, mood_logs, water_logs) -> list:
    """Simple rule-based anomaly detection across recent logs."""
    anomalies = []

    # Sleep dropping consistently
    sleep_values = [l.value for l in sleep_logs if l.value]
    if len(sleep_values) >= 3:
        if all(sleep_values[i] > sleep_values[i+1] for i in range(len(sleep_values)-1)):
            anomalies.append("sleep has been declining each day")
        if all(v < 6 for v in sleep_values):
            anomalies.append(f"consistently low sleep for {len(sleep_values)} days")

    # Mood dropping consistently
    mood_values = [l.value for l in mood_logs if l.value]
    if len(mood_values) >= 3:
        if all(mood_values[i] > mood_values[i+1] for i in range(len(mood_values)-1)):
            anomalies.append("mood has been declining each day")
        if all(v <= 4 for v in mood_values):
            anomalies.append("consistently low mood — may benefit from support")

    # Low water intake
    water_values = [l.value for l in water_logs if l.value]
    if water_values and all(v < 4 for v in water_values):
        anomalies.append("very low water intake — possible dehydration risk")

    return anomalies
