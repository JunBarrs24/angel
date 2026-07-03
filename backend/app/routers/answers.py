"""Corregir respuestas de comprensión y de matemáticas, y completar el día.

- ``/answers/comprehension`` y ``/answers/math`` dan feedback inmediato durante el
  juego (para el ✓ verde de cada respuesta) y NO guardan nada.
- ``/answers/complete`` es el envío final: el servidor califica de forma autoritativa
  las respuestas recibidas, las combina con la sesión de lectura, calcula estrellas y
  guarda el ``DayCompletion``.
"""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import gamification, math_gen, services
from ..database import get_db
from ..models import DayChallenge, DayCompletion
from ..schemas import (
    BadgeOut,
    CompleteIn,
    CompleteResultOut,
    ComprehensionIn,
    ComprehensionResultOut,
    MathIn,
    MathResultOut,
)

router = APIRouter(prefix="/answers", tags=["answers"])


def _grade_comprehension(
    challenge: DayChallenge, answers: list[int]
) -> tuple[int, int, list[bool], list[int]]:
    per_item: list[bool] = []
    correct_indices: list[int] = []
    for idx, q in enumerate(challenge.questions):
        given = answers[idx] if idx < len(answers) else -1
        per_item.append(given == q.correct_index)
        correct_indices.append(q.correct_index)
    return sum(per_item), len(challenge.questions), per_item, correct_indices


@router.post("/comprehension", response_model=ComprehensionResultOut)
def check_comprehension(
    payload: ComprehensionIn, db: Session = Depends(get_db)
) -> ComprehensionResultOut:
    challenge = services.get_challenge_by_day(db, payload.day_number)
    if challenge is None:
        raise HTTPException(status_code=404, detail="Ese día no existe")
    correct, total, per_item, correct_indices = _grade_comprehension(challenge, payload.answers)
    return ComprehensionResultOut(
        correct=correct, total=total, per_item=per_item, correct_indices=correct_indices
    )


@router.post("/math", response_model=MathResultOut)
def check_math(payload: MathIn, db: Session = Depends(get_db)) -> MathResultOut:
    correct, total, per_item = math_gen.check_answers(payload.day_number, payload.answers)
    correct_answers = [p.answer for p in math_gen.generate(payload.day_number)]
    return MathResultOut(
        correct=correct, total=total, per_item=per_item, correct_answers=correct_answers
    )


@router.post("/complete", response_model=CompleteResultOut)
def complete_day(payload: CompleteIn, db: Session = Depends(get_db)) -> CompleteResultOut:
    challenge = services.get_challenge_by_day(db, payload.day_number)
    if challenge is None:
        raise HTTPException(status_code=404, detail="Ese día no existe")

    today = date.today()

    # Si ya estaba completado, no volvemos a otorgar estrellas (idempotente).
    existing = services.get_completion(db, payload.child_id, challenge.id)
    if existing is not None:
        after = services.compute_progress(db, payload.child_id, today)
        return CompleteResultOut(
            stars=existing.stars,
            total_stars=after["total_stars"],
            streak=after["streak"],
            already_completed=True,
            newly_earned_badges=[],
        )

    # Medallas antes de completar, para detectar cuáles son nuevas.
    before = services.compute_progress(db, payload.child_id, today)
    before_earned = {b["key"] for b in before["badges"] if b["earned"]}

    # Calificación autoritativa en el servidor.
    q_correct, q_total, _, _ = _grade_comprehension(challenge, payload.comprehension_answers)
    m_correct, m_total, _ = math_gen.check_answers(payload.day_number, payload.math_answers)

    reading = services.get_reading_session(db, payload.child_id, challenge.id)
    reading_finished = bool(reading and reading.finished)
    reading_words = reading.words_read if reading else 0

    stars = gamification.compute_stars(
        reading_finished=reading_finished,
        questions_correct=q_correct,
        questions_total=q_total,
        math_correct=m_correct,
        math_total=m_total,
    )

    db.add(
        DayCompletion(
            child_id=payload.child_id,
            day_challenge_id=challenge.id,
            stars=stars,
            reading_words=reading_words,
            questions_correct=q_correct,
            questions_total=q_total,
            math_correct=m_correct,
            math_total=m_total,
            comprehension_answers=list(payload.comprehension_answers),
            math_answers=list(payload.math_answers),
        )
    )
    db.commit()

    after = services.compute_progress(db, payload.child_id, today)
    after_badges = {b["key"]: b for b in after["badges"] if b["earned"]}
    newly = [BadgeOut(**after_badges[k]) for k in after_badges if k not in before_earned]

    return CompleteResultOut(
        stars=stars,
        total_stars=after["total_stars"],
        streak=after["streak"],
        already_completed=False,
        newly_earned_badges=newly,
    )
