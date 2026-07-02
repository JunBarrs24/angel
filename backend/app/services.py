"""Lógica de negocio compartida entre routers (sin acoplarse a FastAPI)."""

from __future__ import annotations

from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import gamification, math_gen
from .config import settings
from .models import Child, DayChallenge, DayCompletion, ReadingSession


def get_or_create_child(db: Session, child_id: int | None, name: str | None, avatar: str | None) -> Child:
    if child_id is not None:
        child = db.get(Child, child_id)
        if child is not None:
            return child
    child = Child(
        name=name or settings.child_name,
        avatar=avatar or "rex",
    )
    db.add(child)
    db.commit()
    db.refresh(child)
    return child


def get_challenge_by_day(db: Session, day_number: int) -> DayChallenge | None:
    return db.scalar(select(DayChallenge).where(DayChallenge.day_number == day_number))


def get_challenge_by_date(db: Session, on: date) -> DayChallenge | None:
    return db.scalar(select(DayChallenge).where(DayChallenge.date == on))


def day_status(challenge: DayChallenge, today: date, completed: bool) -> str:
    if completed:
        return "completed"
    if challenge.date == today:
        return "today"
    if challenge.date <= today:
        return "available"
    return "locked"


def is_locked(challenge: DayChallenge, today: date) -> bool:
    return challenge.date > today


def get_reading_session(db: Session, child_id: int, day_id: int) -> ReadingSession | None:
    return db.scalar(
        select(ReadingSession).where(
            ReadingSession.child_id == child_id,
            ReadingSession.day_challenge_id == day_id,
        )
    )


def get_completion(db: Session, child_id: int, day_id: int) -> DayCompletion | None:
    return db.scalar(
        select(DayCompletion).where(
            DayCompletion.child_id == child_id,
            DayCompletion.day_challenge_id == day_id,
        )
    )


def compute_progress(db: Session, child_id: int, today: date) -> dict:
    completions = list(
        db.scalars(select(DayCompletion).where(DayCompletion.child_id == child_id))
    )
    # Fechas completadas (para racha) vía join con DayChallenge.
    completed_dates: list[date] = []
    total_stars = 0
    total_words = 0
    had_perfect_math = False
    for c in completions:
        total_stars += c.stars
        total_words += c.reading_words
        if c.math_total > 0 and c.math_correct == c.math_total:
            had_perfect_math = True
        challenge = db.get(DayChallenge, c.day_challenge_id)
        if challenge is not None:
            completed_dates.append(challenge.date)

    streak = gamification.compute_streak(completed_dates, today)
    best_streak = gamification.best_streak_from_dates(completed_dates)
    badges = gamification.compute_badges(
        days_completed=len(completions),
        best_streak=best_streak,
        total_words=total_words,
        total_stars=total_stars,
        had_perfect_math_day=had_perfect_math,
    )
    total_days = len(list(db.scalars(select(DayChallenge.day_number))))

    return {
        "total_stars": total_stars,
        "streak": streak,
        "best_streak": best_streak,
        "days_completed": len(completions),
        "days_total": total_days,
        "total_words": total_words,
        "badges": badges,
        "game_start": settings.game_start_date,
        "game_end": settings.game_end_date,
    }


def build_math(day_number: int) -> list[dict]:
    return [p.public() for p in math_gen.generate(day_number)]
