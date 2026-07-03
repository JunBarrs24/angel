"""Motor de base de datos y sesión de SQLAlchemy."""

from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings

DATABASE_URL = settings.resolved_database_url

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_all() -> None:
    """Crea las tablas si no existen. Idempotente; seguro en cada arranque."""
    # Importa los modelos para registrarlos en el metadata antes de create_all.
    from . import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _ensure_child_code()


def _ensure_child_code() -> None:
    """Migración suave: agrega child.code si falta y genera códigos faltantes.

    Sirve para bases ya desplegadas (SQLite o Postgres) sin usar Alembic.
    """
    from sqlalchemy import inspect, text

    columns = {col["name"] for col in inspect(engine).get_columns("child")}
    if "code" not in columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE child ADD COLUMN code VARCHAR"))

    from . import services

    db = SessionLocal()
    try:
        services.backfill_child_codes(db)
    finally:
        db.close()
