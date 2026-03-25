from enum import Enum


class UserRole(str, Enum):
    user = "user"
    admin = "admin"


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
    succeeded = "succeeded"
    failed = "failed"
    canceled = "canceled"
