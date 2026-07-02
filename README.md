# 🦖 Misión Dino — Reto Diario de Ángel Eduardo

Juego educativo diario para un niño de 7 años. Cada día, el explorador **Ángel Eduardo**
descubre un nuevo dinosaurio y completa 3 misiones:

1. 📖 **Lectura** — una historia corta, con temporizador y "toca dónde te quedaste"
   para contar palabras leídas y poder retomar.
2. ❓ **Comprensión** — 3-4 preguntas sobre la historia.
3. 🔢 **Matemáticas** — sumas y restas **hasta 1000** y comparaciones (mayor/menor),
   con rampa de dificultad que crece día a día.

Al terminar: ¡confeti 🎉, estrellas ⭐, racha 🔥 y un paso más hacia el premio final!

El juego corre del **7 de julio al 15 de agosto de 2026** (~40 días / 40 dinosaurios).

## Arquitectura

| Capa       | Tecnología                                | Deploy   |
| ---------- | ----------------------------------------- | -------- |
| Frontend   | React + Vite + TypeScript                 | Vercel   |
| Backend    | Python + FastAPI + SQLAlchemy             | Railway  |
| Base datos | PostgreSQL                                | Railway  |

```
angel/
├─ backend/    # API FastAPI + contenido + migraciones + tests
├─ frontend/   # App React (Vite) + tests
├─ .pre-commit-config.yaml   # lint + format + type-check + TESTS en cada commit
└─ .github/workflows/ci.yml  # CI espejo del pre-commit
```

## Desarrollo local

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env            # ajusta DATABASE_URL (vacío = SQLite local)
python -m app.seed              # crea tablas + carga los ~40 días de contenido
uvicorn app.main:app --reload   # http://localhost:8000  (docs en /docs)
```

Sin Postgres a mano, el backend usa SQLite por defecto (`DATABASE_URL` sin definir).

### Frontend

```bash
cd frontend
npm install
cp .env.example .env            # VITE_API_URL=http://localhost:8000
npm run dev                     # http://localhost:5173
```

## Calidad

Todo se valida en **cada commit** vía `pre-commit`:

```bash
pip install pre-commit && pre-commit install
pre-commit run --all-files
```

- Python: `ruff` (lint + format), `mypy`, `pytest`
- Frontend: `eslint`, `prettier`, `tsc`, `vitest`

## Deploy

Ver [`docs/DEPLOY.md`](docs/DEPLOY.md) para pasos de Vercel + Railway + Postgres.
