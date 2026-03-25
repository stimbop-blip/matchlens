from aiogram import F, Router
from aiogram.types import Message

from app.config import settings
from app.services.container import get_backend_client

router = Router()


@router.message(F.text == "Бесплатные прогнозы")
async def free_predictions(message: Message) -> None:
    await message.answer(
        "Откройте приложение и выберите фильтр доступа: Free."
        "\nТам доступна свежая лента бесплатных прогнозов."
    )


@router.message(F.text == "Тарифы")
async def tariffs(message: Message) -> None:
    await message.answer(
        "Доступные тарифы:\n"
        "- Free: базовый доступ\n"
        "- Premium: расширенная аналитика\n"
        "- VIP: полный доступ и приоритетные уведомления\n\n"
        f"Оформление внутри Mini App: {settings.mini_app_url}"
    )


@router.message(F.text == "Моя подписка")
async def my_subscription(message: Message) -> None:
    backend_client = get_backend_client()
    if not backend_client or not message.from_user:
        await message.answer("Не удалось получить подписку. Попробуйте позже.")
        return

    payload = await backend_client.get_my_subscription(message.from_user.id)
    if not payload:
        await message.answer("Подписка не найдена. Сейчас у вас Free-доступ.")
        return

    plan = payload.get("tariff", "free").upper()
    status = payload.get("status", "unknown")
    ends_at = payload.get("ends_at", "-")
    await message.answer(f"Тариф: {plan}\nСтатус: {status}\nДействует до: {ends_at}")


@router.message(F.text == "Статистика")
async def stats(message: Message) -> None:
    backend_client = get_backend_client()
    if not backend_client:
        await message.answer("Статистика временно недоступна.")
        return

    payload = await backend_client.get_public_stats()
    if not payload:
        await message.answer("Статистика временно недоступна.")
        return

    await message.answer(
        "Общая статистика:\n"
        f"Прогнозов: {payload.get('total', 0)}\n"
        f"Winrate: {payload.get('winrate', 0)}%\n"
        f"ROI: {payload.get('roi', 0)}%"
    )


@router.message(F.text == "Поддержка")
async def support(message: Message) -> None:
    await message.answer(f"Поддержка: {settings.bot_support_url}")


@router.message(F.text == "Мой профиль")
async def my_profile(message: Message) -> None:
    if not message.from_user:
        await message.answer("Профиль недоступен.")
        return
    user = message.from_user
    await message.answer(
        "Ваш профиль:\n"
        f"ID: {user.id}\n"
        f"Username: @{user.username if user.username else '-'}\n"
        f"Имя: {user.full_name}"
    )
