"""Tests de los endpoints de la API contra una DB SQLite temporal.

Las fixtures ``db_session`` y ``client`` viven en ``conftest.py`` y siembran
dos ``DayChallenge`` (día 1 = 2026-07-07, día 2 = 2026-07-08) y un ``Child`` id=1.
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from app import math_gen

AS_OF_DAY1 = "2026-07-07"
AS_OF_DAY2 = "2026-07-08"


def _correct_math(day_number: int) -> list[str]:
    return [p.answer for p in math_gen.generate(day_number)]


def test_health(client: TestClient) -> None:
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_perfil_crear_y_leer(client: TestClient) -> None:
    r = client.post("/api/child", json={"name": "Explorador", "avatar": "trike"})
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "Explorador"
    assert data["avatar"] == "trike"

    r2 = client.get(f"/api/child/{data['id']}")
    assert r2.status_code == 200
    assert r2.json()["id"] == data["id"]

    assert client.get("/api/child/9999").status_code == 404


def test_today(client: TestClient) -> None:
    r = client.get("/api/today", params={"child_id": 1, "as_of": AS_OF_DAY1})
    assert r.status_code == 200
    body = r.json()
    assert body["day_number"] == 1
    assert body["is_today"] is True
    assert body["is_locked"] is False
    assert len(body["questions"]) == 3
    assert len(body["math"]) == math_gen.PROBLEMS_PER_DAY
    # Los ejercicios de mate NO deben exponer la respuesta.
    assert all("answer" not in m for m in body["math"])


def test_today_fuera_de_rango_404(client: TestClient) -> None:
    r = client.get("/api/today", params={"child_id": 1, "as_of": "2026-01-01"})
    assert r.status_code == 404


def test_day_y_bloqueo_403(client: TestClient) -> None:
    # El día 2 está disponible cuando as_of == su fecha.
    ok = client.get("/api/day/2", params={"child_id": 1, "as_of": AS_OF_DAY2})
    assert ok.status_code == 200

    # ...pero bloqueado si aún no llega su fecha.
    locked = client.get("/api/day/2", params={"child_id": 1, "as_of": AS_OF_DAY1})
    assert locked.status_code == 403

    assert client.get("/api/day/99", params={"child_id": 1}).status_code == 404


def test_map(client: TestClient) -> None:
    r = client.get("/api/map", params={"child_id": 1, "as_of": AS_OF_DAY1})
    assert r.status_code == 200
    body = r.json()
    assert body["today"] == AS_OF_DAY1
    days = body["days"]
    assert len(days) == 2
    by_num = {d["day_number"]: d for d in days}
    assert by_num[1]["status"] == "today"
    assert by_num[2]["status"] == "locked"
    assert all(d["stars"] == 0 for d in days)


def test_reading_guardar_y_retomar(client: TestClient) -> None:
    # Primera lectura parcial.
    r1 = client.post(
        "/api/reading",
        json={
            "child_id": 1,
            "day_number": 1,
            "seconds_elapsed": 20,
            "last_word_index": 10,
            "words_read": 10,
            "finished": False,
        },
    )
    assert r1.status_code == 200
    assert r1.json()["last_word_index"] == 10
    assert r1.json()["finished"] is False

    # Al retomar, el estado se refleja en /today.
    today = client.get("/api/today", params={"child_id": 1, "as_of": AS_OF_DAY1}).json()
    assert today["reading"]["last_word_index"] == 10
    assert today["reading"]["seconds_elapsed"] == 20

    # Segunda actualización: el tiempo/palabras solo avanzan, nunca retroceden.
    r2 = client.post(
        "/api/reading",
        json={
            "child_id": 1,
            "day_number": 1,
            "seconds_elapsed": 5,  # menor -> no debe bajar
            "last_word_index": 25,
            "words_read": 3,  # menor -> no debe bajar
            "finished": True,
        },
    )
    body = r2.json()
    assert body["seconds_elapsed"] == 20  # se mantuvo el mayor
    assert body["finished"] is True
    # Al terminar, se completa hasta el total de palabras del día.
    assert body["last_word_index"] == today["word_count"]
    assert body["words_read"] == today["word_count"]


def test_answers_comprehension_feedback(client: TestClient) -> None:
    # Índices correctos sembrados para el día 1: [0, 2, 1].
    r = client.post(
        "/api/answers/comprehension",
        json={"child_id": 1, "day_number": 1, "answers": [0, 2, 0]},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 3
    assert body["correct"] == 2
    assert body["per_item"] == [True, True, False]
    assert body["correct_indices"] == [0, 2, 1]


def test_answers_math_feedback(client: TestClient) -> None:
    correctas = _correct_math(1)
    r = client.post(
        "/api/answers/math",
        json={"child_id": 1, "day_number": 1, "answers": correctas},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["correct"] == body["total"] == math_gen.PROBLEMS_PER_DAY
    assert all(body["per_item"])


def test_complete_otorga_estrellas_e_idempotente(client: TestClient) -> None:
    # Marca la lectura como terminada primero.
    client.post(
        "/api/reading",
        json={"child_id": 1, "day_number": 1, "last_word_index": 30, "finished": True},
    )
    payload = {
        "child_id": 1,
        "day_number": 1,
        "comprehension_answers": [0, 2, 1],  # todas correctas
        "math_answers": _correct_math(1),  # todas correctas
    }
    r1 = client.post("/api/answers/complete", json=payload)
    assert r1.status_code == 200
    b1 = r1.json()
    assert b1["stars"] == 3
    assert b1["already_completed"] is False
    assert b1["total_stars"] == 3
    earned = {b["key"] for b in b1["newly_earned_badges"]}
    assert "primer_dia" in earned
    assert "mate_perfecto" in earned

    # Reenviar NO vuelve a otorgar estrellas.
    r2 = client.post("/api/answers/complete", json=payload)
    b2 = r2.json()
    assert b2["already_completed"] is True
    assert b2["stars"] == 3
    assert b2["total_stars"] == 3  # sigue siendo 3, no 6
    assert b2["newly_earned_badges"] == []


def test_progress_refleja_el_avance(client: TestClient) -> None:
    # Antes de completar nada.
    p0 = client.get("/api/progress", params={"child_id": 1, "as_of": AS_OF_DAY1}).json()
    assert p0["days_completed"] == 0
    assert p0["total_stars"] == 0
    assert p0["days_total"] == 2

    # Completa el día 1 con solo la lectura (1 estrella).
    client.post(
        "/api/reading",
        json={"child_id": 1, "day_number": 1, "last_word_index": 30, "finished": True},
    )
    client.post(
        "/api/answers/complete",
        json={
            "child_id": 1,
            "day_number": 1,
            "comprehension_answers": [0, 0, 0],  # solo 1 correcta -> no bonus
            "math_answers": [],  # nada de mate -> no bonus
        },
    )

    p1 = client.get("/api/progress", params={"child_id": 1, "as_of": AS_OF_DAY1}).json()
    assert p1["days_completed"] == 1
    assert p1["total_stars"] == 1
    assert p1["streak"] == 1
    assert p1["total_words"] > 0
    assert any(b["key"] == "primer_dia" and b["earned"] for b in p1["badges"])

    # Y el mapa ahora marca el día 1 como completado con sus estrellas.
    mapa = client.get("/api/map", params={"child_id": 1, "as_of": AS_OF_DAY1}).json()
    by_num = {d["day_number"]: d for d in mapa["days"]}
    assert by_num[1]["status"] == "completed"
    assert by_num[1]["stars"] == 1
