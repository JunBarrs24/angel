"""Catálogo de la tienda: se carga desde un JSON editable por despliegue.

El archivo por defecto es ``app/store_catalog.json``. Se puede apuntar a otro con
la variable de entorno ``STORE_CATALOG_PATH`` (ver ``config.Settings``).
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from .config import settings

DEFAULT_CATALOG_PATH = Path(__file__).parent / "store_catalog.json"


@dataclass(frozen=True)
class StoreItem:
    key: str
    emoji: str
    title: str
    description: str
    cost: int
    color: str


def _catalog_path() -> Path:
    configured = settings.store_catalog_path.strip()
    return Path(configured) if configured else DEFAULT_CATALOG_PATH


@lru_cache(maxsize=1)
def load_items() -> list[StoreItem]:
    """Lee y valida el catálogo. Cacheado (se relee al reiniciar el proceso)."""
    with _catalog_path().open(encoding="utf-8") as fh:
        data = json.load(fh)
    items: list[StoreItem] = []
    seen: set[str] = set()
    for raw in data.get("items", []):
        key = str(raw["key"])
        if key in seen:
            raise ValueError(f"Clave de tienda duplicada: {key}")
        seen.add(key)
        items.append(
            StoreItem(
                key=key,
                emoji=str(raw["emoji"]),
                title=str(raw["title"]),
                description=str(raw.get("description", "")),
                cost=int(raw["cost"]),
                color=str(raw.get("color", "amarillo")),
            )
        )
    return items


def get_item(key: str) -> StoreItem | None:
    return next((item for item in load_items() if item.key == key), None)
