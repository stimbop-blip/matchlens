from fastapi import APIRouter, Depends
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.db import get_db
from app.models.subscription import Subscription
from app.models.tariff import Tariff
from app.models.user import User

router = APIRouter(prefix="/admin/users", tags=["admin"])


@router.get("")
def admin_list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)) -> list[dict]:
    rows = db.scalars(select(User).order_by(desc(User.created_at)).limit(200)).all()
    result: list[dict] = []
    for item in rows:
        sub = db.execute(
            select(Subscription, Tariff)
            .join(Tariff, Tariff.id == Subscription.tariff_id)
            .where(Subscription.user_id == item.id)
            .order_by(desc(Subscription.ends_at))
            .limit(1)
        ).first()
        tariff_code = "free"
        subscription_ends_at = None
        if sub:
            subscription, tariff = sub
            tariff_code = tariff.code
            subscription_ends_at = subscription.ends_at.isoformat() if subscription.ends_at else None

        result.append(
            {
                "id": str(item.id),
                "telegram_id": item.telegram_id,
                "username": item.username,
                "first_name": item.first_name,
                "role": item.role.value,
                "tariff": tariff_code,
                "subscription_ends_at": subscription_ends_at,
                "created_at": item.created_at.isoformat() if item.created_at else None,
            }
        )

    return result
