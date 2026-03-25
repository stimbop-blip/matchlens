from aiogram.types import KeyboardButton, ReplyKeyboardMarkup, WebAppInfo

PRODUCTION_MINI_APP_URL = "https://matchlens.vercel.app"


def resolve_mini_app_url(_: str) -> str:
    return PRODUCTION_MINI_APP_URL


def main_menu_keyboard(mini_app_url: str) -> ReplyKeyboardMarkup:
    web_app_url = resolve_mini_app_url(mini_app_url)
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="Открыть приложение", web_app=WebAppInfo(url=web_app_url))],
            [KeyboardButton(text="Бесплатные прогнозы"), KeyboardButton(text="Тарифы")],
            [KeyboardButton(text="Мой профиль"), KeyboardButton(text="Статистика")],
            [KeyboardButton(text="Поддержка")],
        ],
        resize_keyboard=True,
        is_persistent=True,
    )
