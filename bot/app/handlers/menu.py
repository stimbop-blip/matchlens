from __future__ import annotations

from datetime import UTC, datetime
from html import escape
from typing import Any, cast

from aiogram import F, Router
from aiogram.exceptions import TelegramBadRequest
from aiogram.filters import Command
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, Message

from app.config import settings
from app.keyboards.main_menu import main_menu_keyboard, section_nav_keyboard
from app.services.container import get_backend_client
from app.utils.texts import button, normalize_language, t, tariff_presentation

router = Router()

_FREE_CACHE: dict[int, list[dict[str, Any]]] = {}
_FREE_CACHE_LIMIT = 300


def _is_admin(user_id: int | None) -> bool:
    return bool(user_id and user_id in settings.admin_ids())


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


def _trim_text(value: str, max_len: int = 30) -> str:
    clean = value.strip()
    if len(clean) <= max_len:
        return clean
    return f"{clean[: max_len - 1].rstrip()}…"


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


def _remember_free(user_id: int, items: list[dict[str, Any]]) -> None:
    _FREE_CACHE[user_id] = items
    if len(_FREE_CACHE) <= _FREE_CACHE_LIMIT:
        return
    oldest_key = next(iter(_FREE_CACHE), None)
    if oldest_key is not None:
        _FREE_CACHE.pop(oldest_key, None)


async def _resolve_language(user_id: int | None, fallback: str | None) -> str:
    language = normalize_language(fallback)
    if not user_id:
        return language

    backend_client = get_backend_client()
    if not backend_client:
        return language

    preferences = await backend_client.get_user_preferences(user_id)
    if not preferences:
        return language

    return normalize_language(str(preferences.get("language") or language))


def _legacy_action_map() -> dict[str, str]:
    return {
        button("ru", "free"): "menu:free",
        button("en", "free"): "menu:free",
        button("ru", "stats"): "menu:stats",
        button("en", "stats"): "menu:stats",
        button("ru", "profile"): "menu:profile",
        button("en", "profile"): "menu:profile",
        button("ru", "tariffs"): "menu:tariffs",
        button("en", "tariffs"): "menu:tariffs",
        button("ru", "notifications"): "menu:notifications",
        button("en", "notifications"): "menu:notifications",
        button("ru", "support"): "menu:support",
        button("en", "support"): "menu:support",
        button("ru", "admin"): "menu:admin",
        button("en", "admin"): "menu:admin",
        "Меню": "menu:main",
        "Menu": "menu:main",
    }


async def _send_screen(message: Message, text: str, reply_markup: InlineKeyboardMarkup) -> None:
    await message.answer(text, reply_markup=reply_markup, disable_web_page_preview=True)


async def _edit_screen(query: CallbackQuery, text: str, reply_markup: InlineKeyboardMarkup) -> None:
    if not query.message:
        await query.answer()
        return

    try:
        await query.message.edit_text(text, reply_markup=reply_markup, disable_web_page_preview=True)
    except TelegramBadRequest as exc:
        if "message is not modified" not in str(exc).lower():
            await query.message.answer(text, reply_markup=reply_markup, disable_web_page_preview=True)

    await query.answer()


async def _build_menu_screen(language: str, user_id: int | None) -> tuple[str, InlineKeyboardMarkup]:
    return (
        t(language, "menu_intro"),
        main_menu_keyboard(language=language, is_admin=_is_admin(user_id)),
    )


async def _build_free_screen(language: str, user_id: int | None) -> tuple[str, InlineKeyboardMarkup]:
    backend_client = get_backend_client()
    items = await backend_client.get_latest_free_predictions(limit=3) if backend_client else []

    if user_id is not None:
        _remember_free(user_id, items)

    if not items:
        return (
            t(language, "free_empty"),
            section_nav_keyboard(language=language, back_callback="menu:main", include_open_app=True),
        )

    lines = [t(language, "free_title"), t(language, "free_hint"), ""]
    rows: list[list[InlineKeyboardButton]] = []

    for idx, item in enumerate(items, start=1):
        match_name = str(item.get("match_name") or t(language, "unknown_match"))
        league = str(item.get("league") or t(language, "no_league"))
        odds = str(item.get("odds") or "-")
        event_start = _format_datetime(cast(str | None, item.get("event_start_at")))
        lines.append(f"<b>{idx}. {escape(match_name)}</b> • {t(language, 'label_odds')}: <b>{escape(odds)}</b>")
        lines.append(f"{t(language, 'label_league')}: {escape(league)} • {t(language, 'label_start')}: {escape(event_start)}")
        lines.append("")
        rows.append(
            [
                InlineKeyboardButton(
                    text=t(language, "free_row").format(idx=idx, match=_trim_text(match_name)),
                    callback_data=f"menu:free:detail:{idx - 1}",
                )
            ]
        )

    rows.append([InlineKeyboardButton(text=t(language, "open_mini_app"), url=settings.mini_app_url)])
    rows.append([InlineKeyboardButton(text=t(language, "nav_menu"), callback_data="menu:main")])
    return ("\n".join(lines).strip(), InlineKeyboardMarkup(inline_keyboard=rows))


async def _build_free_details_screen(language: str, user_id: int | None, detail_index: int) -> tuple[str, InlineKeyboardMarkup]:
    items = _FREE_CACHE.get(user_id or -1, [])
    if detail_index < 0 or detail_index >= len(items):
        return (
            t(language, "free_details_missing"),
            section_nav_keyboard(language=language, back_callback="menu:free", include_open_app=True),
        )

    item = items[detail_index]
    match_name = escape(str(item.get("match_name") or t(language, "unknown_match")))
    league = escape(str(item.get("league") or t(language, "no_league")))
    signal = escape(str(item.get("signal_type") or "-"))
    odds = escape(str(item.get("odds") or "-"))
    event_start = escape(_format_datetime(cast(str | None, item.get("event_start_at"))))
    short_description = escape(str(item.get("short_description") or "").strip())

    lines = [
        t(language, "free_details_title"),
        f"<b>{match_name}</b>",
        f"{t(language, 'label_league')}: {league}",
        f"{t(language, 'label_signal')}: {signal}",
        f"{t(language, 'label_odds')}: <b>{odds}</b>",
        f"{t(language, 'label_start')}: {event_start}",
    ]
    if short_description:
        lines.extend(["", short_description])
    lines.extend(["", t(language, "profile_hint")])

    return (
        "\n".join(lines),
        section_nav_keyboard(language=language, back_callback="menu:free", include_open_app=True),
    )


async def _build_stats_screen(language: str) -> tuple[str, InlineKeyboardMarkup]:
    backend_client = get_backend_client()
    payload = await backend_client.get_public_stats() if backend_client else None
    if not payload:
        return (
            t(language, "stats_placeholder"),
            section_nav_keyboard(language=language, back_callback="menu:main", include_open_app=True),
        )

    total = payload.get("total", 0)
    hit_rate = payload.get("hit_rate", payload.get("winrate", 0))
    roi = payload.get("roi", 0)
    wins = payload.get("wins", 0)
    loses = payload.get("loses", 0)
    refunds = payload.get("refunds", 0)
    pending = payload.get("pending", 0)

    text = (
        f"{t(language, 'stats_title')}\n"
        f"{t(language, 'stats_subtitle')}\n\n"
        f"{t(language, 'stats_total')}: <b>{escape(str(total))}</b>\n"
        f"{t(language, 'stats_hit')}: <b>{escape(str(hit_rate))}%</b>\n"
        f"{t(language, 'stats_roi')}: <b>{escape(str(roi))}%</b>\n"
        f"{t(language, 'stats_wins')}: {escape(str(wins))} • {t(language, 'stats_loses')}: {escape(str(loses))}\n"
        f"{t(language, 'stats_refunds')}: {escape(str(refunds))} • {t(language, 'stats_pending')}: {escape(str(pending))}"
    )

    return (
        text,
        section_nav_keyboard(language=language, back_callback="menu:main", include_open_app=True),
    )


async def _build_profile_screen(language: str, user_id: int | None, username: str | None) -> tuple[str, InlineKeyboardMarkup]:
    if not user_id:
        return (
            t(language, "profile_unavailable"),
            section_nav_keyboard(language=language, back_callback="menu:main", include_open_app=True),
        )

    backend_client = get_backend_client()
    subscription = await backend_client.get_my_subscription(user_id) if backend_client else None
    referral = await backend_client.get_user_referral(user_id) if backend_client else None

    tariff = str(subscription.get("tariff", "free")) if subscription else "free"
    status = str(subscription.get("status", "inactive")) if subscription else "inactive"
    ends_at = _format_datetime(cast(str | None, subscription.get("ends_at"))) if subscription else "-"

    referral_code = str(referral.get("referral_code") or t(language, "profile_referral_missing")) if referral else t(language, "profile_referral_missing")
    referral_link = str(referral.get("referral_link") or "") if referral else ""

    name_text = f"@{username}" if username else t(language, "unknown_username")
    lines = [
        t(language, "profile_title"),
        f"Telegram ID: <code>{user_id}</code>",
        f"{t(language, 'profile_label_username')}: {escape(name_text)}",
        "",
        f"{t(language, 'profile_label_tariff')}: <b>{_tariff_label(tariff)}</b>",
        f"{t(language, 'profile_label_status')}: <b>{_subscription_status_label(status, language)}</b>",
        f"{t(language, 'profile_label_ends')}: <b>{escape(ends_at)}</b>",
        f"{t(language, 'profile_label_referral')}: <code>{escape(referral_code)}</code>",
    ]
    if referral_link:
        lines.append(f"{t(language, 'profile_label_referral_link')}: {escape(referral_link)}")
    lines.extend(["", t(language, "profile_hint")])

    return (
        "\n".join(lines),
        section_nav_keyboard(language=language, back_callback="menu:main", include_open_app=True),
    )


async def _build_tariffs_screen(language: str) -> tuple[str, InlineKeyboardMarkup]:
    backend_client = get_backend_client()
    items = await backend_client.get_tariffs() if backend_client else []
    if not items:
        return (
            t(language, "tariffs_fallback"),
            section_nav_keyboard(language=language, back_callback="menu:main", include_open_app=True),
        )

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
        features = "\n".join(f"• {escape(str(point))}" for point in points)
        lines.append(
            f"\n<b>{name}</b> — <i>{tag}</i>\n"
            f"{price} RUB • {duration} {t(language, 'tariffs_days')}\n"
            f"{features}"
        )

    lines.append(f"\n{t(language, 'tariffs_footer')}")
    return (
        "\n".join(lines),
        section_nav_keyboard(language=language, back_callback="menu:main", include_open_app=True),
    )


async def _build_notifications_screen(language: str) -> tuple[str, InlineKeyboardMarkup]:
    return (
        t(language, "notifications_text"),
        section_nav_keyboard(language=language, back_callback="menu:main", include_open_app=True),
    )


async def _build_support_screen(language: str) -> tuple[str, InlineKeyboardMarkup]:
    support_url = settings.bot_support_url.strip()
    nav_keyboard = section_nav_keyboard(language=language, back_callback="menu:main", include_open_app=True)
    if not support_url or "your_support" in support_url:
        return (t(language, "support_placeholder"), nav_keyboard)

    rows = [
        [InlineKeyboardButton(text=t(language, "support_button"), url=support_url)],
        *nav_keyboard.inline_keyboard,
    ]
    return (
        f"{t(language, 'support_title')}\n{t(language, 'support_body')}",
        InlineKeyboardMarkup(inline_keyboard=rows),
    )


async def _build_admin_screen(language: str, user_id: int | None) -> tuple[str, InlineKeyboardMarkup]:
    if not _is_admin(user_id):
        return (
            t(language, "admin_only"),
            section_nav_keyboard(language=language, back_callback="menu:main", include_open_app=True),
        )
    return (
        t(language, "admin_text"),
        section_nav_keyboard(language=language, back_callback="menu:main", include_open_app=True),
    )


async def _build_screen(
    action: str,
    *,
    language: str,
    user_id: int | None,
    username: str | None,
) -> tuple[str, InlineKeyboardMarkup]:
    if action == "menu:main":
        return await _build_menu_screen(language, user_id)
    if action == "menu:free":
        return await _build_free_screen(language, user_id)
    if action.startswith("menu:free:detail:"):
        index_raw = action.rsplit(":", maxsplit=1)[-1]
        try:
            detail_index = int(index_raw)
        except ValueError:
            detail_index = -1
        return await _build_free_details_screen(language, user_id, detail_index)
    if action == "menu:stats":
        return await _build_stats_screen(language)
    if action == "menu:profile":
        return await _build_profile_screen(language, user_id, username)
    if action == "menu:tariffs":
        return await _build_tariffs_screen(language)
    if action == "menu:notifications":
        return await _build_notifications_screen(language)
    if action == "menu:support":
        return await _build_support_screen(language)
    if action == "menu:admin":
        return await _build_admin_screen(language, user_id)
    return await _build_menu_screen(language, user_id)


@router.callback_query(F.data.startswith("menu:"))
async def on_menu_callback(query: CallbackQuery) -> None:
    user = query.from_user
    action = query.data or "menu:main"
    language = await _resolve_language(user.id if user else None, user.language_code if user else None)
    text, markup = await _build_screen(
        action,
        language=language,
        user_id=user.id if user else None,
        username=user.username if user else None,
    )
    await _edit_screen(query, text, markup)


@router.message(Command("menu"))
async def open_menu_command(message: Message) -> None:
    user = message.from_user
    language = await _resolve_language(user.id if user else None, user.language_code if user else None)
    text, markup = await _build_menu_screen(language, user.id if user else None)
    await _send_screen(message, text, markup)


@router.message(F.text)
async def open_legacy_button_flow(message: Message) -> None:
    raw_text = (message.text or "").strip()
    action = _legacy_action_map().get(raw_text)
    if not action:
        return

    user = message.from_user
    language = await _resolve_language(user.id if user else None, user.language_code if user else None)
    text, markup = await _build_screen(
        action,
        language=language,
        user_id=user.id if user else None,
        username=user.username if user else None,
    )
    await _send_screen(message, text, markup)
