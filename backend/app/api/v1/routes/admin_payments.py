from fastapi import APIRouter, Depends
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.db import get_db
from app.models.payment import Payment
from app.models.tariff import Tariff
from app.models.user import User

router = APIRouter(prefix="/admin/payments", tags=["admin"])


@router.get("")
def admin_list_payments(db: Session = Depends(get_db), _: User = Depends(require_admin)) -> list[dict]:
    rows = db.execute(
        select(Payment, Tariff, User)
        .join(Tariff, Tariff.id == Payment.tariff_id)
        .join(User, User.id == Payment.user_id)
        .order_by(desc(Payment.created_at))
        .limit(200)
    ).all()
    return [
        {
            "id": str(payment.id),
            "user_id": str(payment.user_id),
            "telegram_id": user.telegram_id,
            "username": user.username,
            "tariff_code": tariff.code,
            "amount_rub": payment.amount_rub,
            "status": payment.status.value,
            "provider_order_id": payment.provider_order_id,
            "created_at": payment.created_at.isoformat() if payment.created_at else None,
        }
        for payment, tariff, user in rows
    ]
