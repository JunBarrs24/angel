"""Generación determinista de ejercicios de matemáticas.

Los ejercicios se generan a partir del ``day_number`` con una semilla fija, así que
el servidor puede regenerarlos para corregir las respuestas sin guardarlos en la DB.

Tipos:
  - ``sum``     : a + b            (respuesta numérica)
  - ``sub``     : a - b  (b <= a)  (respuesta numérica)
  - ``compare`` : a ? b            (respuesta "<", ">" o "=")

Dificultad por tramos (bandas), pensada para no saturar a los peques:

  Días 1-25  (fácil):
    - suma:  un dígito + un dígito        (p. ej. 8 + 7)
    - resta: hasta 2 dígitos − 1 dígito   (p. ej. 15 − 8, 8 − 6), nunca negativa
    - comparar: números de hasta 2 dígitos
  Días 26-35 (medio):
    - suma:  resultado de hasta 2 dígitos (p. ej. 34 + 51)
    - resta: 2 dígitos − hasta 2 dígitos  (p. ej. 45 − 28), nunca negativa
    - comparar: números de hasta 2 dígitos
  Días 36-40 (difícil):
    - suma:  resultado de hasta 3 dígitos
    - resta: hasta 3 dígitos, nunca negativa
    - comparar: números de hasta 3 dígitos
"""

from __future__ import annotations

import random
from dataclasses import asdict, dataclass

TOTAL_DAYS = 40
PROBLEMS_PER_DAY = 8

# Límites de cada banda de dificultad (por número de día).
EASY_MAX_DAY = 25  # días 1..25
MID_MAX_DAY = 35  # días 26..35 ; 36..40 = difícil

# Techos de operandos según cantidad de dígitos.
ONE_DIGIT_MAX = 9
TWO_DIGIT_MAX = 99
THREE_DIGIT_MAX = 999


@dataclass(frozen=True)
class MathProblem:
    id: str
    kind: str  # "sum" | "sub" | "compare"
    a: int
    b: int
    prompt: str
    answer: str  # como texto: "42" o "<" / ">" / "="
    options: list[str]  # opciones para 'compare'; vacío para respuesta escrita

    def public(self) -> dict:
        """Versión enviada al cliente: sin la respuesta correcta."""
        data = asdict(self)
        data.pop("answer")
        return data


def _band(day_number: int) -> str:
    """Devuelve la banda de dificultad ('easy' | 'mid' | 'hard') de un día."""
    if day_number <= EASY_MAX_DAY:
        return "easy"
    if day_number <= MID_MAX_DAY:
        return "mid"
    return "hard"


def difficulty_max(day_number: int) -> int:
    """Máximo de los operandos que verá el niño ese día (para info/DB ``math_max``).

    Banda fácil/media -> 2 dígitos (99); banda difícil -> 3 dígitos (999).
    """
    return TWO_DIGIT_MAX if _band(day_number) in ("easy", "mid") else THREE_DIGIT_MAX


def _seed(day_number: int) -> random.Random:
    return random.Random(day_number * 1000 + 7)


def _make_sum(rng: random.Random, band: str) -> tuple[int, int]:
    """Operandos de una suma según la banda. La suma nunca pasa del techo de dígitos."""
    if band == "easy":
        # Un dígito + un dígito (el resultado puede llegar a 2 dígitos: 8 + 7 = 15).
        return rng.randint(1, ONE_DIGIT_MAX), rng.randint(1, ONE_DIGIT_MAX)
    cap = TWO_DIGIT_MAX if band == "mid" else THREE_DIGIT_MAX
    # Elegir a y luego b dejando sitio, para que a + b nunca pase el techo.
    a = rng.randint(1, cap - 1)
    b = rng.randint(1, cap - a)
    return a, b


def _make_sub(rng: random.Random, band: str) -> tuple[int, int]:
    """Operandos de una resta (b <= a, nunca negativa) según la banda."""
    if band == "easy":
        # Hasta 2 dígitos menos 1 dígito: 15 - 8, 8 - 6.
        a = rng.randint(1, TWO_DIGIT_MAX)
        b = rng.randint(1, min(ONE_DIGIT_MAX, a))
        return a, b
    if band == "mid":
        # 2 dígitos menos hasta 2 dígitos: 45 - 28.
        a = rng.randint(10, TWO_DIGIT_MAX)
        b = rng.randint(1, a)
        return a, b
    # Difícil: hasta 3 dígitos.
    a = rng.randint(10, THREE_DIGIT_MAX)
    b = rng.randint(1, a)
    return a, b


def _make_compare(rng: random.Random, band: str) -> tuple[int, int]:
    """Operandos de una comparación según la banda."""
    top = TWO_DIGIT_MAX if band in ("easy", "mid") else THREE_DIGIT_MAX
    a = rng.randint(1, top)
    b = rng.randint(1, top)
    # De vez en cuando forzar igualdad para que aparezca "=".
    if rng.random() < 0.15:
        b = a
    return a, b


def generate(day_number: int, count: int = PROBLEMS_PER_DAY) -> list[MathProblem]:
    """Genera de forma determinista la lista de ejercicios de un día."""
    rng = _seed(day_number)
    band = _band(day_number)
    problems: list[MathProblem] = []

    # Patrón de tipos: mezcla de sumas, restas y comparaciones.
    pattern = ["sum", "sub", "compare"]
    for i in range(count):
        kind = pattern[i % len(pattern)]
        if kind == "sum":
            a, b = _make_sum(rng, band)
            problems.append(
                MathProblem(
                    id=f"{day_number}-{i}",
                    kind="sum",
                    a=a,
                    b=b,
                    prompt=f"{a} + {b}",
                    answer=str(a + b),
                    options=[],
                )
            )
        elif kind == "sub":
            a, b = _make_sub(rng, band)
            problems.append(
                MathProblem(
                    id=f"{day_number}-{i}",
                    kind="sub",
                    a=a,
                    b=b,
                    prompt=f"{a} - {b}",
                    answer=str(a - b),
                    options=[],
                )
            )
        else:  # compare
            a, b = _make_compare(rng, band)
            answer = "=" if a == b else (">" if a > b else "<")
            problems.append(
                MathProblem(
                    id=f"{day_number}-{i}",
                    kind="compare",
                    a=a,
                    b=b,
                    prompt=f"{a} ? {b}",
                    answer=answer,
                    options=["<", "=", ">"],
                )
            )
    return problems


def check_answers(day_number: int, given: list[str]) -> tuple[int, int, list[bool]]:
    """Corrige las respuestas regenerando los ejercicios del día.

    ``given`` debe venir en el mismo orden que ``generate`` (por id/orden).
    Devuelve (correctas, total, lista_por_item).
    """
    problems = generate(day_number)
    per_item: list[bool] = []
    for idx, problem in enumerate(problems):
        raw = given[idx] if idx < len(given) else ""
        ok = str(raw).strip() == problem.answer
        per_item.append(ok)
    correct = sum(per_item)
    return correct, len(problems), per_item
