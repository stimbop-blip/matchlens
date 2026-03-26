from aiogram import F, Router
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message

from app.config import settings
from app.services.container import get_backend_client
from app.utils.texts import ADMIN_TEXT, FREE_PREDICTIONS_TEXT, NOTIFICATIONS_TEXT, STATS_PLACEHOLDER_TEXT, SUPPORT_PLACEHOLDER_TEXT, TARIFFS_TEXT

router = Router()


@router.message(F.text == "⚽ Бесплатные прогнозы")
@router.message(F.text == "Бесплатные прогнозы")
async def free_predictions(message: Message) -> None:
    backend_client = get_backend_client()
    if not backend_client:
        await message.answer(FREE_PREDICTIONS_TEXT)
        return

    items = await backend_client.get_latest_free_predictions(limit=3)
    if not items:
        await message.answer(
            "<b>⚽ Бесплатные прогнозы</b>\n"
            "Пока нет свежих бесплатных сигналов.\n\n"
            "Загляните позже — мы регулярно обновляем ленту."
        )
        return

    await message.answer("<b>⚽ Последние 3 бесплатных прогноза</b>")
    for idx, item in enumerate(items, start=1):
        await message.answer(
            f"<b>#{idx} • {item.get('match_name', '-')}</b>\n"
            f"Лига: {item.get('league') or '-'}\n"
            f"Сигнал: {item.get('signal_type', '-')}\n"
            f"Коэффициент: <b>{item.get('odds', '-')}</b>\n"
            f"Старт: {item.get('event_start_at', '-')}\n"
            f"{item.get('short_description') or ''}".strip()
        )


@router.message(F.text == "💎 Тарифы")
@router.message(F.text == "Тарифы")
async def tariffs(message: Message) -> None:
    backend_client = get_backend_client()
    items = await backend_client.get_tariffs() if backend_client else []
    if not items:
        await message.answer(TARIFFS_TEXT)
        return

    lines = ["<b>💎 Тарифы MatchLens</b>"]
    for item in items:
        lines.append(
            f"\n<b>{item.get('name', 'Тариф')}</b>\n"
            f"{item.get('price_rub', 0)} RUB • {item.get('duration_days', 0)} дней\n"
            f"{item.get('description') or 'Описание скоро обновим'}"
        )
    await message.answer("\n".join(lines))


@router.message(F.text == "👤 Мой профиль")
@router.message(F.text == "Мой профиль")
async def my_profile(message: Message) -> None:
    if not message.from_user:
        await message.answer("Профиль временно недоступен.")
        return

    user = message.from_user
    backend_client = get_backend_client()
    payload = await backend_client.get_my_subscription(user.id) if backend_client else None

    if payload:
        tariff = str(payload.get("tariff", "free"))
        plan = "Премиум" if tariff == "premium" else "VIP" if tariff == "vip" else "Бесплатный"

        raw_status = str(payload.get("status", "unknown")).lower()
        status = "Активна" if raw_status == "active" else "Истекла" if raw_status == "expired" else raw_status

        ends_at = payload.get("ends_at") or "-"
        access_text = "Расширенный доступ активен" if raw_status == "active" else "Проверьте статус в Mini App"
    else:
        plan = "Бесплатный"
        status = "Активна"
        ends_at = "-"
        access_text = "Доступен базовый функционал"

    await message.answer(
        "<b>👤 Профиль</b>\n"
        f"Telegram ID: <code>{user.id}</code>\n"
        f"Username: @{user.username if user.username else '-'}\n\n"
        f"<b>Тариф:</b> {plan}\n"
        f"<b>Статус:</b> {status}\n"
        f"<b>Доступ до:</b> {ends_at}\n\n"
        f"<i>{access_text}</i>"
    )


@router.message(F.text == "📊 Статистика")
@router.message(F.text == "Статистика")
async def stats(message: Message) -> None:
    backend_client = get_backend_client()
    if not backend_client:
        await message.answer(STATS_PLACEHOLDER_TEXT)
        return

    payload = await backend_client.get_public_stats()
    if not payload:
        await message.answer(STATS_PLACEHOLDER_TEXT)
        return

    await message.answer(
        "<b>📊 Статистика MatchLens</b>\n"
        f"Всего прогнозов: <b>{payload.get('total', 0)}</b>\n"
        f"Точность: <b>{payload.get('hit_rate', payload.get('winrate', 0))}%</b>\n"
        f"ROI: <b>{payload.get('roi', 0)}%</b>\n"
        f"Выигрыши: {payload.get('wins', 0)} • Поражения: {payload.get('loses', 0)} • Возвраты: {payload.get('refunds', 0)}"
    )


@router.message(F.text == "🔔 Уведомления")
@router.message(F.text == "Уведомления")
async def notification_settings(message: Message) -> None:
    await message.answer(NOTIFICATIONS_TEXT)


@router.message(F.text == "🛠 Админка")
@router.message(F.text == "Админка")
async def admin_panel(message: Message) -> None:
    if not message.from_user or message.from_user.id not in settings.admin_ids():
        await message.answer("Эта секция доступна только администраторам.")
        return
    await message.answer(ADMIN_TEXT)


@router.message(F.text == "🛟 Поддержка")
@router.message(F.text == "Поддержка")
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
        "Если нужна помощь по доступу, оплате или прогнозам — напишите нам.\n\n"
        "Отвечаем максимально быстро в рабочее время.",
        reply_markup=keyboard,
    )
