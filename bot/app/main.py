import asyncio
import contextlib
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.types import MenuButtonWebApp, WebAppInfo

from app.config import settings
from app.handlers.menu import router as menu_router
from app.handlers.start import router as start_router
from app.services.backend_client import BackendClient
from app.services.container import set_backend_client
from app.services.notification_worker import run_notification_worker


async def main() -> None:
    logging.basicConfig(level=getattr(logging, settings.bot_log_level.upper(), logging.INFO))

    bot = Bot(token=settings.bot_token, default=DefaultBotProperties(parse_mode="HTML"))
    backend_client = BackendClient(settings.backend_api_base_url)
    set_backend_client(backend_client)

    dp = Dispatcher()
    dp.include_router(start_router)
    dp.include_router(menu_router)

    try:
        await bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(text="PIT BET", web_app=WebAppInfo(url=settings.mini_app_url))
        )
    except Exception:
        logging.getLogger(__name__).warning("failed to set chat menu button", exc_info=True)

    worker_task = asyncio.create_task(run_notification_worker(bot, backend_client))

    try:
        await dp.start_polling(bot)
    finally:
        worker_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await worker_task
        await backend_client.close()
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
