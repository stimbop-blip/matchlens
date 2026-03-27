from pydantic import BaseModel


class BotUserSyncIn(BaseModel):
    telegram_id: int
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    language_code: str | None = "ru"
    referral_code: str | None = None


class BotSubscriptionOut(BaseModel):
    tariff: str
    status: str
    ends_at: str | None = None


class PublicStatsOut(BaseModel):
    total: int
    wins: int = 0
    loses: int = 0
    refunds: int = 0
    pending: int = 0
    hit_rate: float = 0
    winrate: float
    roi: float


class BotPredictionShortOut(BaseModel):
    match_name: str
    league: str | None = None
    signal_type: str
    odds: float
    event_start_at: str
    short_description: str | None = None


class BotTariffOut(BaseModel):
    code: str
    name: str
    price_rub: int
    duration_days: int
    description: str | None = None


class BotUserPreferencesOut(BaseModel):
    language: str = "ru"
    theme: str = "dark"


class BotReferralOut(BaseModel):
    referral_code: str
    referral_link: str
    invited: int = 0
    activated: int = 0
    bonus_days: int = 0


class BotNewsOut(BaseModel):
    id: str
    title: str
    body: str
    category: str
    published_at: str | None = None
