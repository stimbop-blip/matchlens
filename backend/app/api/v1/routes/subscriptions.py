from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models.user import User
from app.schemas.bot import BotSubscriptionOut
from app.services.subscription_service import get_current_subscription_by_telegram_id

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.get("/me", response_model=BotSubscriptionOut)
def my_subscription(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> BotSubscriptionOut:
    payload = get_current_subscription_by_telegram_id(db, current_user.telegram_id)
    return BotSubscriptionOut(**payload)
