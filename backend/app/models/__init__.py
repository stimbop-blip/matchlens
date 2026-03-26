from app.models.news_post import NewsPost
from app.models.notification import Notification
from app.models.payment import Payment
from app.models.prediction import Prediction
from app.models.promo_code import PromoCode
from app.models.promo_code_activation import PromoCodeActivation
from app.models.referral_bonus import ReferralBonus
from app.models.subscription import Subscription
from app.models.tariff import Tariff
from app.models.user import User
from app.models.user_settings import UserSettings

__all__ = [
    "Payment",
    "Notification",
    "NewsPost",
    "Prediction",
    "PromoCode",
    "PromoCodeActivation",
    "ReferralBonus",
    "Subscription",
    "Tariff",
    "User",
    "UserSettings",
]
