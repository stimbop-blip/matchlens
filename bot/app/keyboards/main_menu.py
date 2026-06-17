from __future__ import annotations

from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
    WebAppInfo,
)

from app.config import settings
from app.utils.texts import button, normalize_language, t


def reply_main_menu(language: str = "ru") -> ReplyKeyboardMarkup:
    """Постоянное нижнее меню — всегда висит над полем ввода.

    Не может содержать WebApp-кнопку (ограничение Telegram),
    поэтому Mini App открывается через inline-кнопку в ответе бота.
    """
    lang = normalize_language(language)
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text=button(lang, "free")),
                KeyboardButton(text=button(lang, "tariffs")),
            ],
            [
                KeyboardButton(text=button(lang, "stats")),
                KeyboardButton(text=button(lang, "profile")),
            ],
            [
                KeyboardButton(text=button(lang, "referrals")),
                KeyboardButton(text=button(lang, "more")),
            ],
        ],
        resize_keyboard=True,
        is_persistent=True,
    )


def reply_more_menu(language: str = "ru") -> ReplyKeyboardMarkup:
    """Дополнительное меню (открывается по кнопке 'Ещё')."""
    lang = normalize_language(language)
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text=button(lang, "news")),
                KeyboardButton(text=button(lang, "support")),
            ],
            [
                KeyboardButton(text=button(lang, "notifications")),
                KeyboardButton(text=button(lang, "settings")),
            ],
            [
                KeyboardButton(text=button(lang, "about")),
                KeyboardButton(text=t(lang, "nav_menu")),
            ],
        ],
        resize_keyboard=True,
        is_persistent=True,
    )


def mini_app_inline_button(language: str = "ru", path: str | None = None) -> InlineKeyboardMarkup:
    """Inline-кнопка для открытия Mini App (одна, крупная)."""
    lang = normalize_language(language)
    base = settings.mini_app_url.strip().rstrip("/")
    url = f"{base}{path}" if path else settings.mini_app_url
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=t(lang, "open_mini_app"), web_app=WebAppInfo(url=url))]
        ]
    )


def main_menu_keyboard(language: str = "ru", is_admin: bool = False) -> InlineKeyboardMarkup:
    """Совместимость: возвращает inline-кнопку Mini App для /start.

    Сейчас основная навигация — через Reply Keyboard (reply_main_menu),
    а эта функция даёт крупную inline-кнопку входа в приложение под приветствием.
    """
    lang = normalize_language(language)
    rows: list[list[InlineKeyboardButton]] = [
        [InlineKeyboardButton(text=t(lang, "open_mini_app"), web_app=WebAppInfo(url=settings.mini_app_url))],
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
    """Навигация внутри раздела: опциональная главная кнопка.

    В новой схеме 'Назад/В меню' убраны (навигация через Reply Keyboard),
    но функция сохранена для совместимости с существующими экранами.
    """
    lang = normalize_language(language)
    rows: list[list[InlineKeyboardButton]] = []
    if primary_button:
        if primary_is_web_app:
            rows.append([InlineKeyboardButton(text=primary_button[0], web_app=WebAppInfo(url=primary_button[1]))])
        else:
            rows.append([InlineKeyboardButton(text=primary_button[0], url=primary_button[1])])
    elif include_open_app:
        rows.append([InlineKeyboardButton(text=t(lang, "open_mini_app"), web_app=WebAppInfo(url=settings.mini_app_url))])
    return InlineKeyboardMarkup(inline_keyboard=rows)
