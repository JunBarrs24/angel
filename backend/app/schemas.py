"""Schemas Pydantic para las peticiones y respuestas de la API."""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


# ----- Perfil -----
class ChildCreate(BaseModel):
    name: str | None = None
    avatar: str | None = None


class ChildOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    avatar: str
    code: str | None = None


# ----- Contenido del día -----
class QuestionOut(BaseModel):
    id: int
    order: int
    prompt: str
    options: list[str]


class MathProblemOut(BaseModel):
    id: str
    kind: str
    a: int
    b: int
    prompt: str
    options: list[str]


class ReadingStateOut(BaseModel):
    seconds_elapsed: int = 0
    last_word_index: int = 0
    words_read: int = 0
    finished: bool = False


class CompletionOut(BaseModel):
    stars: int
    questions_correct: int
    questions_total: int
    math_correct: int
    math_total: int
    # Lo que respondió el niño, para el repaso de un adulto (solo lectura).
    comprehension_answers: list[int] = []
    math_answers: list[str] = []


class DayChallengeOut(BaseModel):
    day_number: int
    date: date
    dino_name: str
    dino_emoji: str
    title: str
    story: str
    word_count: int
    questions: list[QuestionOut]
    math: list[MathProblemOut]
    reading: ReadingStateOut
    completion: CompletionOut | None = None
    is_today: bool
    is_locked: bool


# ----- Mapa -----
class MapItemOut(BaseModel):
    day_number: int
    date: date
    dino_name: str
    dino_emoji: str
    title: str
    status: str  # "locked" | "available" | "completed" | "today"
    stars: int


class MapOut(BaseModel):
    game_start: date
    game_end: date
    today: date
    days: list[MapItemOut]


# ----- Lectura -----
class ReadingUpdateIn(BaseModel):
    child_id: int
    day_number: int
    seconds_elapsed: int = 0
    last_word_index: int = 0
    words_read: int = 0
    finished: bool = False


# ----- Respuestas -----
class ComprehensionIn(BaseModel):
    child_id: int
    day_number: int
    answers: list[int]


class ComprehensionResultOut(BaseModel):
    correct: int
    total: int
    per_item: list[bool]
    correct_indices: list[int]


class MathIn(BaseModel):
    child_id: int
    day_number: int
    answers: list[str]


class MathResultOut(BaseModel):
    correct: int
    total: int
    per_item: list[bool]
    correct_answers: list[str]


# ----- Completar día -----
class CompleteIn(BaseModel):
    child_id: int
    day_number: int
    comprehension_answers: list[int] = []
    math_answers: list[str] = []


class BadgeOut(BaseModel):
    key: str
    emoji: str
    title: str
    description: str
    earned: bool


class CompleteResultOut(BaseModel):
    stars: int
    total_stars: int
    streak: int
    already_completed: bool
    newly_earned_badges: list[BadgeOut]


# ----- Progreso -----
class ProgressOut(BaseModel):
    total_stars: int  # estrellas GANADAS en total (histórico)
    stars_spent: int  # gastadas en la tienda
    stars_available: int  # disponibles para gastar (ganadas - gastadas)
    streak: int
    best_streak: int
    days_completed: int
    days_total: int
    total_words: int
    badges: list[BadgeOut]
    game_start: date
    game_end: date


# ----- Tienda -----
class StoreItemOut(BaseModel):
    key: str
    emoji: str
    title: str
    description: str
    cost: int
    color: str


class RedemptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    item_key: str
    title: str
    emoji: str
    cost: int
    fulfilled: bool
    created_at: datetime


class StoreOut(BaseModel):
    items: list[StoreItemOut]
    stars_earned: int
    stars_spent: int
    stars_available: int
    redemptions: list[RedemptionOut]


class PurchaseIn(BaseModel):
    child_id: int
    item_key: str


class PurchaseResultOut(BaseModel):
    redemption: RedemptionOut
    stars_earned: int
    stars_spent: int
    stars_available: int
