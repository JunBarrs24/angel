"""Punto de entrada de la API de Misión Dino."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import create_all
from .routers import answers, challenges, profile, progress, reading


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crea las tablas si no existen (idempotente). En Postgres corre una sola vez.
    create_all()
    yield


app = FastAPI(title="Misión Dino 🦖", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router, prefix="/api")
app.include_router(challenges.router, prefix="/api")
app.include_router(reading.router, prefix="/api")
app.include_router(answers.router, prefix="/api")
app.include_router(progress.router, prefix="/api")


@app.get("/api/health", tags=["health"])
def health() -> dict:
    return {"status": "ok", "game": "misión-dino"}
