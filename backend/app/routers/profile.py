"""Perfil del explorador (sin login: se crea al primer ingreso)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import services
from ..database import get_db
from ..models import Child
from ..schemas import ChildCreate, ChildOut

router = APIRouter(prefix="/child", tags=["profile"])


@router.post("", response_model=ChildOut)
def create_child(payload: ChildCreate, db: Session = Depends(get_db)) -> Child:
    return services.get_or_create_child(db, None, payload.name, payload.avatar)


@router.get("/by-code/{code}", response_model=ChildOut)
def get_child_by_code(code: str, db: Session = Depends(get_db)) -> Child:
    """Vincular otro dispositivo: buscar un explorador por su código."""
    child = services.get_child_by_code(db, code)
    if child is None:
        raise HTTPException(status_code=404, detail="No encontramos ese código de explorador")
    return child


@router.get("/{child_id}", response_model=ChildOut)
def get_child(child_id: int, db: Session = Depends(get_db)) -> Child:
    child = db.get(Child, child_id)
    if child is None:
        raise HTTPException(status_code=404, detail="Explorador no encontrado")
    return child
