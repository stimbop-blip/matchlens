from __future__ import annotations

import asyncio
import logging

from aiogram import Bot

from app.config import settings
from app.services.backend_client import BackendClient

logger = logging.getLogger(__name__)


async def run_notification_worker(bot: Bot, backend_client: BackendClient) -> None:
    iteration = 0
    while True:
        try:
            iteration += 1
            if iteration % 30 == 1:
                await backend_client.queue_expiring_subscriptions(hours_before=24)

            items = await backend_client.pull_notifications(limit=20)
            sent_ok = 0
            sent_failed = 0
            for item in items:
                notification_id = item.get("id")
                telegram_id = item.get("telegram_id")
                title = item.get("title", "Уведомление")
                message = item.get("message", "")
                if not notification_id or not telegram_id:
                    logger.warning("Notification skipped: missing id/telegram_id (%s)", item)
                    continue

                try:
                    await bot.send_message(
                        chat_id=int(telegram_id),
                        text=f"{title}\n\n{message}",
                    )
                    await backend_client.mark_notification_sent(notification_id)
                    sent_ok += 1
                except Exception as exc:
                    sent_failed += 1
                    logger.warning("Notification send failed id=%s telegram_id=%s reason=%s", notification_id, telegram_id, exc)
                    await backend_client.mark_notification_failed(notification_id)
            if items:
                logger.info("Notification worker cycle: pulled=%s sent=%s failed=%s", len(items), sent_ok, sent_failed)
        except Exception as exc:
            logger.warning("Notification worker loop error: %s", exc)

        await asyncio.sleep(max(settings.notifications_poll_interval, 3))
