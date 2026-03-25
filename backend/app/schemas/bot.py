from pydantic import BaseModel


class BotUserSyncIn(BaseModel):
    telegram_id: int
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    language_code: str | None = "ru"


class BotSubscriptionOut(BaseModel):
    tariff: str
    status: str
    ends_at: str | None = None


class PublicStatsOut(BaseModel):
    total: int
    winrate: float
    roi: float
