from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    bot_token: str
    backend_api_base_url: str = "http://backend:8000"
    mini_app_url: str = "https://matchlens-euud7637u-ivans-projects-fc54751b.vercel.app"
    bot_support_url: str = "https://t.me/your_support"
    bot_log_level: str = "INFO"
    notifications_poll_interval: int = 10


settings = Settings()
