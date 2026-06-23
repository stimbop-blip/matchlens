import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import PaymentStatus


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    tariff_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tariffs.id"), index=True)
    provider: Mapped[str] = mapped_column(String(20), nullable=False, default="yoomoney")
    method_code: Mapped[str | None] = mapped_column(String(40), nullable=True, index=True)
    method_name_snapshot: Mapped[str | None] = mapped_column(String(120), nullable=True)
    provider_order_id: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    provider_payment_id: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    duration_days_snapshot: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    access_level_snapshot: Mapped[str] = mapped_column(String(16), nullable=False, default="premium")
    amount_rub: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.pending, index=True)
    payment_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    manual_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    manual_proof: Mapped[str | None] = mapped_column(Text, nullable=True)
    review_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
