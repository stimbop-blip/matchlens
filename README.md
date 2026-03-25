# MatchLens MVP

Telegram-бот + Mini App + backend для сервиса спортивной аналитики.

## Что уже готово

- Bot skeleton (aiogram): `/start`, меню, onboarding, базовые кнопки.
- Backend skeleton (FastAPI): auth через Telegram initData, bot endpoints, seed тарифов.
- Frontend skeleton (React + Vite): mobile-first темный UI с базовыми экранами + admin route.
- Docker Compose: `postgres`, `backend`, `bot`, `frontend`.

## Быстрый старт

1. Скопируйте переменные:
   - `cp .env.example .env`
2. Заполните `BOT_TOKEN` и `MINI_APP_URL` в `.env`.
3. Запустите проект:
   - `docker compose up --build`

## URLs

- Backend: `http://localhost:8000/api/v1/health`
- Frontend: `http://localhost:5173`

## Bot endpoints (backend)

- `POST /api/v1/bot/users/sync`
- `GET /api/v1/bot/subscriptions/{telegram_id}`
- `GET /api/v1/bot/stats/public`

## Mini App endpoints (backend)

- `GET /api/v1/users/me`
- `GET /api/v1/subscriptions/me`
- `GET /api/v1/tariffs`
- `GET /api/v1/predictions`
- `GET /api/v1/stats/overview`
- `POST /api/v1/payments/create`

## Admin endpoints (backend)

- `GET /api/v1/admin/predictions`
- `POST /api/v1/admin/predictions`
- `PUT /api/v1/admin/predictions/{id}`
- `DELETE /api/v1/admin/predictions/{id}`
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/payments`
- `POST /api/v1/admin/notifications/broadcast`

## ЮMoney webhook

- Endpoint: `POST /api/v1/payments/yoomoney/webhook`
- Для MVP используется Quickpay flow с `label=provider_order_id`.
- Подписка активируется автоматически после валидного webhook.

## Bot notifications

- Бот забирает очередь уведомлений: `GET /api/v1/bot/notifications/pull`
- После отправки подтверждает статус:
  - `POST /api/v1/bot/notifications/{id}/sent`
  - `POST /api/v1/bot/notifications/{id}/failed`
- Проверка подписок, заканчивающихся в ближайшие 24 часа:
  - `POST /api/v1/bot/subscriptions/queue-expiring`

## Ограничения текущего шага

- Пока без Alembic миграций (таблицы создаются на старте через `AUTO_CREATE_TABLES=true`).
- Для админки требуется роль `admin` у пользователя в таблице `users`.
- Расчет ROI пока в базовой версии (заглушка 0.0), расширим на сущности результатов.
