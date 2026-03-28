import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import AccessLevel, PredictionStatus


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    match_name: Mapped[str] = mapped_column(String(255), nullable=False)
    league: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sport_type: Mapped[str] = mapped_column(String(50), nullable=False)
    event_start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    signal_type: Mapped[str] = mapped_column(String(100), nullable=False)
    odds: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)
    short_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    result_screenshot: Mapped[str | None] = mapped_column(Text, nullable=True)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")
    access_level: Mapped[AccessLevel] = mapped_column(Enum(AccessLevel), default=AccessLevel.free)
    status: Mapped[PredictionStatus] = mapped_column(Enum(PredictionStatus), default=PredictionStatus.pending, index=True)
    mode: Mapped[str] = mapped_column(String(20), nullable=False, default="prematch")
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
