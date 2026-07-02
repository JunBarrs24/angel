"""Retos: el día de hoy, un día concreto y el mapa de la aventura."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import services
from ..config import settings
from ..database import get_db
from ..models import DayChallenge, DayCompletion
from ..schemas import (
    CompletionOut,
    DayChallengeOut,
    MapItemOut,
    MapOut,
    MathProblemOut,
    QuestionOut,
    ReadingStateOut,
)

router = APIRouter(tags=["challenges"])


def _today(as_of: date | None) -> date:
    """Permite forzar la fecha (para probar/preview) con ?as_of=YYYY-MM-DD."""
    return as_of or date.today()


def _build_day_out(
    db: Session, challenge: DayChallenge, child_id: int, today: date
) -> DayChallengeOut:
    reading = services.get_reading_session(db, child_id, challenge.id)
    completion = services.get_completion(db, child_id, challenge.id)
    return DayChallengeOut(
        day_number=challenge.day_number,
        date=challenge.date,
        dino_name=challenge.dino_name,
        dino_emoji=challenge.dino_emoji,
        title=challenge.title,
        story=challenge.story,
        word_count=challenge.word_count,
        questions=[
            QuestionOut(id=q.id, order=q.order, prompt=q.prompt, options=q.options)
            for q in challenge.questions
        ],
        math=[MathProblemOut(**m) for m in services.build_math(challenge.day_number)],
        reading=ReadingStateOut(
            seconds_elapsed=reading.seconds_elapsed if reading else 0,
            last_word_index=reading.last_word_index if reading else 0,
            words_read=reading.words_read if reading else 0,
            finished=reading.finished if reading else False,
        ),
        completion=(
            CompletionOut(
                stars=completion.stars,
                questions_correct=completion.questions_correct,
                questions_total=completion.questions_total,
                math_correct=completion.math_correct,
                math_total=completion.math_total,
            )
            if completion
            else None
        ),
        is_today=challenge.date == today,
        is_locked=services.is_locked(challenge, today),
    )


@router.get("/today", response_model=DayChallengeOut)
def get_today(
    child_id: int,
    as_of: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> DayChallengeOut:
    today = _today(as_of)
    challenge = services.get_challenge_by_date(db, today)
    if challenge is None:
        # Fuera del rango del juego: devuelve el primero o el último según corresponda.
        raise HTTPException(
            status_code=404,
            detail="Hoy no hay reto (la aventura corre del 7 de julio al 15 de agosto).",
        )
    return _build_day_out(db, challenge, child_id, today)


@router.get("/day/{day_number}", response_model=DayChallengeOut)
def get_day(
    day_number: int,
    child_id: int,
    as_of: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> DayChallengeOut:
    today = _today(as_of)
    challenge = services.get_challenge_by_day(db, day_number)
    if challenge is None:
        raise HTTPException(status_code=404, detail="Ese día no existe")
    if services.is_locked(challenge, today):
        raise HTTPException(status_code=403, detail="Ese planeta todavía está bloqueado")
    return _build_day_out(db, challenge, child_id, today)


@router.get("/map", response_model=MapOut)
def get_map(
    child_id: int,
    as_of: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> MapOut:
    today = _today(as_of)
    challenges = list(db.scalars(select(DayChallenge).order_by(DayChallenge.day_number)))
    completed_ids = set(
        db.scalars(select(DayCompletion.day_challenge_id).where(DayCompletion.child_id == child_id))
    )
    stars_by_id = {
        c.day_challenge_id: c.stars
        for c in db.scalars(select(DayCompletion).where(DayCompletion.child_id == child_id))
    }
    items = [
        MapItemOut(
            day_number=c.day_number,
            date=c.date,
            dino_name=c.dino_name,
            dino_emoji=c.dino_emoji,
            title=c.title,
            status=services.day_status(c, today, c.id in completed_ids),
            stars=stars_by_id.get(c.id, 0),
        )
        for c in challenges
    ]
    return MapOut(
        game_start=settings.game_start_date,
        game_end=settings.game_end_date,
        today=today,
        days=items,
    )
