"""Validación del contenido de las 40 historias de dinosaurios.

Comprueba que los archivos ``app/content/days_*.json`` cumplen el contrato que el
loader/seed y el frontend esperan: 40 días completos, sin huecos ni duplicados,
preguntas bien formadas y respuestas correctas dentro de rango.
"""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

import pytest

CONTENT_DIR = Path(__file__).resolve().parent.parent / "app" / "content"

# Límites de longitud de la historia (en palabras). Pensados para ~1-2 min de
# lectura de un niño de 7 años, con margen sobre el rango real (155-176).
STORY_MIN_WORDS = 120
STORY_MAX_WORDS = 210

REQUIRED_KEYS = {"day_number", "dino_name", "dino_emoji", "title", "story", "questions"}


def _load_all_days() -> list[dict]:
    """Carga y ordena por día todos los objetos de los JSON de contenido."""
    files = sorted(CONTENT_DIR.glob("days_*.json"))
    assert files, f"No se encontraron archivos de contenido en {CONTENT_DIR}"
    days: list[dict] = []
    for path in files:
        # JSON válido: json.loads lanza si el archivo está malformado.
        data = json.loads(path.read_text(encoding="utf-8"))
        assert isinstance(data, list), f"{path.name} debe contener una lista"
        days.extend(data)
    days.sort(key=lambda d: d["day_number"])
    return days


ALL_DAYS = _load_all_days()
# Parametrización con id legible: "dia-01", "dia-02", ...
DAY_PARAMS = [pytest.param(d, id=f"dia-{d['day_number']:02d}") for d in ALL_DAYS]


def test_exactamente_40_dias_sin_repetir() -> None:
    numbers = [d["day_number"] for d in ALL_DAYS]
    assert len(ALL_DAYS) == 40, f"Se esperaban 40 días, hay {len(ALL_DAYS)}"
    assert sorted(numbers) == list(range(1, 41)), (
        "Los day_number deben ser 1..40 sin huecos ni repetidos"
    )


def test_dino_name_unico_por_dia() -> None:
    names = [d["dino_name"] for d in ALL_DAYS]
    dupes = [name for name, count in Counter(names).items() if count > 1]
    assert not dupes, f"Nombres de dinosaurio repetidos: {dupes}"


def test_variedad_del_indice_correcto() -> None:
    """El índice correcto debe repartirse entre las tres posiciones.

    Guarda contra una regresión donde la respuesta caiga siempre (o casi) en la
    misma posición y el niño aprenda a adivinar por patrón.
    """
    counter: Counter[int] = Counter()
    for day in ALL_DAYS:
        for q in day["questions"]:
            counter[q["correct_index"]] += 1
    total = sum(counter.values())
    for index in (0, 1, 2):
        share = counter[index] / total
        assert share >= 0.20, (
            f"El índice correcto {index} solo aparece en {share:.0%} de las preguntas; "
            "debe usarse al menos el 20% del tiempo para que haya variedad real."
        )


@pytest.mark.parametrize("day", DAY_PARAMS)
def test_estructura_del_dia(day: dict) -> None:
    faltantes = REQUIRED_KEYS - day.keys()
    assert not faltantes, f"Día {day.get('day_number')} sin claves: {faltantes}"
    for key in ("dino_name", "dino_emoji", "title", "story"):
        assert isinstance(day[key], str) and day[key].strip(), (
            f"Día {day['day_number']}: '{key}' vacío o no es texto"
        )


@pytest.mark.parametrize("day", DAY_PARAMS)
def test_longitud_de_la_historia(day: dict) -> None:
    words = len(day["story"].split())
    assert STORY_MIN_WORDS <= words <= STORY_MAX_WORDS, (
        f"Día {day['day_number']} ({day['dino_name']}): la historia tiene {words} "
        f"palabras, fuera del rango [{STORY_MIN_WORDS}, {STORY_MAX_WORDS}]"
    )


@pytest.mark.parametrize("day", DAY_PARAMS)
def test_preguntas_bien_formadas(day: dict) -> None:
    questions = day["questions"]
    assert isinstance(questions, list)
    assert 3 <= len(questions) <= 4, (
        f"Día {day['day_number']}: debe tener 3-4 preguntas, tiene {len(questions)}"
    )
    indices_del_dia = []
    for i, q in enumerate(questions):
        ubic = f"día {day['day_number']}, pregunta {i + 1}"
        assert isinstance(q.get("prompt"), str) and q["prompt"].strip(), f"{ubic}: enunciado vacío"

        options = q.get("options")
        assert isinstance(options, list) and len(options) == 3, (
            f"{ubic}: debe tener EXACTAMENTE 3 opciones, tiene {len(options) if options else 0}"
        )
        for opt in options:
            assert isinstance(opt, str) and opt.strip(), f"{ubic}: opción vacía"
        # Opciones claramente distintas entre sí.
        assert len(set(options)) == 3, f"{ubic}: opciones duplicadas -> {options}"

        idx = q.get("correct_index")
        assert isinstance(idx, int) and 0 <= idx <= 2, (
            f"{ubic}: correct_index debe estar en [0, 2], es {idx!r}"
        )
        indices_del_dia.append(idx)

    # Dentro de un mismo día la respuesta no debe caer siempre en la misma posición.
    assert len(set(indices_del_dia)) > 1, (
        f"Día {day['day_number']}: todas las respuestas están en la posición "
        f"{indices_del_dia[0]}; varía el índice correcto."
    )
