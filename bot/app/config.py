from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    bot_token: str
    brand_name: str = "PIT BET"
    backend_api_base_url: str = "http://backend:8000"
    mini_app_url: str = "https://matchlens.vercel.app"
    mini_app_menu_button_text: str = "Открыть"
    mini_app_short_name: str = ""
    bot_username: str = ""
    bot_support_url: str = "https://t.me/your_support"
    bot_log_level: str = "INFO"
    notifications_poll_interval: int = 10
    admin_telegram_ids: str = ""

    def admin_ids(self) -> set[int]:
        ids: set[int] = set()
        for item in self.admin_telegram_ids.split(","):
            value = item.strip()
            if value.isdigit():
                ids.add(int(value))
        return ids

    def normalized_bot_username(self) -> str:
        return self.bot_username.strip().lstrip("@")

    def main_mini_app_link(self) -> str | None:
        username = self.normalized_bot_username()
        short_name = self.mini_app_short_name.strip().strip("/")
        if not username or not short_name:
            return None
        if "your_" in username or "your_" in short_name:
            return None
        return f"https://t.me/{username}/{short_name}"


settings = Settings()
