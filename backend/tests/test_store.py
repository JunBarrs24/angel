"""Tests de la tienda: catálogo, balances y canjes."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app import math_gen


def _correct_math(day_number: int) -> list[str]:
    return [p.answer for p in math_gen.generate(day_number)]


def _complete_day_perfect(client: TestClient, day_number: int) -> None:
    """Completa un día con todo correcto (3 estrellas)."""
    client.post(
        "/api/reading",
        json={"child_id": 1, "day_number": day_number, "last_word_index": 30, "finished": True},
    )
    # Índices correctos del día 1 sembrados: [0, 2, 1]; del día 2: [1, 0, 2].
    correct_comp = [0, 2, 1] if day_number == 1 else [1, 0, 2]
    client.post(
        "/api/answers/complete",
        json={
            "child_id": 1,
            "day_number": day_number,
            "comprehension_answers": correct_comp,
            "math_answers": _correct_math(day_number),
        },
    )


def test_store_catalogo_y_balance_inicial(client: TestClient) -> None:
    r = client.get("/api/store", params={"child_id": 1})
    assert r.status_code == 200
    body = r.json()
    keys = {i["key"] for i in body["items"]}
    assert {"snack", "robux", "toy_small", "toy_big"} <= keys
    assert body["stars_earned"] == 0
    assert body["stars_spent"] == 0
    assert body["stars_available"] == 0
    assert body["redemptions"] == []


def test_store_sin_estrellas_no_puede_comprar(client: TestClient) -> None:
    r = client.post("/api/store/purchase", json={"child_id": 1, "item_key": "snack"})
    assert r.status_code == 400


def test_store_comprar_descuenta_y_guarda_historial(client: TestClient) -> None:
    # Gana estrellas: 2 días perfectos = 6 estrellas.
    _complete_day_perfect(client, 1)
    _complete_day_perfect(client, 2)

    store = client.get("/api/store", params={"child_id": 1}).json()
    assert store["stars_earned"] == 6
    assert store["stars_available"] == 6

    # Compra el snack (5).
    r = client.post("/api/store/purchase", json={"child_id": 1, "item_key": "snack"})
    assert r.status_code == 200
    body = r.json()
    assert body["stars_spent"] == 5
    assert body["stars_available"] == 1
    assert body["redemption"]["title"] == "Doritos o galletas"
    assert body["redemption"]["cost"] == 5

    # Ya no alcanza para otro snack (queda 1).
    assert (
        client.post("/api/store/purchase", json={"child_id": 1, "item_key": "snack"}).status_code
        == 400
    )

    # El historial y el progreso reflejan el gasto.
    store2 = client.get("/api/store", params={"child_id": 1}).json()
    assert len(store2["redemptions"]) == 1
    prog = client.get("/api/progress", params={"child_id": 1, "as_of": "2026-07-08"}).json()
    assert prog["total_stars"] == 6
    assert prog["stars_spent"] == 5
    assert prog["stars_available"] == 1


def test_store_item_inexistente_404(client: TestClient) -> None:
    assert (
        client.post(
            "/api/store/purchase", json={"child_id": 1, "item_key": "no_existe"}
        ).status_code
        == 404
    )
