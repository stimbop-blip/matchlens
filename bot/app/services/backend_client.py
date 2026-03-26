from __future__ import annotations

from typing import Any

import httpx


class BackendClient:
    def __init__(self, base_url: str) -> None:
        self._client = httpx.AsyncClient(base_url=base_url.rstrip("/"), timeout=10.0)

    async def close(self) -> None:
        await self._client.aclose()

    async def sync_user(self, telegram_user: dict[str, Any]) -> None:
        # Заглушка под реальный backend endpoint MVP:
        # POST /api/v1/bot/users/sync
        try:
            await self._client.post("/api/v1/bot/users/sync", json=telegram_user)
        except Exception:
            # Не блокируем UX пользователя, если backend временно недоступен
            return

    async def get_my_subscription(self, telegram_id: int) -> dict[str, Any] | None:
        try:
            response = await self._client.get(f"/api/v1/bot/subscriptions/{telegram_id}")
            if response.status_code == 200:
                return response.json()
        except Exception:
            return None
        return None

    async def get_public_stats(self) -> dict[str, Any] | None:
        try:
            response = await self._client.get("/api/v1/bot/stats/public")
            if response.status_code == 200:
                return response.json()
        except Exception:
            return None
        return None

    async def get_latest_free_predictions(self, limit: int = 3) -> list[dict[str, Any]]:
        try:
            response = await self._client.get("/api/v1/bot/predictions/free", params={"limit": limit})
            if response.status_code == 200:
                return response.json()
        except Exception:
            return []
        return []

    async def get_tariffs(self) -> list[dict[str, Any]]:
        try:
            response = await self._client.get("/api/v1/bot/tariffs")
            if response.status_code == 200:
                return response.json()
        except Exception:
            return []
        return []

    async def pull_notifications(self, limit: int = 20) -> list[dict[str, Any]]:
        try:
            response = await self._client.get("/api/v1/bot/notifications/pull", params={"limit": limit})
            if response.status_code == 200:
                return response.json()
        except Exception:
            return []
        return []

    async def mark_notification_sent(self, notification_id: str) -> None:
        try:
            await self._client.post(f"/api/v1/bot/notifications/{notification_id}/sent")
        except Exception:
            return

    async def mark_notification_failed(self, notification_id: str) -> None:
        try:
            await self._client.post(f"/api/v1/bot/notifications/{notification_id}/failed")
        except Exception:
            return

    async def queue_expiring_subscriptions(self, hours_before: int = 24) -> int:
        try:
            response = await self._client.post(
                "/api/v1/bot/subscriptions/queue-expiring",
                params={"hours_before": hours_before},
            )
            if response.status_code == 200:
                payload = response.json()
                return int(payload.get("queued", 0))
        except Exception:
            return 0
        return 0
