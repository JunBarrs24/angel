# 🦖 Misión Dino — Plan por fases y prompts de handoff

Proyecto: juego educativo diario para **Ángel Eduardo** (7 años). Tema **dinosaurios**.
Corre del **7 de julio al 15 de agosto de 2026** (40 días / 40 dinosaurios).
Cada día: **lectura** (con timer y "toca dónde te quedaste"), **3-4 preguntas** de
comprensión y **matemáticas** (sumas/restas **hasta 1000** + mayor/menor, con rampa de
dificultad). Todo en **español**. 100% gamificado (confeti, estrellas, racha, premio final).

## Convenciones globales (aplican a TODAS las fases)

- **Monorepo**: `backend/` (Python + FastAPI + SQLAlchemy) y `frontend/` (React + Vite + TS).
- **Idioma del producto y contenido**: español (neutro latinoamericano).
- **Mate hasta 1000** con rampa de dificultad (fácil al inicio, 3 cifras al final).
- **Fechas del juego**: `GAME_START_DATE=2026-07-07`, `GAME_END_DATE=2026-08-15`.
- **Calidad — TODOS los tests en CADA commit** (ya configurado en `.pre-commit-config.yaml`):
  backend `ruff` + `mypy` + `pytest`; frontend `eslint` + `prettier` + `tsc` + `vitest`.
  Instalar: `pip install pre-commit && pre-commit install`.
- **CI** en `.github/workflows/ci.yml` (espejo del pre-commit).
- **No romper** los contratos de la API ya definidos en `backend/app/schemas.py`.

## Estado actual (hecho en Fase 0 + ventaja inicial)

- ✅ **Fase 0**: repo, `.gitignore`, `README.md`, `.pre-commit-config.yaml`, CI,
  scaffold de `backend/` y `frontend/` con tooling.
- 🟡 **Fase 1 (ventaja)**: backend YA IMPLEMENTADO en `backend/app/` (models, schemas,
  services, `math_gen`, `gamification`, routers, `main`). **Falta ejecutarlo, escribir
  `seed.py` y los tests, y dejar ruff/mypy/pytest en verde.**
- 🟡 **Fase 2 (ventaja)**: las 40 historias + preguntas ya están escritas y validadas en
  `backend/app/content/days_*.json` (estructura OK, días 1..40). **Falta curarlas y el loader.**
- ⬜ Fase 3, 4, 5: pendientes.

### Endpoints ya definidos (backend/app/routers)

- `GET  /api/health`
- `POST /api/child` · `GET /api/child/{id}` — perfil sin login
- `GET  /api/today?child_id=&as_of=YYYY-MM-DD` — reto de hoy (as_of para previsualizar)
- `GET  /api/day/{day_number}?child_id=&as_of=`
- `GET  /api/map?child_id=&as_of=`
- `POST /api/reading` — guarda progreso de lectura (índice, segundos, palabras, terminado)
- `POST /api/answers/comprehension` — feedback inmediato (no persiste)
- `POST /api/answers/math` — feedback inmediato (no persiste)
- `POST /api/answers/complete` — envío final: califica, calcula estrellas, guarda
- `GET  /api/progress?child_id=&as_of=` — estrellas, racha, medallas

---

## PROMPT — Fase 1: Backend (verificar, seed, tests, verde)

```
Trabaja en el monorepo `angel/`, carpeta `backend/` (Python + FastAPI + SQLAlchemy).
El backend YA está implementado en `backend/app/` (models, schemas, services, math_gen,
gamification, routers, main). Tu trabajo es dejarlo funcionando y probado.

Contexto: juego educativo diario en español para un niño de 7 años. Mate hasta 1000 con
rampa de dificultad. Fechas del juego 2026-07-07 a 2026-08-15. Lee PHASES.md para las
convenciones y los endpoints ya definidos. NO cambies los contratos de schemas.py sin
buena razón.

Tareas:
1. Crea un entorno: `python3 -m venv .venv && source .venv/bin/activate && pip install -e ".[dev]"`.
2. Escribe `backend/app/seed.py` (ejecutable con `python -m app.seed`) que:
   - llame a `create_all()`,
   - cargue TODOS los archivos `backend/app/content/days_*.json` a la tabla `day_challenge`
     (+ sus `question`), calculando `word_count = len(story.split())` y
     `math_max = math_gen.difficulty_max(day_number)`,
   - asigne `date = GAME_START_DATE + (day_number - 1) días`,
   - sea IDEMPOTENTE (no duplica si ya existe ese day_number),
   - cree un `Child` por defecto si no hay ninguno.
3. Arranca `uvicorn app.main:app --reload` y verifica con /docs o curl:
   today (usa `as_of=2026-07-07`), map, reading, answers/comprehension, answers/math,
   answers/complete, progress. Corrige cualquier bug.
4. Escribe tests con `pytest` en `backend/tests/`:
   - `test_math_gen.py`: determinismo (misma semilla → mismos ejercicios), rampa
     (difficulty_max(1)=20, difficulty_max(40)=1000, monótona), restas nunca negativas,
     sumas <= techo del día, check_answers correcto.
   - `test_gamification.py`: compute_stars (1/2/3 estrellas), compute_streak (racha viva
     hoy/ayer, huecos rompen), best_streak_from_dates, compute_badges.
   - `test_api.py`: usa una DB SQLite temporal (fixture que hace create_all + inserta 1-2
     DayChallenge con preguntas), y prueba los endpoints: today/day/map, guardar lectura
     y retomar, complete otorga estrellas y es idempotente, progress refleja el avance,
     día bloqueado devuelve 403.
5. Deja TODO en verde: `ruff check .`, `ruff format --check .`, `mypy app`, `pytest`.

Criterio de aceptación: `python -m app.seed` carga 40 días; los 4 comandos de calidad
pasan; `curl 'http://localhost:8000/api/today?child_id=1&as_of=2026-07-07'` responde 200.
```

---

## PROMPT — Fase 2: Contenido (curar y validar las 40 historias)

```
Trabaja en `backend/app/content/`. Ya existen `days_01_10.json` ... `days_31_40.json`
con 40 días (historias de dinosaurios en español + 3-4 preguntas de opción múltiple).
Lee PHASES.md para el contexto.

Tareas:
1. Revisa CADA historia para: español correcto y cálido, nivel de lectura de 7 años,
   nada de contenido que asuste, y datos de dinosaurios razonables.
2. Verifica que en CADA pregunta el `correct_index` (0-based, 3 opciones) apunte de verdad
   a la respuesta deducible del texto. Corrige los que estén mal.
3. Asegura variedad del índice correcto (que no sea siempre la misma posición) y que las
   opciones incorrectas sean plausibles pero claramente distintas.
4. Escribe/añade un test `backend/tests/test_content.py` que valide TODOS los JSON:
   - exactamente 40 objetos con day_number 1..40 sin repetir,
   - dino_name único por día,
   - 3-4 preguntas por día, cada una con EXACTAMENTE 3 opciones y correct_index en [0,2],
   - longitud de story entre ~120 y ~210 palabras,
   - JSON válido.
5. Deja el test en verde e integra con `pytest`.

Criterio de aceptación: `pytest backend/tests/test_content.py` pasa; una lectura humana de
5 días al azar se siente natural y las respuestas correctas son inequívocas.
```

---

## PROMPT — Fase 3: Frontend (app React completa)

```
Trabaja en `frontend/` (React + Vite + TypeScript). El scaffold y el tooling ya existen
(eslint, prettier, tsc, vitest). Deps sugeridas ya están en package.json: react-router-dom,
@tanstack/react-query, framer-motion, canvas-confetti. Ejecuta `npm install` primero.
Lee PHASES.md para el contexto y los endpoints del backend (base URL en `import.meta.env.VITE_API_URL`).

Construye la app, pensada para TABLET y un niño de 7 años (botones grandes, colores vivos,
mucho feedback, español). Pantallas y flujo:
1. Onboarding/Perfil: elegir avatar de dino + nombre (por defecto "Ángel Eduardo"),
   `POST /api/child`, guardar child_id en localStorage.
2. Mapa: camino de 40 dinosaurios (`GET /api/map`), cada uno con estado
   locked/available/today/completed y estrellas. El de hoy resaltado. Barra de progreso
   hacia el premio final (día 40). Soporta `?as_of=` para previsualizar antes del 7 de julio.
3. Flujo del día (al tocar el dino de hoy → `GET /api/today`):
   a. LECTURA: historia con palabras TOCABLES (cada una con índice). Temporizador que
      sube hasta 60 min (muéstralo como "oxígeno"/combustible divertido). El niño toca la
      palabra donde se quedó → guarda `last_word_index` y `words_read` con `POST /api/reading`.
      Al reabrir, resalta hasta `last_word_index` y permite CONTINUAR. Botón "Terminé de leer".
   b. PREGUNTAS: 3-4 de opción múltiple, botones grandes, feedback inmediato con
      `POST /api/answers/comprehension` (✓ verde / reintento amable).
   c. MATEMÁTICAS: para sum/sub un teclado numérico grande; para compare botones < = >.
      Feedback con `POST /api/answers/math`.
   d. COMPLETAR: `POST /api/answers/complete` con las respuestas → pantalla de recompensa
      (estrellas ganadas, racha, medallas nuevas). (El confeti/animaciones ricos son Fase 4;
      deja los "ganchos" listos.)
4. Progreso: `GET /api/progress` (estrellas totales, racha, medallas).

Requisitos técnicos:
- Cliente de API tipado en `src/api/`. React Query para datos. React Router para navegación.
- Estado del child_id en localStorage; hook `useChild`.
- Tests con vitest + @testing-library/react para: render del mapa, componente de lectura
  (tocar palabra actualiza índice), y flujo de una pregunta.
- Mantén verde: `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test:run`.

Criterio de aceptación: `npm run dev` permite jugar un día completo de principio a fin
contra el backend local (con `as_of=2026-07-07`), guardando y retomando la lectura, y los
4 comandos de calidad pasan.
```

---

## PROMPT — Fase 4: Gamificación (pulido)

```
Trabaja en `frontend/`. La app ya funciona (Fase 3). Añade la capa de "se siente un juego":
Lee PHASES.md para el contexto (tema dinosaurios, niño de 7 años, español).

Tareas:
1. Confeti con `canvas-confetti` al completar cada día y al ganar medallas.
2. Transiciones y micro-animaciones con `framer-motion` (aparición de estrellas, dino que
   "despega" al siguiente, botones con rebote, check verde animado).
3. Pantalla de recompensa vistosa: estrellas ganadas con animación, racha 🔥, medallas
   nuevas destacadas, y avance en la barra hacia el premio final (día 40 = tesoro).
4. Sonidos suaves opcionales (acierto, completar) con toggle de silencio (silenciado por
   defecto para respetar entornos públicos). Nada de audio automático intrusivo.
5. Estados vacíos/limbo amables: "aún no empieza la aventura", "vuelve mañana",
   día ya completado ("¡ya conquistaste este planeta!").
6. Accesibilidad básica y tamaños táctiles grandes.
7. Mantén verde lint/format/typecheck/tests; agrega tests donde tenga sentido.

Criterio de aceptación: completar un día dispara confeti y animaciones fluidas; la pantalla
de recompensa comunica progreso hacia el premio final; los comandos de calidad pasan.
```

---

## PROMPT — Fase 5: Deploy (Vercel + Railway + Postgres)

```
Objetivo: publicar el juego. Backend en Railway (+ Postgres), frontend en Vercel.
Lee PHASES.md. NO expongas secretos en el repo.

Backend (Railway):
1. Servicio Python que corre `uvicorn app.main:app --host 0.0.0.0 --port $PORT` desde
   `backend/`. Añade `backend/railway.json` o `Procfile` según convenga.
2. Agrega el plugin de PostgreSQL (Railway inyecta `DATABASE_URL`; el código ya normaliza
   `postgres://` → `postgresql://`).
3. Corre el seed en el deploy (release/postdeploy o al arranque): `python -m app.seed`.
4. Variables: `DATABASE_URL` (auto), `CORS_ORIGINS` = dominio de Vercel,
   `GAME_START_DATE=2026-07-07`, `GAME_END_DATE=2026-08-15`.

Frontend (Vercel):
5. Proyecto apuntando a `frontend/`. Build `npm run build`, output `dist`.
6. Variable `VITE_API_URL` = URL pública del backend de Railway.
7. Añade `frontend/vercel.json` con rewrite SPA (todas las rutas → `/index.html`).

Docs:
8. Escribe `docs/DEPLOY.md` con los pasos exactos y la tabla de variables de entorno.

Criterio de aceptación: la URL de Vercel carga el juego, habla con el backend de Railway,
persiste en Postgres, y se puede jugar un día completo end-to-end.
```
