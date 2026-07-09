"""Tests de la generación determinista de matemáticas (``app.math_gen``)."""

from __future__ import annotations

import pytest

from app import math_gen


def test_determinismo_misma_semilla_mismos_ejercicios() -> None:
    """Regenerar el mismo día produce EXACTAMENTE los mismos ejercicios."""
    for day in (1, 5, 20, 40):
        a = math_gen.generate(day)
        b = math_gen.generate(day)
        assert a == b, f"Día {day}: la generación no es determinista"


def test_dias_distintos_dan_ejercicios_distintos() -> None:
    assert math_gen.generate(1) != math_gen.generate(2)


def test_bandas_extremos() -> None:
    # Fácil y media -> 2 dígitos (99); difícil -> 3 dígitos (999).
    assert math_gen.difficulty_max(1) == 99
    assert math_gen.difficulty_max(25) == 99
    assert math_gen.difficulty_max(26) == 99
    assert math_gen.difficulty_max(35) == 99
    assert math_gen.difficulty_max(36) == 999
    assert math_gen.difficulty_max(40) == 999


def test_rampa_monotona_no_decreciente() -> None:
    maxes = [math_gen.difficulty_max(d) for d in range(1, 41)]
    for prev, curr in zip(maxes, maxes[1:], strict=False):
        assert curr >= prev, f"La rampa retrocede: {prev} -> {curr}"
    # Y crece de verdad de principio a fin.
    assert maxes[0] < maxes[-1]


def test_dias_fuera_de_rango_se_saturan() -> None:
    assert math_gen.difficulty_max(0) == 99
    assert math_gen.difficulty_max(-5) == 99
    assert math_gen.difficulty_max(100) == 999


@pytest.mark.parametrize("day", list(range(1, 26)))
def test_banda_facil_restas_2dig_menos_1dig(day: int) -> None:
    """Días 1-25: restas con minuendo <=2 dígitos y sustraendo de 1 dígito."""
    for p in math_gen.generate(day):
        if p.kind == "sub":
            assert 1 <= p.a <= 99, f"Día {day}: minuendo fuera de rango {p.a}"
            assert 1 <= p.b <= 9, f"Día {day}: sustraendo no es de 1 dígito {p.b}"
            assert p.b <= p.a


@pytest.mark.parametrize("day", list(range(1, 26)))
def test_banda_facil_sumas_un_digito(day: int) -> None:
    """Días 1-25: sumas de un dígito + un dígito."""
    for p in math_gen.generate(day):
        if p.kind == "sum":
            assert 1 <= p.a <= 9 and 1 <= p.b <= 9, f"Día {day}: suma {p.a}+{p.b}"


@pytest.mark.parametrize("day", list(range(26, 36)))
def test_banda_media_dos_digitos(day: int) -> None:
    """Días 26-35: sumas de resultado <=2 dígitos y restas 2 dígitos - hasta 2 dígitos."""
    for p in math_gen.generate(day):
        if p.kind == "sum":
            assert p.a + p.b <= 99, f"Día {day}: suma {p.a}+{p.b} pasa de 2 dígitos"
        elif p.kind == "sub":
            assert 10 <= p.a <= 99, f"Día {day}: minuendo no es de 2 dígitos {p.a}"
            assert p.b <= p.a


@pytest.mark.parametrize("day", list(range(36, 41)))
def test_banda_dificil_tres_digitos(day: int) -> None:
    """Días 36-40: hasta 3 dígitos."""
    for p in math_gen.generate(day):
        assert 1 <= p.a <= 999 and 1 <= p.b <= 999
        if p.kind == "sum":
            assert p.a + p.b <= 999


@pytest.mark.parametrize("day", list(range(1, 41)))
def test_restas_nunca_negativas(day: int) -> None:
    for p in math_gen.generate(day):
        if p.kind == "sub":
            assert p.b <= p.a, f"Día {day}: resta negativa {p.a}-{p.b}"
            assert int(p.answer) >= 0


@pytest.mark.parametrize("day", list(range(1, 41)))
def test_sumas_no_exceden_el_techo(day: int) -> None:
    top = math_gen.difficulty_max(day)
    for p in math_gen.generate(day):
        if p.kind == "sum":
            assert p.a + p.b <= top, f"Día {day}: suma {p.a}+{p.b} excede techo {top}"
            assert int(p.answer) == p.a + p.b


@pytest.mark.parametrize("day", list(range(1, 41)))
def test_operandos_dentro_del_techo(day: int) -> None:
    top = math_gen.difficulty_max(day)
    for p in math_gen.generate(day):
        assert 1 <= p.a <= top
        assert 1 <= p.b <= top


def test_compare_answer_y_opciones() -> None:
    for day in (1, 10, 40):
        for p in math_gen.generate(day):
            if p.kind == "compare":
                assert p.options == ["<", "=", ">"]
                esperado = "=" if p.a == p.b else (">" if p.a > p.b else "<")
                assert p.answer == esperado


def test_public_oculta_la_respuesta() -> None:
    p = math_gen.generate(1)[0]
    pub = p.public()
    assert "answer" not in pub
    assert pub["id"] == p.id and pub["prompt"] == p.prompt


def test_check_answers_todo_correcto() -> None:
    for day in (1, 15, 40):
        correctas = [p.answer for p in math_gen.generate(day)]
        correct, total, per_item = math_gen.check_answers(day, correctas)
        assert total == math_gen.PROBLEMS_PER_DAY
        assert correct == total
        assert all(per_item)


def test_check_answers_mezcla_y_espacios() -> None:
    problems = math_gen.generate(3)
    dadas = [p.answer for p in problems]
    dadas[0] = "999999"  # claramente mal
    dadas[1] = f"  {problems[1].answer}  "  # correcta con espacios -> debe aceptarse
    correct, total, per_item = math_gen.check_answers(3, dadas)
    assert per_item[0] is False
    assert per_item[1] is True
    assert correct == total - 1


def test_check_answers_incompletas_no_rompen() -> None:
    # Menos respuestas que ejercicios: las faltantes cuentan como incorrectas.
    correct, total, per_item = math_gen.check_answers(1, [])
    assert total == math_gen.PROBLEMS_PER_DAY
    assert correct == 0
    assert len(per_item) == total
