from __future__ import annotations

from datetime import UTC, datetime
from html import escape

from aiogram import F, Router
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message

from app.config import settings
from app.services.container import get_backend_client
from app.utils.texts import (
    ADMIN_TEXT,
    FREE_PREDICTIONS_TEXT,
    NOTIFICATIONS_TEXT,
    STATS_PLACEHOLDER_TEXT,
    SUPPORT_PLACEHOLDER_TEXT,
    TARIFFS_TEXT,
)

router = Router()


def _format_datetime(value: str | None) -> str:
    if not value:
        return "-"
    raw = value.strip()
    if not raw:
        return "-"
    try:
        normalized = raw.replace("Z", "+00:00")
        dt = datetime.fromisoformat(normalized)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=UTC)
        return dt.astimezone().strftime("%d.%m %H:%M")
    except ValueError:
        return raw


def _tariff_label(value: str) -> str:
    if value == "premium":
        return "Premium"
    if value == "vip":
        return "VIP"
    return "Free"


def _subscription_status_label(value: str) -> str:
    if value == "active":
        return "Активна"
    if value == "expired":
        return "Истекла"
    if value == "canceled":
        return "Отменена"
    if value == "inactive":
        return "Не активна"
    return value


@router.message(F.text.regexp(r"^(?:⚽️?\s*)?Бесплатные прогнозы$"))
async def free_predictions(message: Message) -> None:
    backend_client = get_backend_client()
    if not backend_client:
        await message.answer(FREE_PREDICTIONS_TEXT)
        return

    items = await backend_client.get_latest_free_predictions(limit=3)
    if not items:
        await message.answer(FREE_PREDICTIONS_TEXT)
        return

    await message.answer(
        "<b>⚽ Последние бесплатные прогнозы</b>\n"
        "Краткий дайджест по открытым сигналам."
    )

    for idx, item in enumerate(items, start=1):
        match_name = escape(str(item.get("match_name") or "Матч уточняется"))
        league = escape(str(item.get("league") or "Без лиги"))
        signal = escape(str(item.get("signal_type") or "-"))
        odds = escape(str(item.get("odds") or "-"))
        event_start = _format_datetime(item.get("event_start_at"))
        short_description = escape(str(item.get("short_description") or "").strip())

        lines = [
            f"<b>{idx}. {match_name}</b>",
            f"Лига: {league}",
            f"Сигнал: {signal}",
            f"Коэффициент: <b>{odds}</b>",
            f"Старт: {escape(event_start)}",
        ]
        if short_description:
            lines.extend(["", f"<i>{short_description}</i>"])

        await message.answer("\n".join(lines))


@router.message(F.text.regexp(r"^(?:📊\s*)?Статистика$"))
async def stats(message: Message) -> None:
    backend_client = get_backend_client()
    if not backend_client:
        await message.answer(STATS_PLACEHOLDER_TEXT)
        return

    payload = await backend_client.get_public_stats()
    if not payload:
        await message.answer(STATS_PLACEHOLDER_TEXT)
        return

    total = payload.get("total", 0)
    hit_rate = payload.get("hit_rate", payload.get("winrate", 0))
    roi = payload.get("roi", 0)
    wins = payload.get("wins", 0)
    loses = payload.get("loses", 0)
    refunds = payload.get("refunds", 0)
    pending = payload.get("pending", 0)

    await message.answer(
        "<b>📊 Статистика MatchLens</b>\n"
        f"Прогнозов: <b>{escape(str(total))}</b>\n"
        f"Точность: <b>{escape(str(hit_rate))}%</b>\n"
        f"ROI: <b>{escape(str(roi))}%</b>\n"
        f"Выигрыши: {escape(str(wins))} • Поражения: {escape(str(loses))} • Возвраты: {escape(str(refunds))}\n"
        f"В ожидании: {escape(str(pending))}"
    )


@router.message(F.text.regexp(r"^(?:👤\s*)?Мой профиль$"))
async def my_profile(message: Message) -> None:
    if not message.from_user:
        await message.answer("Профиль временно недоступен.")
        return

    user = message.from_user
    backend_client = get_backend_client()
    payload = await backend_client.get_my_subscription(user.id) if backend_client else None

    if payload:
        tariff = str(payload.get("tariff", "free"))
        status = str(payload.get("status", "inactive"))
        ends_at = _format_datetime(payload.get("ends_at"))
    else:
        tariff = "free"
        status = "inactive"
        ends_at = "-"

    username = f"@{user.username}" if user.username else "не указан"

    await message.answer(
        "<b>👤 Мой профиль</b>\n"
        f"Telegram ID: <code>{user.id}</code>\n"
        f"Username: {escape(username)}\n\n"
        f"Тариф: <b>{_tariff_label(tariff)}</b>\n"
        f"Статус: <b>{_subscription_status_label(status)}</b>\n"
        f"Доступ до: <b>{escape(ends_at)}</b>\n\n"
        "Управление доступом и настройками доступно в Mini App через кнопку меню Telegram."
    )


@router.message(F.text.regexp(r"^(?:💎\s*)?Тарифы$"))
async def tariffs(message: Message) -> None:
    backend_client = get_backend_client()
    items = await backend_client.get_tariffs() if backend_client else []
    if not items:
        await message.answer(TARIFFS_TEXT)
        return

    icon_map = {"free": "🟢", "premium": "🔷", "vip": "👑"}
    lines = ["<b>💎 Тарифы MatchLens</b>", "Выберите формат доступа под ваш риск-профиль:"]

    for item in items:
        code = str(item.get("code") or "free")
        icon = icon_map.get(code, "•")
        name = escape(str(item.get("name") or "Тариф"))
        price = escape(str(item.get("price_rub", 0)))
        duration = escape(str(item.get("duration_days", 0)))
        description = escape(str(item.get("description") or "Описание обновляется"))
        lines.append(
            f"\n<b>{icon} {name}</b>\n"
            f"{price} RUB • {duration} дней\n"
            f"{description}"
        )

    lines.append("\nПодключение и управление тарифом доступны в Mini App.")
    await message.answer("\n".join(lines))


@router.message(F.text.regexp(r"^(?:🔔\s*)?Уведомления$"))
async def notification_settings(message: Message) -> None:
    await message.answer(NOTIFICATIONS_TEXT)


@router.message(F.text.regexp(r"^(?:🛠\s*)?Админка$"))
async def admin_panel(message: Message) -> None:
    if not message.from_user or message.from_user.id not in settings.admin_ids():
        await message.answer("Эта секция доступна только администраторам.")
        return
    await message.answer(ADMIN_TEXT)


@router.message(F.text.regexp(r"^(?:🛟\s*)?Поддержка$"))
async def support(message: Message) -> None:
    support_url = settings.bot_support_url.strip()
    if not support_url or "your_support" in support_url:
        await message.answer(SUPPORT_PLACEHOLDER_TEXT)
        return

    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="Написать в поддержку", url=support_url)]]
    )
    await message.answer(
        "<b>🛟 Поддержка</b>\n"
        "Если нужна помощь по доступу, оплате или уведомлениям — напишите нам.\n\n"
        "Мы отвечаем максимально быстро в рабочее время.",
        reply_markup=keyboard,
    )
