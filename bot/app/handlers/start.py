from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import Message

from app.config import settings
from app.keyboards.main_menu import main_menu_keyboard
from app.services.container import get_backend_client
from app.utils.texts import ONBOARDING_TEXT, WELCOME_TEXT

router = Router()


@router.message(CommandStart())
async def cmd_start(message: Message) -> None:
    user = message.from_user
    backend_client = get_backend_client()
    if backend_client and user:
        await backend_client.sync_user(
            {
                "telegram_id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "language_code": user.language_code,
            }
        )

    await message.answer(
        WELCOME_TEXT,
        reply_markup=main_menu_keyboard(is_admin=bool(user and user.id in settings.admin_ids())),
    )
    await message.answer(ONBOARDING_TEXT)
