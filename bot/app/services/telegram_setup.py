from __future__ import annotations

import logging

from aiogram import Bot
from aiogram.types import BotCommand, BotCommandScopeChat, BotCommandScopeDefault, MenuButtonWebApp, WebAppInfo

from app.config import settings

logger = logging.getLogger(__name__)


def _base_commands() -> list[BotCommand]:
    return [
        BotCommand(command="start", description="главное меню PIT BET"),
        BotCommand(command="free", description="бесплатные прогнозы"),
        BotCommand(command="tariffs", description="тарифы PIT BET"),
        BotCommand(command="support", description="поддержка"),
        BotCommand(command="about", description="как работает PIT BET"),
    ]


def _admin_commands() -> list[BotCommand]:
    return [*_base_commands(), BotCommand(command="admin", description="админка PIT BET")]


async def setup_menu_button(bot: Bot) -> None:
    await bot.set_chat_menu_button(
        menu_button=MenuButtonWebApp(
            text=settings.mini_app_menu_button_text,
            web_app=WebAppInfo(url=settings.mini_app_url),
        )
    )


async def setup_commands(bot: Bot) -> None:
    await bot.set_my_commands(_base_commands(), scope=BotCommandScopeDefault())
    admin_commands = _admin_commands()
    for admin_id in sorted(settings.admin_ids()):
        await bot.set_my_commands(admin_commands, scope=BotCommandScopeChat(chat_id=admin_id))


async def configure_telegram_surface(bot: Bot) -> None:
    try:
        await setup_menu_button(bot)
    except Exception:
        logger.warning("failed to set chat menu button", exc_info=True)

    try:
        await setup_commands(bot)
    except Exception:
        logger.warning("failed to set bot commands", exc_info=True)

    if not settings.mini_app_url.lower().startswith("https://"):
        logger.warning("MINI_APP_URL should use HTTPS for Telegram WebApp auth")

    main_link = settings.main_mini_app_link()
    if main_link:
        logger.info("main mini app direct link configured: %s", main_link)
    else:
        logger.info(
            "main mini app deep-link and attachment entry are configured in BotFather; "
            "set BOT_USERNAME and MINI_APP_SHORT_NAME to log a ready link"
        )
