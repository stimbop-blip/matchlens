from enum import Enum


class UserRole(str, Enum):
    user = "user"
    admin = "admin"
    support = "support"


class AccessLevel(str, Enum):
    free = "free"
    premium = "premium"
    vip = "vip"


class SubscriptionStatus(str, Enum):
    active = "active"
    expired = "expired"
    canceled = "canceled"


class PredictionStatus(str, Enum):
    pending = "pending"
    won = "won"
    lost = "lost"
    refund = "refund"


class PaymentStatus(str, Enum):
    pending = "pending"
    pending_manual_review = "pending_manual_review"
    requires_clarification = "requires_clarification"
    succeeded = "succeeded"
    failed = "failed"
    canceled = "canceled"
