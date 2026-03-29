from datetime import datetime

from pydantic import BaseModel, Field


class PredictionOut(BaseModel):
    id: str
    title: str
    match_name: str
    league: str | None
    sport_type: str
    event_start_at: datetime
    signal_type: str
    odds: float
    short_description: str | None
    bet_screenshot: str | None
    result_screenshot: str | None
    risk_level: str
    access_level: str
    status: str
    mode: str
    published_at: datetime | None


class PredictionCreateIn(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    match_name: str = Field(min_length=3, max_length=255)
    league: str | None = None
    sport_type: str = Field(min_length=2, max_length=50)
    event_start_at: datetime
    signal_type: str = Field(min_length=2, max_length=100)
    odds: float = Field(gt=1.0, le=100.0)
    short_description: str | None = None
    bet_screenshot: str | None = None
    result_screenshot: str | None = None
    risk_level: str = Field(default="medium")
    access_level: str = Field(default="free")
    mode: str = Field(default="prematch")
    status: str = Field(default="pending")
    publish_now: bool = False


class PredictionUpdateIn(BaseModel):
    title: str | None = None
    match_name: str | None = None
    league: str | None = None
    sport_type: str | None = None
    event_start_at: datetime | None = None
    signal_type: str | None = None
    odds: float | None = Field(default=None, gt=1.0, le=100.0)
    short_description: str | None = None
    bet_screenshot: str | None = None
    result_screenshot: str | None = None
    risk_level: str | None = None
    access_level: str | None = None
    mode: str | None = None
    status: str | None = None
    publish_now: bool | None = None
