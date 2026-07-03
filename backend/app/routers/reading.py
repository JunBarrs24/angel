"""Guardar y retomar el progreso de lectura."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import services
from ..database import get_db
from ..models import ReadingSession
from ..schemas import ReadingStateOut, ReadingUpdateIn

router = APIRouter(prefix="/reading", tags=["reading"])


@router.post("", response_model=ReadingStateOut)
def save_reading(payload: ReadingUpdateIn, db: Session = Depends(get_db)) -> ReadingStateOut:
    challenge = services.get_challenge_by_day(db, payload.day_number)
    if challenge is None:
        raise HTTPException(status_code=404, detail="Ese día no existe")

    # No dejar que el índice se pase del total de palabras.
    last_index = max(0, min(payload.last_word_index, challenge.word_count))
    words_read = max(payload.words_read, last_index)
    if payload.finished:
        # Al terminar contamos toda la historia para las estadísticas, pero
        # CONSERVAMOS last_word_index (hasta dónde fue tocando el niño) para que
        # el repaso de un adulto muestre su avance real y no siempre el 100%.
        words_read = challenge.word_count

    session = services.get_reading_session(db, payload.child_id, challenge.id)
    if session is None:
        session = ReadingSession(
            child_id=payload.child_id,
            day_challenge_id=challenge.id,
            seconds_elapsed=0,
            last_word_index=0,
            words_read=0,
            finished=False,
        )
        db.add(session)

    # El tiempo y las palabras solo avanzan (nunca retroceden).
    session.seconds_elapsed = max(session.seconds_elapsed, payload.seconds_elapsed)
    session.last_word_index = last_index
    session.words_read = max(session.words_read, words_read)
    session.finished = session.finished or payload.finished
    db.commit()
    db.refresh(session)

    return ReadingStateOut(
        seconds_elapsed=session.seconds_elapsed,
        last_word_index=session.last_word_index,
        words_read=session.words_read,
        finished=session.finished,
    )
