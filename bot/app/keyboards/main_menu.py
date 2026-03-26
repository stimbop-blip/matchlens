from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from app.config import settings
from app.utils.texts import button, normalize_language, t


def main_menu_keyboard(language: str = "ru", is_admin: bool = False) -> InlineKeyboardMarkup:
    lang = normalize_language(language)
    rows: list[list[InlineKeyboardButton]] = [
        [
            InlineKeyboardButton(text=button(lang, "free"), callback_data="menu:free"),
            InlineKeyboardButton(text=button(lang, "stats"), callback_data="menu:stats"),
        ],
        [
            InlineKeyboardButton(text=button(lang, "profile"), callback_data="menu:profile"),
            InlineKeyboardButton(text=button(lang, "tariffs"), callback_data="menu:tariffs"),
        ],
        [
            InlineKeyboardButton(text=button(lang, "notifications"), callback_data="menu:notifications"),
            InlineKeyboardButton(text=button(lang, "support"), callback_data="menu:support"),
        ],
        [InlineKeyboardButton(text=t(lang, "open_mini_app"), url=settings.mini_app_url)],
    ]

    if is_admin:
        rows.append([InlineKeyboardButton(text=button(lang, "admin"), callback_data="menu:admin")])

    return InlineKeyboardMarkup(inline_keyboard=rows)


def section_nav_keyboard(
    language: str = "ru",
    *,
    back_callback: str = "menu:main",
    include_open_app: bool = True,
) -> InlineKeyboardMarkup:
    lang = normalize_language(language)
    rows: list[list[InlineKeyboardButton]] = []
    if include_open_app:
        rows.append([InlineKeyboardButton(text=t(lang, "open_mini_app"), url=settings.mini_app_url)])
    rows.append(
        [
            InlineKeyboardButton(text=t(lang, "nav_back"), callback_data=back_callback),
            InlineKeyboardButton(text=t(lang, "nav_menu"), callback_data="menu:main"),
        ]
    )
    return InlineKeyboardMarkup(inline_keyboard=rows)
