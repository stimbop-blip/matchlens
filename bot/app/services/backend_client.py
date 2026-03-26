from __future__ import annotations

import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class BackendClient:
    def __init__(self, base_url: str) -> None:
        self._client = httpx.AsyncClient(base_url=base_url.rstrip("/"), timeout=10.0)

    async def close(self) -> None:
        await self._client.aclose()

    async def _get_json(self, path: str, params: dict[str, Any] | None = None) -> Any | None:
        try:
            response = await self._client.get(path, params=params)
        except Exception as exc:
            logger.warning("Backend GET failed path=%s reason=%s", path, exc)
            return None

        if response.status_code != 200:
            logger.warning("Backend GET non-200 path=%s status=%s", path, response.status_code)
            return None

        try:
            return response.json()
        except Exception as exc:
            logger.warning("Backend GET invalid JSON path=%s reason=%s", path, exc)
            return None

    async def _post_ok(self, path: str, params: dict[str, Any] | None = None, json: dict[str, Any] | None = None) -> bool:
        try:
            response = await self._client.post(path, params=params, json=json)
        except Exception as exc:
            logger.warning("Backend POST failed path=%s reason=%s", path, exc)
            return False

        if response.status_code != 200:
            logger.warning("Backend POST non-200 path=%s status=%s", path, response.status_code)
            return False
        return True

    async def sync_user(self, telegram_user: dict[str, Any]) -> None:
        ok = await self._post_ok("/api/v1/bot/users/sync", json=telegram_user)
        if not ok:
            logger.warning("sync_user failed telegram_id=%s", telegram_user.get("telegram_id"))

    async def get_my_subscription(self, telegram_id: int) -> dict[str, Any] | None:
        payload = await self._get_json(f"/api/v1/bot/subscriptions/{telegram_id}")
        return payload if isinstance(payload, dict) else None

    async def get_public_stats(self) -> dict[str, Any] | None:
        payload = await self._get_json("/api/v1/bot/stats/public")
        return payload if isinstance(payload, dict) else None

    async def get_latest_free_predictions(self, limit: int = 3) -> list[dict[str, Any]]:
        payload = await self._get_json("/api/v1/bot/predictions/free", params={"limit": limit})
        return payload if isinstance(payload, list) else []

    async def get_tariffs(self) -> list[dict[str, Any]]:
        payload = await self._get_json("/api/v1/bot/tariffs")
        return payload if isinstance(payload, list) else []

    async def pull_notifications(self, limit: int = 20) -> list[dict[str, Any]]:
        payload = await self._get_json("/api/v1/bot/notifications/pull", params={"limit": limit})
        return payload if isinstance(payload, list) else []

    async def mark_notification_sent(self, notification_id: str) -> bool:
        return await self._post_ok(f"/api/v1/bot/notifications/{notification_id}/sent")

    async def mark_notification_failed(self, notification_id: str) -> bool:
        return await self._post_ok(f"/api/v1/bot/notifications/{notification_id}/failed")

    async def queue_expiring_subscriptions(self, hours_before: int = 24) -> int:
        try:
            response = await self._client.post(
                "/api/v1/bot/subscriptions/queue-expiring",
                params={"hours_before": hours_before},
            )
        except Exception as exc:
            logger.warning("queue_expiring_subscriptions failed reason=%s", exc)
            return 0

        if response.status_code != 200:
            logger.warning("queue_expiring_subscriptions non-200 status=%s", response.status_code)
            return 0

        try:
            payload = response.json()
        except Exception as exc:
            logger.warning("queue_expiring_subscriptions invalid JSON reason=%s", exc)
            return 0

        try:
            return int(payload.get("queued", 0))
        except (TypeError, ValueError):
            return 0
