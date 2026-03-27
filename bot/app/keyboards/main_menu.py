from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

from app.config import settings
from app.utils.texts import button, normalize_language, t


def main_menu_keyboard(language: str = "ru", is_admin: bool = False) -> InlineKeyboardMarkup:
    lang = normalize_language(language)
    rows: list[list[InlineKeyboardButton]] = [
        [InlineKeyboardButton(text=t(lang, "open_mini_app"), web_app=WebAppInfo(url=settings.mini_app_url))],
        [InlineKeyboardButton(text=button(lang, "news"), callback_data="menu:news")],
        [InlineKeyboardButton(text=button(lang, "free"), callback_data="menu:free")],
        [
            InlineKeyboardButton(text=button(lang, "profile"), callback_data="menu:profile"),
            InlineKeyboardButton(text=button(lang, "tariffs"), callback_data="menu:tariffs"),
        ],
        [
            InlineKeyboardButton(text=button(lang, "referrals"), callback_data="menu:referrals"),
            InlineKeyboardButton(text=button(lang, "stats"), callback_data="menu:stats"),
        ],
        [
            InlineKeyboardButton(text=button(lang, "notifications"), callback_data="menu:notifications"),
            InlineKeyboardButton(text=button(lang, "support"), callback_data="menu:support"),
        ],
        [InlineKeyboardButton(text=button(lang, "about"), callback_data="menu:about")],
    ]

    if is_admin:
        rows.append([InlineKeyboardButton(text=button(lang, "admin"), callback_data="menu:admin")])

    return InlineKeyboardMarkup(inline_keyboard=rows)


def section_nav_keyboard(
    language: str = "ru",
    *,
    back_callback: str = "menu:main",
    include_open_app: bool = False,
    primary_button: tuple[str, str] | None = None,
    primary_is_web_app: bool = True,
) -> InlineKeyboardMarkup:
    lang = normalize_language(language)
    rows: list[list[InlineKeyboardButton]] = []
    if primary_button:
        if primary_is_web_app:
            rows.append([InlineKeyboardButton(text=primary_button[0], web_app=WebAppInfo(url=primary_button[1]))])
        else:
            rows.append([InlineKeyboardButton(text=primary_button[0], url=primary_button[1])])
    if include_open_app:
        rows.append([InlineKeyboardButton(text=t(lang, "open_mini_app"), web_app=WebAppInfo(url=settings.mini_app_url))])
    rows.append(
        [
            InlineKeyboardButton(text=t(lang, "nav_back"), callback_data=back_callback),
            InlineKeyboardButton(text=t(lang, "nav_menu"), callback_data="menu:main"),
        ]
    )
    return InlineKeyboardMarkup(inline_keyboard=rows)
