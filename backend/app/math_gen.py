"""Generación determinista de ejercicios de matemáticas.

Los ejercicios se generan a partir del ``day_number`` con una semilla fija, así que
el servidor puede regenerarlos para corregir las respuestas sin guardarlos en la DB.

Tipos:
  - ``sum``     : a + b            (respuesta numérica)
  - ``sub``     : a - b  (b <= a)  (respuesta numérica)
  - ``compare`` : a ? b            (respuesta "<", ">" o "=")

Rampa de dificultad: los operandos crecen con el día, desde ~20 hasta 1000.
"""

from __future__ import annotations

import random
from dataclasses import asdict, dataclass

TOTAL_DAYS = 40
FLOOR_MAX = 20
CEIL_MAX = 1000
PROBLEMS_PER_DAY = 8


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


def difficulty_max(day_number: int) -> int:
    """Máximo de los operandos para un día dado (rampa lineal de 20 a 1000)."""
    if day_number <= 1:
        return FLOOR_MAX
    if day_number >= TOTAL_DAYS:
        return CEIL_MAX
    step = (CEIL_MAX - FLOOR_MAX) / (TOTAL_DAYS - 1)
    return int(round(FLOOR_MAX + (day_number - 1) * step))


def _seed(day_number: int) -> random.Random:
    return random.Random(day_number * 1000 + 7)


def generate(day_number: int, count: int = PROBLEMS_PER_DAY) -> list[MathProblem]:
    """Genera de forma determinista la lista de ejercicios de un día."""
    rng = _seed(day_number)
    top = difficulty_max(day_number)
    problems: list[MathProblem] = []

    # Patrón de tipos: mezcla de sumas, restas y comparaciones.
    pattern = ["sum", "sub", "compare"]
    for i in range(count):
        kind = pattern[i % len(pattern)]
        if kind == "sum":
            # Elegir a y luego b dejando sitio, para que a + b nunca pase el techo.
            a = rng.randint(1, max(1, top - 1))
            b = rng.randint(1, top - a)
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
            a = rng.randint(2, top)
            b = rng.randint(1, a)
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
            a = rng.randint(1, top)
            b = rng.randint(1, top)
            # De vez en cuando forzar igualdad para que aparezca "=".
            if rng.random() < 0.15:
                b = a
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
