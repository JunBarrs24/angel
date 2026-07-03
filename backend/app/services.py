"""Lógica de negocio compartida entre routers (sin acoplarse a FastAPI)."""

from __future__ import annotations

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from . import gamification, math_gen
from .config import settings
from .models import Child, DayChallenge, DayCompletion, ReadingSession, Redemption


def get_or_create_child(
    db: Session, child_id: int | None, name: str | None, avatar: str | None
) -> Child:
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


def day_status(challenge: DayChallenge, completed_ids: set[int], completed_days: set[int]) -> str:
    """Estado de un día para el mapa, basado en el PROGRESO (no en la fecha).

    Un día se juega cuando el día anterior ya está completado (el día 1 siempre
    está disponible). Así el niño avanza uno a uno al terminar cada reto.
    """
    if challenge.id in completed_ids:
        return "completed"
    if challenge.day_number <= 1 or (challenge.day_number - 1) in completed_days:
        return "today"
    return "locked"


def is_day_unlocked(db: Session, child_id: int, challenge: DayChallenge) -> bool:
    """¿El niño puede jugar este día? Sí si es el 1.º o si completó el anterior."""
    if challenge.day_number <= 1:
        return True
    prev = get_challenge_by_day(db, challenge.day_number - 1)
    if prev is None:
        return True
    return get_completion(db, child_id, prev.id) is not None


def is_locked(db: Session, child_id: int, challenge: DayChallenge) -> bool:
    # Un día ya completado siempre es accesible (para repasarlo).
    if get_completion(db, child_id, challenge.id) is not None:
        return False
    return not is_day_unlocked(db, child_id, challenge)


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


def stars_earned(db: Session, child_id: int) -> int:
    """Estrellas ganadas en total (histórico, nunca baja)."""
    total = db.scalar(
        select(func.coalesce(func.sum(DayCompletion.stars), 0)).where(
            DayCompletion.child_id == child_id
        )
    )
    return int(total or 0)


def stars_spent(db: Session, child_id: int) -> int:
    """Estrellas gastadas en la tienda."""
    total = db.scalar(
        select(func.coalesce(func.sum(Redemption.cost), 0)).where(Redemption.child_id == child_id)
    )
    return int(total or 0)


def list_redemptions(db: Session, child_id: int) -> list[Redemption]:
    return list(
        db.scalars(
            select(Redemption)
            .where(Redemption.child_id == child_id)
            .order_by(Redemption.created_at.desc(), Redemption.id.desc())
        )
    )


def compute_progress(db: Session, child_id: int, today: date) -> dict:
    completions = list(db.scalars(select(DayCompletion).where(DayCompletion.child_id == child_id)))
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
    spent = stars_spent(db, child_id)

    return {
        "total_stars": total_stars,
        "stars_spent": spent,
        "stars_available": max(0, total_stars - spent),
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
