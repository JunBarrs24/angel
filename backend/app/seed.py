"""Carga inicial de datos: crea las tablas y siembra los 40 días de retos.

Ejecutable con ``python -m app.seed``.

- Llama a ``create_all()`` (idempotente).
- Lee TODOS los ``app/content/days_*.json`` y los inserta en ``day_challenge``
  (con sus ``question``), calculando ``word_count`` y ``math_max``.
- Asigna ``date = GAME_START_DATE + (day_number - 1) días``.
- Es IDEMPOTENTE: no duplica un ``day_number`` que ya exista.
- Crea un ``Child`` por defecto si aún no hay ninguno.
"""

from __future__ import annotations

import json
from datetime import timedelta
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import math_gen
from .config import settings
from .database import SessionLocal, create_all
from .models import Child, DayChallenge, Question

CONTENT_DIR = Path(__file__).parent / "content"


def load_content() -> list[dict]:
    """Lee todos los días de los JSON de contenido, ordenados por day_number."""
    days: list[dict] = []
    for path in sorted(CONTENT_DIR.glob("days_*.json")):
        with path.open(encoding="utf-8") as fh:
            days.extend(json.load(fh))
    days.sort(key=lambda d: d["day_number"])
    return days


def seed_challenges(db: Session, days: list[dict]) -> tuple[int, int]:
    """Inserta los retos que falten. Devuelve (creados, omitidos)."""
    existing = set(db.scalars(select(DayChallenge.day_number)))
    created = 0
    skipped = 0
    for day in days:
        day_number = day["day_number"]
        if day_number in existing:
            skipped += 1
            continue

        story = day["story"]
        challenge = DayChallenge(
            day_number=day_number,
            date=settings.game_start_date + timedelta(days=day_number - 1),
            dino_name=day["dino_name"],
            dino_emoji=day.get("dino_emoji", "🦕"),
            title=day["title"],
            story=story,
            word_count=len(story.split()),
            math_max=math_gen.difficulty_max(day_number),
            questions=[
                Question(
                    order=order,
                    prompt=q["prompt"],
                    options=q["options"],
                    correct_index=q["correct_index"],
                )
                for order, q in enumerate(day["questions"])
            ],
        )
        db.add(challenge)
        created += 1

    db.commit()
    return created, skipped


def ensure_default_child(db: Session) -> Child | None:
    """Crea un Child por defecto si la tabla está vacía."""
    if db.scalar(select(Child).limit(1)) is not None:
        return None
    child = Child(name=settings.child_name, avatar="rex")
    db.add(child)
    db.commit()
    db.refresh(child)
    return child


def run() -> None:
    create_all()
    days = load_content()
    with SessionLocal() as db:
        created, skipped = seed_challenges(db, days)
        child = ensure_default_child(db)

    print(f"Retos: {created} creados, {skipped} ya existían (total contenido: {len(days)}).")
    if child is not None:
        print(f"Child por defecto creado: id={child.id} nombre={child.name!r}.")
    else:
        print("Ya existía al menos un Child; no se creó ninguno.")


if __name__ == "__main__":
    run()
