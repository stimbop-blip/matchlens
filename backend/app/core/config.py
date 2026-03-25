from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "MatchLens API"
    api_prefix: str = "/api/v1"
    debug: bool = True
    database_url: str = "postgresql+psycopg://matchlens:matchlens@postgres:5432/matchlens"
    bot_token: str = ""
    auto_create_tables: bool = True
    yoomoney_wallet: str = ""
    yoomoney_notification_secret: str = ""
    yoomoney_return_url: str = ""
    admin_telegram_ids: str = ""
    payments_enabled: bool = False
    cors_allow_origins: str = ""


settings = Settings()
