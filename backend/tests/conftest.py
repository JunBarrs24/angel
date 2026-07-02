"""Fixtures compartidas para los tests de la API.

Monta una base de datos SQLite en memoria (aislada por test), crea las tablas,
inserta un par de ``DayChallenge`` con preguntas y un ``Child``, y entrega un
``TestClient`` con la dependencia ``get_db`` sobreescrita.
"""

from __future__ import annotations

from collections.abc import Generator
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app import math_gen
from app.database import Base, get_db
from app.main import app
from app.models import Child, DayChallenge, Question

# Fechas de los dos días de prueba (dentro del rango del juego).
DAY1_DATE = date(2026, 7, 7)
DAY2_DATE = date(2026, 7, 8)


def _make_challenge(day_number: int, on: date, story: str, questions: list[dict]) -> DayChallenge:
    return DayChallenge(
        day_number=day_number,
        date=on,
        dino_name=f"Dino {day_number}",
        dino_emoji="🦖",
        title=f"Aventura {day_number}",
        story=story,
        word_count=len(story.split()),
        math_max=math_gen.difficulty_max(day_number),
        questions=[
            Question(
                order=i,
                prompt=q["prompt"],
                options=q["options"],
                correct_index=q["correct_index"],
            )
            for i, q in enumerate(questions)
        ],
    )


def _seed(db: Session) -> None:
    story1 = " ".join(f"palabra{i}" for i in range(30))
    story2 = " ".join(f"texto{i}" for i in range(25))
    db.add(Child(id=1, name="Ángel Eduardo", avatar="rex"))
    db.add(
        _make_challenge(
            1,
            DAY1_DATE,
            story1,
            [
                {"prompt": "P1", "options": ["a", "b", "c"], "correct_index": 0},
                {"prompt": "P2", "options": ["a", "b", "c"], "correct_index": 2},
                {"prompt": "P3", "options": ["a", "b", "c"], "correct_index": 1},
            ],
        )
    )
    db.add(
        _make_challenge(
            2,
            DAY2_DATE,
            story2,
            [
                {"prompt": "P1", "options": ["a", "b", "c"], "correct_index": 1},
                {"prompt": "P2", "options": ["a", "b", "c"], "correct_index": 0},
                {"prompt": "P3", "options": ["a", "b", "c"], "correct_index": 2},
            ],
        )
    )
    db.commit()


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    """Sesión sobre una DB SQLite en memoria, aislada y ya sembrada."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    testing_session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    db = testing_session()
    _seed(db)
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """TestClient con get_db apuntando a la sesión de prueba."""

    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    # Sin el context manager de TestClient para NO disparar el lifespan
    # (que crearía la DB real vía create_all sobre el engine de módulo).
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
