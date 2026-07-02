"""Tests de la lógica de gamificación (``app.gamification``)."""

from __future__ import annotations

from datetime import date, timedelta

from app import gamification


# ----- compute_stars -----
def test_una_estrella_solo_por_completar() -> None:
    stars = gamification.compute_stars(
        reading_finished=True,
        questions_correct=1,
        questions_total=3,
        math_correct=2,
        math_total=8,
    )
    assert stars == 1


def test_dos_estrellas_preguntas_perfectas() -> None:
    stars = gamification.compute_stars(
        reading_finished=True,
        questions_correct=3,
        questions_total=3,
        math_correct=5,
        math_total=8,
    )
    assert stars == 2


def test_tres_estrellas_todo_perfecto() -> None:
    stars = gamification.compute_stars(
        reading_finished=True,
        questions_correct=4,
        questions_total=4,
        math_correct=8,
        math_total=8,
    )
    assert stars == 3


def test_estrellas_sin_preguntas_ni_mate_no_suman_de_gratis() -> None:
    # Con total 0, no debe regalar la estrella extra.
    stars = gamification.compute_stars(
        reading_finished=True,
        questions_correct=0,
        questions_total=0,
        math_correct=0,
        math_total=0,
    )
    assert stars == 1


def test_estrellas_nunca_superan_el_maximo() -> None:
    stars = gamification.compute_stars(
        reading_finished=True,
        questions_correct=10,
        questions_total=10,
        math_correct=10,
        math_total=10,
    )
    assert stars == gamification.MAX_STARS == 3


# ----- compute_streak -----
def test_racha_vacia() -> None:
    assert gamification.compute_streak([], date(2026, 7, 10)) == 0


def test_racha_viva_terminando_hoy() -> None:
    today = date(2026, 7, 10)
    fechas = [today, today - timedelta(days=1), today - timedelta(days=2)]
    assert gamification.compute_streak(fechas, today) == 3


def test_racha_viva_terminando_ayer() -> None:
    today = date(2026, 7, 10)
    ayer = today - timedelta(days=1)
    fechas = [ayer, ayer - timedelta(days=1)]
    assert gamification.compute_streak(fechas, today) == 2


def test_racha_muerta_si_ultimo_dia_es_anteayer() -> None:
    today = date(2026, 7, 10)
    anteayer = today - timedelta(days=2)
    assert gamification.compute_streak([anteayer, anteayer - timedelta(days=1)], today) == 0


def test_racha_se_corta_en_hueco() -> None:
    today = date(2026, 7, 10)
    # Hoy y ayer seguidos, luego un hueco (falta anteayer), después más días.
    fechas = [
        today,
        today - timedelta(days=1),
        today - timedelta(days=3),
        today - timedelta(days=4),
    ]
    assert gamification.compute_streak(fechas, today) == 2


def test_racha_ignora_duplicados() -> None:
    today = date(2026, 7, 10)
    fechas = [today, today, today - timedelta(days=1)]
    assert gamification.compute_streak(fechas, today) == 2


# ----- best_streak_from_dates -----
def test_best_streak_vacio() -> None:
    assert gamification.best_streak_from_dates([]) == 0


def test_best_streak_encuentra_el_tramo_mas_largo() -> None:
    base = date(2026, 7, 1)
    fechas = [
        base,
        base + timedelta(days=1),  # tramo de 2
        base + timedelta(days=5),
        base + timedelta(days=6),
        base + timedelta(days=7),
        base + timedelta(days=8),  # tramo de 4  <- mejor
        base + timedelta(days=20),  # tramo de 1
    ]
    assert gamification.best_streak_from_dates(fechas) == 4


def test_best_streak_un_solo_dia() -> None:
    assert gamification.best_streak_from_dates([date(2026, 7, 4)]) == 1


def test_best_streak_ignora_duplicados_y_orden() -> None:
    base = date(2026, 7, 1)
    fechas = [base + timedelta(days=2), base, base + timedelta(days=1), base]
    assert gamification.best_streak_from_dates(fechas) == 3


# ----- compute_badges -----
def _earned(badges: list[dict]) -> set[str]:
    return {b["key"] for b in badges if b["earned"]}


def test_badges_catalogo_completo_y_forma() -> None:
    badges = gamification.compute_badges(
        days_completed=0,
        best_streak=0,
        total_words=0,
        total_stars=0,
        had_perfect_math_day=False,
    )
    assert len(badges) == len(gamification.BADGE_CATALOG)
    for b in badges:
        assert {"key", "emoji", "title", "description", "earned"} <= b.keys()
    assert _earned(badges) == set()


def test_badges_primer_dia_y_mate() -> None:
    badges = gamification.compute_badges(
        days_completed=1,
        best_streak=1,
        total_words=100,
        total_stars=3,
        had_perfect_math_day=True,
    )
    assert "primer_dia" in _earned(badges)
    assert "mate_perfecto" in _earned(badges)
    assert "racha_3" not in _earned(badges)


def test_badges_por_racha_son_acumulativas() -> None:
    badges = gamification.compute_badges(
        days_completed=8,
        best_streak=7,
        total_words=0,
        total_stars=0,
        had_perfect_math_day=False,
    )
    earned = _earned(badges)
    assert {"racha_3", "racha_7"} <= earned
    assert "racha_15" not in earned


def test_badges_lectura_y_coleccionista() -> None:
    badges = gamification.compute_badges(
        days_completed=20,
        best_streak=15,
        total_words=5000,
        total_stars=30,
        had_perfect_math_day=True,
    )
    earned = _earned(badges)
    assert {
        "primer_dia",
        "racha_3",
        "racha_7",
        "racha_15",
        "lector_1000",
        "lector_5000",
        "mate_perfecto",
        "coleccionista",
    } <= earned
