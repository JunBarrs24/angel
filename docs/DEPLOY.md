# 🚀 Despliegue — Misión Dino

Arquitectura de producción:

```
angel.vacacionesaprendiendo.xyz       → Vercel   (frontend React + Vite)
        │  HTTPS
        ▼
api-angel.vacacionesaprendiendo.xyz   → Railway  (backend FastAPI + PostgreSQL)
```

Ambos servicios se **auto-despliegan** al hacer `push` a la rama `main` de
`github.com/JunBarrs24/angel`. DNS administrado en **Spaceship**.

> Orden recomendado: **backend primero** (para tener `api-angel` vivo), luego el
> frontend (necesita apuntar a esa URL), y al final se ajusta el CORS.

---

## Tabla de variables de entorno

| Servicio | Variable          | Valor                                          | Notas                              |
| -------- | ----------------- | ---------------------------------------------- | ---------------------------------- |
| Railway  | `DATABASE_URL`    | _(automática)_                                 | La inyecta el plugin de PostgreSQL |
| Railway  | `CORS_ORIGINS`    | `https://angel.vacacionesaprendiendo.xyz`      | Dominio del frontend (con https)   |
| Railway  | `GAME_START_DATE` | `2026-07-07`                                    |                                    |
| Railway  | `GAME_END_DATE`   | `2026-08-15`                                    |                                    |
| Vercel   | `VITE_API_URL`    | `https://api-angel.vacacionesaprendiendo.xyz`  | URL pública del backend            |

Nunca pongas secretos en el repo: se definen en los paneles de Railway y Vercel.

---

## 1) Backend en Railway

1. **New Project → Deploy from GitHub repo** → elige `JunBarrs24/angel`.
2. Abre el servicio → **Settings → Root Directory** = `backend`.
   (Railway leerá `backend/railway.json` y `backend/requirements.txt`.)
3. **New → Database → Add PostgreSQL.** Railway crea `DATABASE_URL` y la
   comparte con el servicio automáticamente.
4. **Variables** del servicio backend (además de `DATABASE_URL`):
   - `CORS_ORIGINS = https://angel.vacacionesaprendiendo.xyz`
   - `GAME_START_DATE = 2026-07-07`
   - `GAME_END_DATE = 2026-08-15`
5. **Deploy.** El `startCommand` de `railway.json` corre el seed (idempotente,
   carga los 40 días) y levanta uvicorn. Healthcheck en `/api/health`.
6. **Settings → Networking → Custom Domain** → `api-angel.vacacionesaprendiendo.xyz`.
   Railway te dará un destino **CNAME** (algo como `xxxx.up.railway.app`). Cópialo
   para el paso de DNS.
7. Verifica (cuando el DNS propague):
   `https://api-angel.vacacionesaprendiendo.xyz/api/health` → `{"status":"ok"}`.

> El código normaliza `postgres://` → `postgresql://`, así que la URL de Railway
> funciona tal cual con SQLAlchemy + psycopg2.

---

## 2) Frontend en Vercel

1. **Add New → Project** → importa `JunBarrs24/angel`.
2. **Root Directory** = `frontend` (el preset **Vite** se detecta solo:
   build `npm run build`, output `dist`).
3. **Environment Variables**:
   - `VITE_API_URL = https://api-angel.vacacionesaprendiendo.xyz`
4. **Deploy.**
5. **Settings → Domains** → agrega `angel.vacacionesaprendiendo.xyz`. Vercel te
   dará un destino **CNAME** (`cname.vercel-dns.com`). Cópialo para DNS.

`frontend/vercel.json` reescribe todas las rutas a `/index.html` para que el
enrutado de React Router funcione con enlaces directos y al refrescar.

---

## 3) DNS en Spaceship

Entra a Spaceship → tu dominio `vacacionesaprendiendo.xyz` → **Advanced DNS /
DNS Manager** → agrega dos registros **CNAME**:

| Tipo  | Host        | Valor (destino)                     |
| ----- | ----------- | ----------------------------------- |
| CNAME | `api-angel` | _(el CNAME que dio Railway)_        |
| CNAME | `angel`     | `cname.vercel-dns.com`              |

Guarda y espera la propagación (minutos; a veces hasta ~1 h). Railway y Vercel
emiten el certificado HTTPS automáticamente al validar el dominio.

---

## 4) Conectar CORS y probar

1. Confirma que en Railway `CORS_ORIGINS = https://angel.vacacionesaprendiendo.xyz`
   (redeploy si lo cambiaste).
2. Abre `https://angel.vacacionesaprendiendo.xyz` y juega un día completo
   end-to-end (perfil → mapa → lectura → preguntas → mate → recompensa → tienda).

---

## 5) Auto-deploy

Desde aquí, cada `push` a `main` redespliega **frontend y backend**
automáticamente. El seed corre en cada arranque del backend, pero es idempotente
(no duplica días ni borra progreso).

---

## Solución de problemas

- **CORS bloqueado en el navegador**: revisa que `CORS_ORIGINS` en Railway sea
  exactamente el dominio con `https://` y sin barra final. Si usas también las
  URLs de _preview_ de Vercel (`*.vercel.app`), agrégalas separadas por coma.
- **404 al refrescar una ruta (p. ej. `/tienda`)**: falta el rewrite → confirma
  que `frontend/vercel.json` está desplegado.
- **El backend no arranca**: revisa los logs de Railway. Si es la versión de
  Python, fija una con un archivo `backend/.python-version` (p. ej. `3.12`).
- **La tienda no muestra premios**: el catálogo vive en
  `backend/app/store_catalog.json` (se cachea al arrancar; reinicia tras editar).
- **No hay retos**: el seed no corrió; revisa que `DATABASE_URL` esté presente y
  vuelve a desplegar.
