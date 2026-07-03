"""Configuración de la aplicación, leída desde variables de entorno / .env."""

from __future__ import annotations

from datetime import date

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Vacío => SQLite local. Railway inyecta la URL de Postgres.
    database_url: str = ""
    cors_origins: str = "http://localhost:5173"

    game_start_date: date = date(2026, 7, 7)
    game_end_date: date = date(2026, 8, 15)

    child_name: str = "Ángel Eduardo"

    # Ruta al catálogo de la tienda (JSON). Vacío => app/store_catalog.json.
    # Permite apuntar a otro archivo por despliegue sin tocar el código.
    store_catalog_path: str = ""

    @property
    def resolved_database_url(self) -> str:
        url = self.database_url.strip()
        if not url:
            return "sqlite:///./misiondino.db"
        # Railway/Heroku a veces entregan "postgres://"; SQLAlchemy quiere "postgresql://".
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
