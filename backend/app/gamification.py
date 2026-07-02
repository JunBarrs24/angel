"""Lógica de gamificación: estrellas, racha y medallas.

Se mantiene como funciones puras (sin DB) para poder testearlas fácilmente.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

MAX_STARS = 3


def compute_stars(
    *,
    reading_finished: bool,
    questions_correct: int,
    questions_total: int,
    math_correct: int,
    math_total: int,
) -> int:
    """1 estrella por completar, +1 si todas las preguntas bien, +1 si toda la mate bien."""
    stars = 1  # por terminar el reto del día
    if questions_total > 0 and questions_correct == questions_total:
        stars += 1
    if math_total > 0 and math_correct == math_total:
        stars += 1
    return min(stars, MAX_STARS)


def compute_streak(completed_dates: list[date], today: date) -> int:
    """Días consecutivos completados terminando en hoy o ayer.

    Si el último día completado es hoy o ayer, cuenta hacia atrás sin huecos.
    """
    if not completed_dates:
        return 0
    days = set(completed_dates)
    # La racha sigue "viva" si se completó hoy o ayer.
    anchor = today if today in days else today - timedelta(days=1)
    if anchor not in days:
        return 0
    streak = 0
    cursor = anchor
    while cursor in days:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


@dataclass(frozen=True)
class Badge:
    key: str
    emoji: str
    title: str
    description: str


# Catálogo de medallas. `earned` se calcula en compute_badges.
BADGE_CATALOG: list[Badge] = [
    Badge("primer_dia", "🥚", "¡Nace la aventura!", "Completaste tu primer día."),
    Badge("racha_3", "🔥", "En racha", "3 días seguidos."),
    Badge("racha_7", "🌟", "¡Una semana!", "7 días seguidos."),
    Badge("racha_15", "🏆", "Explorador experto", "15 días seguidos."),
    Badge("lector_1000", "📚", "Mil palabras", "Leíste 1000 palabras en total."),
    Badge("lector_5000", "🦖", "Gran lector", "Leíste 5000 palabras en total."),
    Badge("mate_perfecto", "🧮", "Mate perfecta", "Un día con toda la mate correcta."),
    Badge("coleccionista", "💎", "Coleccionista", "Ganaste 30 estrellas."),
]


def compute_badges(
    *,
    days_completed: int,
    best_streak: int,
    total_words: int,
    total_stars: int,
    had_perfect_math_day: bool,
) -> list[dict]:
    """Devuelve el catálogo con un flag `earned` por cada medalla."""
    earned_keys: set[str] = set()
    if days_completed >= 1:
        earned_keys.add("primer_dia")
    if best_streak >= 3:
        earned_keys.add("racha_3")
    if best_streak >= 7:
        earned_keys.add("racha_7")
    if best_streak >= 15:
        earned_keys.add("racha_15")
    if total_words >= 1000:
        earned_keys.add("lector_1000")
    if total_words >= 5000:
        earned_keys.add("lector_5000")
    if had_perfect_math_day:
        earned_keys.add("mate_perfecto")
    if total_stars >= 30:
        earned_keys.add("coleccionista")

    return [
        {
            "key": b.key,
            "emoji": b.emoji,
            "title": b.title,
            "description": b.description,
            "earned": b.key in earned_keys,
        }
        for b in BADGE_CATALOG
    ]


def best_streak_from_dates(completed_dates: list[date]) -> int:
    """La racha consecutiva más larga en el historial (para medallas)."""
    if not completed_dates:
        return 0
    days = sorted(set(completed_dates))
    best = 1
    current = 1
    for prev, curr in zip(days, days[1:], strict=False):
        if curr - prev == timedelta(days=1):
            current += 1
            best = max(best, current)
        else:
            current = 1
    return best
