from __future__ import annotations

import asyncio
import logging
from html import escape

from aiogram import Bot
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from app.config import settings
from app.services.backend_client import BackendClient

logger = logging.getLogger(__name__)


def _render_message(title: str, message: str) -> str:
    title_text = escape(title.strip() or "Обновление PIT BET")
    raw_message = message.strip()
    if title.strip().startswith("💬 Уточнение по оплате PIT BET"):
        body_text = raw_message
    else:
        body_text = escape(raw_message)
    if body_text:
        return f"<b>{title_text}</b>\n\n{body_text}"
    return f"<b>{title_text}</b>"


async def run_notification_worker(bot: Bot, backend_client: BackendClient) -> None:
    iteration = 0
    while True:
        try:
            iteration += 1
            if iteration % 30 == 1:
                queued_expiring = await backend_client.queue_expiring_subscriptions(hours_before=24)
                if queued_expiring > 0:
                    logger.info("notification_worker queued_expiring=%s", queued_expiring)

            items = await backend_client.pull_notifications(limit=20)
            pulled = len(items)
            logger.info("notification_worker pulled_count=%s", pulled)
            sent_ok = 0
            sent_failed = 0
            skipped = 0

            for item in items:
                notification_id = item.get("id")
                telegram_id = item.get("telegram_id")
                title = str(item.get("title") or "Обновление PIT BET")
                message = str(item.get("message") or "")
                button_text = str(item.get("button_text") or "").strip()
                button_url = str(item.get("button_url") or "").strip()

                logger.info(
                    "notification_worker processing_notification_id=%s telegram_id=%s",
                    notification_id,
                    telegram_id,
                )

                if not notification_id:
                    skipped += 1
                    logger.warning("notification_worker skipped reason=missing_id payload=%s", item)
                    continue

                if not telegram_id:
                    skipped += 1
                    logger.warning("notification_worker skipped id=%s reason=missing_telegram_id", notification_id)
                    ack_failed = await backend_client.mark_notification_failed(notification_id)
                    if not ack_failed:
                        logger.warning("notification_worker failed_to_ack_failed id=%s", notification_id)
                    logger.info("notification_worker skipped id=%s reason=missing_telegram_id", notification_id)
                    continue

                try:
                    reply_markup = None
                    if button_text and button_url:
                        reply_markup = InlineKeyboardMarkup(
                            inline_keyboard=[[InlineKeyboardButton(text=button_text, url=button_url)]]
                        )

                    await bot.send_message(
                        chat_id=int(telegram_id),
                        text=_render_message(title, message),
                        disable_web_page_preview=True,
                        reply_markup=reply_markup,
                    )
                    ack_sent = await backend_client.mark_notification_sent(notification_id)
                    if not ack_sent:
                        logger.warning("notification_worker failed_to_ack_sent id=%s", notification_id)
                    sent_ok += 1
                    logger.info("notification_worker sent id=%s telegram_id=%s", notification_id, telegram_id)
                except Exception as exc:
                    sent_failed += 1
                    logger.warning(
                        "notification_worker send_failed id=%s telegram_id=%s reason=%s",
                        notification_id,
                        telegram_id,
                        exc,
                    )
                    ack_failed = await backend_client.mark_notification_failed(notification_id)
                    if not ack_failed:
                        logger.warning("notification_worker failed_to_ack_failed id=%s", notification_id)
                    logger.info("notification_worker failed id=%s telegram_id=%s", notification_id, telegram_id)
            logger.info(
                "notification_worker cycle pulled=%s sent=%s failed=%s skipped=%s",
                pulled,
                sent_ok,
                sent_failed,
                skipped,
            )
        except Exception as exc:
            logger.warning("notification_worker loop_error reason=%s", exc)

        await asyncio.sleep(max(settings.notifications_poll_interval, 3))
