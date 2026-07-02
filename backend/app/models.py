"""Modelos ORM (SQLAlchemy 2.0)."""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import JSON, ForeignKey, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Child(Base):
    """El explorador que juega (perfil simple, sin login)."""

    __tablename__ = "child"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(default="Ángel Eduardo")
    avatar: Mapped[str] = mapped_column(default="rex")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class DayChallenge(Base):
    """El reto de un día: un dinosaurio, una historia y sus preguntas."""

    __tablename__ = "day_challenge"

    id: Mapped[int] = mapped_column(primary_key=True)
    day_number: Mapped[int] = mapped_column(unique=True)
    date: Mapped[date] = mapped_column(unique=True)
    dino_name: Mapped[str]
    dino_emoji: Mapped[str] = mapped_column(default="🦕")
    title: Mapped[str]
    story: Mapped[str] = mapped_column(Text)
    word_count: Mapped[int]
    # Máximo de los operandos de mate ese día (rampa de dificultad, hasta 1000).
    math_max: Mapped[int]

    questions: Mapped[list[Question]] = relationship(
        back_populates="day",
        cascade="all, delete-orphan",
        order_by="Question.order",
    )


class Question(Base):
    """Pregunta de comprensión de opción múltiple."""

    __tablename__ = "question"

    id: Mapped[int] = mapped_column(primary_key=True)
    day_challenge_id: Mapped[int] = mapped_column(ForeignKey("day_challenge.id"))
    order: Mapped[int]
    prompt: Mapped[str]
    options: Mapped[list[str]] = mapped_column(JSON)
    correct_index: Mapped[int]

    day: Mapped[DayChallenge] = relationship(back_populates="questions")


class ReadingSession(Base):
    """Progreso de lectura de un niño en un día (para retomar y contar palabras)."""

    __tablename__ = "reading_session"
    __table_args__ = (
        UniqueConstraint("child_id", "day_challenge_id", name="uq_reading_child_day"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    child_id: Mapped[int] = mapped_column(ForeignKey("child.id"))
    day_challenge_id: Mapped[int] = mapped_column(ForeignKey("day_challenge.id"))
    seconds_elapsed: Mapped[int] = mapped_column(default=0)
    last_word_index: Mapped[int] = mapped_column(default=0)
    words_read: Mapped[int] = mapped_column(default=0)
    finished: Mapped[bool] = mapped_column(default=False)
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())


class DayCompletion(Base):
    """Registro de que un niño terminó el reto de un día (con estrellas ganadas)."""

    __tablename__ = "day_completion"
    __table_args__ = (
        UniqueConstraint("child_id", "day_challenge_id", name="uq_completion_child_day"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    child_id: Mapped[int] = mapped_column(ForeignKey("child.id"))
    day_challenge_id: Mapped[int] = mapped_column(ForeignKey("day_challenge.id"))
    stars: Mapped[int] = mapped_column(default=1)
    reading_words: Mapped[int] = mapped_column(default=0)
    questions_correct: Mapped[int] = mapped_column(default=0)
    questions_total: Mapped[int] = mapped_column(default=0)
    math_correct: Mapped[int] = mapped_column(default=0)
    math_total: Mapped[int] = mapped_column(default=0)
    completed_at: Mapped[datetime] = mapped_column(server_default=func.now())
