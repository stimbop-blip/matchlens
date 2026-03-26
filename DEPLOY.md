# Deploy (Vercel + Render/Railway)

## 1) Frontend on Vercel

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Env:
  - `VITE_API_URL=https://<backend-domain>/api/v1`
  - `VITE_PAYMENTS_ENABLED=false` (or `true` when payments are enabled)

`frontend/vercel.json` already contains SPA rewrites to `index.html`.

## 2) Backend on Render

- Blueprint file: `render.yaml` (root)
- Service: Docker web service from `backend/Dockerfile`
- Health check: `/api/v1/health`
- Required env:
  - `APP_NAME=PIT BET API`
  - `API_PREFIX=/api/v1`
  - `DEBUG=false`
  - `DATABASE_URL=<managed-postgres-url>`
  - `BOT_TOKEN=<telegram-bot-token>`
  - `AUTO_CREATE_TABLES=true`
  - `CORS_ALLOW_ORIGINS=https://<frontend-domain>`
  - `YOOMONEY_WALLET=<wallet>`
  - `YOOMONEY_NOTIFICATION_SECRET=<secret>`
  - `YOOMONEY_RETURN_URL=https://t.me/<your_bot_username>`
  - `ADMIN_TELEGRAM_IDS=<id1,id2>`
  - `PAYMENTS_ENABLED=false` (or `true`)

## 3) Backend on Railway

- Config file: `railway.toml` (root)
- Builder: Dockerfile (`backend/Dockerfile`)
- Health check: `/api/v1/health`
- Use the same env list as Render.

## 4) Telegram Mini App env mapping

- `MINI_APP_URL=https://<frontend-domain>`
- `VITE_API_URL=https://<backend-domain>/api/v1`
- `YOOMONEY_RETURN_URL=https://t.me/<your_bot_username>`
