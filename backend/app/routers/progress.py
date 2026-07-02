"""Progreso global del explorador: estrellas, racha, medallas."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .. import services
from ..database import get_db
from ..schemas import ProgressOut

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("", response_model=ProgressOut)
def get_progress(
    child_id: int,
    as_of: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> ProgressOut:
    today = as_of or date.today()
    data = services.compute_progress(db, child_id, today)
    return ProgressOut(**data)
