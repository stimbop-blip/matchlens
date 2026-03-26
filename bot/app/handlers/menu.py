from __future__ import annotations

from datetime import UTC, datetime
from html import escape
from typing import cast

from aiogram import F, Router
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message

from app.config import settings
from app.keyboards.main_menu import main_menu_keyboard
from app.services.container import get_backend_client
from app.utils.texts import normalize_language, t, tariff_presentation

router = Router()


async def _message_language(message: Message) -> str:
    fallback = normalize_language(message.from_user.language_code if message.from_user else None)
    if not message.from_user:
        return fallback

    backend_client = get_backend_client()
    if not backend_client:
        return fallback

    preferences = await backend_client.get_user_preferences(message.from_user.id)
    if not preferences:
        return fallback

    return normalize_language(str(preferences.get("language") or fallback))


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


def _subscription_status_label(value: str, language: str) -> str:
    if value == "active":
        return t(language, "status_active")
    if value == "expired":
        return t(language, "status_expired")
    if value == "canceled":
        return t(language, "status_canceled")
    if value == "inactive":
        return t(language, "status_inactive")
    return value


async def _reply(message: Message, language: str, text: str, reply_markup: InlineKeyboardMarkup | None = None) -> None:
    await message.answer(
        text,
        reply_markup=reply_markup
        or main_menu_keyboard(
            language=language,
            is_admin=bool(message.from_user and message.from_user.id in settings.admin_ids()),
        ),
    )


@router.message(F.text.regexp(r"^(?:⚽️?\s*)?(?:Бесплатные прогнозы|Free Signals)$"))
async def free_predictions(message: Message) -> None:
    language = await _message_language(message)
    backend_client = get_backend_client()
    if not backend_client:
        await _reply(message, language, t(language, "free_empty"))
        return

    items = await backend_client.get_latest_free_predictions(limit=3)
    if not items:
        await _reply(message, language, t(language, "free_empty"))
        return

    await _reply(message, language, t(language, "free_header"))

    for idx, item in enumerate(items, start=1):
        match_name = escape(str(item.get("match_name") or t(language, "unknown_match")))
        league = escape(str(item.get("league") or t(language, "no_league")))
        signal = escape(str(item.get("signal_type") or "-"))
        odds = escape(str(item.get("odds") or "-"))
        event_start = _format_datetime(item.get("event_start_at"))
        short_description = escape(str(item.get("short_description") or "").strip())

        lines = [
            f"<b>{idx}. {match_name}</b>",
            f"{t(language, 'label_league')}: {league}",
            f"{t(language, 'label_signal')}: {signal}",
            f"{t(language, 'label_odds')}: <b>{odds}</b>",
            f"{t(language, 'label_start')}: {escape(event_start)}",
        ]
        if short_description:
            lines.extend(["", f"<i>{short_description}</i>"])

        await _reply(message, language, "\n".join(lines))


@router.message(F.text.regexp(r"^(?:📊\s*)?(?:Статистика(?:\s+PIT BET)?|PIT BET Stats|Stats)$"))
async def stats(message: Message) -> None:
    language = await _message_language(message)
    backend_client = get_backend_client()
    if not backend_client:
        await _reply(message, language, t(language, "stats_placeholder"))
        return

    payload = await backend_client.get_public_stats()
    if not payload:
        await _reply(message, language, t(language, "stats_placeholder"))
        return

    total = payload.get("total", 0)
    hit_rate = payload.get("hit_rate", payload.get("winrate", 0))
    roi = payload.get("roi", 0)
    wins = payload.get("wins", 0)
    loses = payload.get("loses", 0)
    refunds = payload.get("refunds", 0)
    pending = payload.get("pending", 0)

    await _reply(
        message,
        language,
        f"{t(language, 'stats_title')}\n"
        f"{t(language, 'stats_total')}: <b>{escape(str(total))}</b>\n"
        f"{t(language, 'stats_hit')}: <b>{escape(str(hit_rate))}%</b>\n"
        f"{t(language, 'stats_roi')}: <b>{escape(str(roi))}%</b>\n"
        f"{t(language, 'stats_wins')}: {escape(str(wins))} • {t(language, 'stats_loses')}: {escape(str(loses))} • {t(language, 'stats_refunds')}: {escape(str(refunds))}\n"
        f"{t(language, 'stats_pending')}: {escape(str(pending))}",
    )


@router.message(F.text.regexp(r"^(?:👤\s*)?(?:Профиль PIT BET|Мой профиль|PIT BET Profile|Profile)$"))
async def my_profile(message: Message) -> None:
    language = await _message_language(message)
    if not message.from_user:
        await _reply(message, language, t(language, "profile_unavailable"))
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

    username = f"@{user.username}" if user.username else t(language, "unknown_username")

    await _reply(
        message,
        language,
        f"{t(language, 'profile_title')}\n"
        f"Telegram ID: <code>{user.id}</code>\n"
        f"{t(language, 'profile_label_username')}: {escape(username)}\n\n"
        f"{t(language, 'profile_label_tariff')}: <b>{_tariff_label(tariff)}</b>\n"
        f"{t(language, 'profile_label_status')}: <b>{_subscription_status_label(status, language)}</b>\n"
        f"{t(language, 'profile_label_ends')}: <b>{escape(ends_at)}</b>\n\n"
        f"{t(language, 'profile_hint')}",
    )


@router.message(F.text.regexp(r"^(?:💎\s*)?(?:Тарифы(?:\s+PIT BET)?|PIT BET Tariffs|Tariffs)$"))
async def tariffs(message: Message) -> None:
    language = await _message_language(message)
    backend_client = get_backend_client()
    items = await backend_client.get_tariffs() if backend_client else []
    if not items:
        await _reply(message, language, t(language, "tariffs_fallback"))
        return

    presentation = tariff_presentation(language)
    lines = [t(language, "tariffs_title"), t(language, "tariffs_subtitle")]

    for item in items:
        code = str(item.get("code") or "free")
        data = presentation.get(code, presentation["free"])
        name = escape(str(data["label"]))
        price = escape(str(item.get("price_rub", 0)))
        duration = escape(str(item.get("duration_days", 0)))
        tag = escape(str(data["tag"]))
        raw_points = data.get("points", [])
        points = cast(list[object], raw_points) if isinstance(raw_points, list) else []
        upgrade = escape(str(data["upgrade"]))
        features = "\n".join(f"• {escape(str(point))}" for point in points)

        lines.append(
            f"\n<b>{name}</b> — <i>{tag}</i>\n"
            f"{price} RUB • {duration} {t(language, 'tariffs_days')}\n"
            f"{features}\n"
            f"{upgrade}"
        )

    lines.append(f"\n{t(language, 'tariffs_footer')}")
    await _reply(message, language, "\n".join(lines))


@router.message(F.text.regexp(r"^(?:🔔\s*)?(?:Уведомления|Notifications)$"))
async def notification_settings(message: Message) -> None:
    language = await _message_language(message)
    await _reply(message, language, t(language, "notifications_text"))


@router.message(F.text.regexp(r"^(?:🛠\s*)?(?:Админка|Admin)$"))
async def admin_panel(message: Message) -> None:
    language = await _message_language(message)
    if not message.from_user or message.from_user.id not in settings.admin_ids():
        await _reply(message, language, t(language, "admin_only"))
        return
    await _reply(message, language, t(language, "admin_text"))


@router.message(F.text.regexp(r"^(?:🛟\s*)?(?:Поддержка|Support)$"))
async def support(message: Message) -> None:
    language = await _message_language(message)
    support_url = settings.bot_support_url.strip()
    if not support_url or "your_support" in support_url:
        await _reply(message, language, t(language, "support_placeholder"))
        return

    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text=t(language, "support_button"), url=support_url)]]
    )
    await _reply(
        message,
        language,
        f"{t(language, 'support_title')}\n"
        f"{t(language, 'support_body')}",
        reply_markup=keyboard,
    )
