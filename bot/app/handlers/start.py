import contextlib
from typing import Any

from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import Message, ReplyKeyboardRemove

from app.config import settings
from app.keyboards.main_menu import main_menu_keyboard, reply_main_menu
from app.services.container import get_backend_client
from app.utils.texts import normalize_language, t

router = Router()


def _extract_referral_code(text: str | None) -> str | None:
    if not text:
        return None
    parts = text.strip().split(maxsplit=1)
    if len(parts) < 2:
        return None
    arg = parts[1].strip()
    if not arg.lower().startswith("ref_"):
        return None
    code = "".join(ch for ch in arg[4:] if ch.isalnum()).upper()
    return code or None


def _format_stat_line(stats: dict[str, Any] | None, language: str) -> str:
    """Форматирует строку реальной статистики для стартового сообщения."""
    if not stats:
        # Фолбэк, если бэкенд недоступен
        return ""

    hit_rate = stats.get("hit_rate", 0)
    roi = stats.get("roi", 0)
    total = stats.get("total", 0)
    pending = stats.get("pending", 0)
    wins = stats.get("wins", 0)

    # ROI с плюсом если положительный
    roi_str = f"+{roi:.1f}%" if roi >= 0 else f"{roi:.1f}%"

    if language == "ru":
        return (
            f"📊 Точность: <b>{hit_rate:.0f}%</b>  |  💰 ROI: <b>{roi_str}</b>\n"
            f"🎯 Сигналов всего: <b>{total}</b>  |  ⏳ В игре: <b>{pending}</b>  |  ✅ Побед: <b>{wins}</b>"
        )
    return (
        f"📊 Hit rate: <b>{hit_rate:.0f}%</b>  |  💰 ROI: <b>{roi_str}</b>\n"
        f"🎯 Total signals: <b>{total}</b>  |  ⏳ Live: <b>{pending}</b>  |  ✅ Won: <b>{wins}</b>"
    )


@router.message(CommandStart())
async def cmd_start(message: Message) -> None:
    user = message.from_user
    backend_client = get_backend_client()
    referral_code = _extract_referral_code(message.text)
    language = normalize_language(user.language_code if user else None)

    stats = None
    if backend_client and user:
        await backend_client.sync_user(
            {
                "telegram_id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "language_code": user.language_code,
                "referral_code": referral_code,
            }
        )
        preferences = await backend_client.get_user_preferences(user.id)
        if preferences:
            language = normalize_language(str(preferences.get("language") or language))

        # Получаем реальную статистику
        stats = await backend_client.get_public_stats()

    # Формируем сообщение с реальными цифрами
    stat_line = _format_stat_line(stats, language)
    if stat_line:
        # Подставляем реальные цифры в шаблон
        intro = t(language, "start_message")
        start_text = f"{intro}\n\n{stat_line}"
    else:
        # Если бэкенд недоступен — без статистики
        start_text = t(language, "start_message")

    # Удаляем команду /start
    with contextlib.suppress(Exception):
        await message.delete()

    cleanup = await message.answer(".", reply_markup=ReplyKeyboardRemove())
    with contextlib.suppress(Exception):
        await cleanup.delete()

    is_admin = bool(user and user.id in settings.admin_ids())

    # Ответ: приветствие + inline-кнопки
    await message.answer(
        start_text,
        reply_markup=main_menu_keyboard(language=language, is_admin=is_admin),
        disable_web_page_preview=True,
    )

    # Показываем постоянное нижнее меню (3 кнопки) — без лишнего текста
    with contextlib.suppress(Exception):
        await message.answer(
            " ",
            reply_markup=reply_main_menu(language=language),
        )
