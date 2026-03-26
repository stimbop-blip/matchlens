from aiogram.types import KeyboardButton, ReplyKeyboardMarkup

from app.utils.texts import button, normalize_language

def main_menu_keyboard(language: str = "ru", is_admin: bool = False) -> ReplyKeyboardMarkup:
    lang = normalize_language(language)
    keyboard = [
        [KeyboardButton(text=button(lang, "free")), KeyboardButton(text=button(lang, "stats"))],
        [KeyboardButton(text=button(lang, "profile")), KeyboardButton(text=button(lang, "tariffs"))],
        [KeyboardButton(text=button(lang, "notifications")), KeyboardButton(text=button(lang, "support"))],
    ]
    if is_admin:
        keyboard.append([KeyboardButton(text=button(lang, "admin"))])

    return ReplyKeyboardMarkup(
        keyboard=keyboard,
        resize_keyboard=True,
        is_persistent=True,
    )
