from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import Message, ReplyKeyboardRemove

from app.config import settings
from app.keyboards.main_menu import main_menu_keyboard
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


@router.message(CommandStart())
async def cmd_start(message: Message) -> None:
    user = message.from_user
    backend_client = get_backend_client()
    referral_code = _extract_referral_code(message.text)
    language = normalize_language(user.language_code if user else None)
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

    sent = await message.answer(
        t(language, "start_message"),
        reply_markup=ReplyKeyboardRemove(),
        disable_web_page_preview=True,
    )
    try:
        await sent.edit_reply_markup(
            reply_markup=main_menu_keyboard(language=language, is_admin=bool(user and user.id in settings.admin_ids()))
        )
    except Exception:
        await message.answer(
            t(language, "menu_intro"),
            reply_markup=main_menu_keyboard(language=language, is_admin=bool(user and user.id in settings.admin_ids())),
            disable_web_page_preview=True,
        )
