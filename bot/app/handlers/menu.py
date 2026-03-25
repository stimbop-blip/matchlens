from aiogram import F, Router
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
from aiogram.types import Message

from app.config import settings
from app.services.container import get_backend_client
from app.utils.texts import (
    FREE_PREDICTIONS_TEXT,
    STATS_PLACEHOLDER_TEXT,
    SUPPORT_PLACEHOLDER_TEXT,
    TARIFFS_TEXT,
)

router = Router()


@router.message(F.text == "Бесплатные прогнозы")
async def free_predictions(message: Message) -> None:
    await message.answer(FREE_PREDICTIONS_TEXT)


@router.message(F.text == "Тарифы")
async def tariffs(message: Message) -> None:
    await message.answer(f"{TARIFFS_TEXT}\n\n{settings.mini_app_url}")


@router.message(F.text == "Мой профиль")
@router.message(F.text == "Моя подписка")
async def my_profile(message: Message) -> None:
    if not message.from_user:
        await message.answer("Профиль временно недоступен.")
        return

    user = message.from_user
    backend_client = get_backend_client()
    payload = await backend_client.get_my_subscription(user.id) if backend_client else None

    if payload:
        plan = str(payload.get("tariff", "free")).upper()
        status = str(payload.get("status", "unknown")).upper()
        ends_at = payload.get("ends_at") or "-"
        access_text = "Расширенный доступ активен" if status == "ACTIVE" else "Проверьте статус подписки в Mini App"
    else:
        plan = "FREE"
        status = "ACTIVE"
        ends_at = "-"
        access_text = "Доступен базовый функционал Free"

    await message.answer(
        "<b>Профиль</b>\n"
        f"Telegram ID: <code>{user.id}</code>\n"
        f"Username: @{user.username if user.username else '-'}\n\n"
        f"<b>Подписка:</b> {plan}\n"
        f"<b>Статус:</b> {status}\n"
        f"<b>Доступ до:</b> {ends_at}\n\n"
        f"<i>{access_text}</i>"
    )

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
        "<b>Статистика MatchLens</b>\n"
        f"Всего прогнозов: <b>{payload.get('total', 0)}</b>\n"
        f"Winrate: <b>{payload.get('winrate', 0)}%</b>\n"
        f"ROI: <b>{payload.get('roi', 0)}%</b>\n\n"
        "Данные обновляются автоматически и помогают оценивать качество решений на дистанции."
    )


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
        "<b>Поддержка</b>\n"
        "Если возникли вопросы по подписке, оплате или работе сервиса — напишите нам.\n\n"
        "Обычно отвечаем быстро в рабочее время.",
        reply_markup=keyboard,
    )
