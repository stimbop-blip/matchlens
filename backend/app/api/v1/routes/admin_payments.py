import logging
from html import escape
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import String, cast, desc, select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.db import get_db
from app.models.enums import PaymentStatus
from app.models.payment import Payment
from app.models.subscription import Subscription
from app.models.tariff import Tariff
from app.models.user import User
from app.schemas.payment import AdminPaymentStatusUpdateIn
from app.services.payment_service import activate_subscription_for_payment
from app.services.notification_service import queue_direct_notification

router = APIRouter(prefix="/admin/payments", tags=["admin"])
logger = logging.getLogger(__name__)


@router.get("")
def admin_list_payments(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
    status: str | None = Query(default=None),
    user_query: str | None = Query(default=None),
) -> list[dict]:
    valid_statuses = {
        "pending",
        "pending_manual_review",
        "requires_clarification",
        "succeeded",
        "failed",
        "canceled",
    }
    stmt = (
        select(Payment, Tariff, User)
        .join(Tariff, Tariff.id == Payment.tariff_id)
        .join(User, User.id == Payment.user_id)
    )
    if status in valid_statuses:
        stmt = stmt.where(Payment.status == PaymentStatus(status))
    if user_query:
        q = f"%{user_query.lower()}%"
        stmt = stmt.where(
            cast(User.telegram_id, String).like(f"%{user_query}%")
            | User.username.ilike(q)
            | User.first_name.ilike(q)
        )

    rows = db.execute(stmt.order_by(desc(Payment.created_at)).limit(300)).all()
    return [
        {
            "id": str(payment.id),
            "user_id": str(payment.user_id),
            "telegram_id": user.telegram_id,
            "username": user.username,
            "tariff_code": tariff.code,
            "access_level": payment.access_level_snapshot,
            "duration_days": payment.duration_days_snapshot,
            "amount_rub": payment.amount_rub,
            "status": payment.status.value,
            "method_code": payment.method_code,
            "method_name": payment.method_name_snapshot,
            "provider_order_id": payment.provider_order_id,
            "manual_note": payment.manual_note,
            "manual_proof": payment.manual_proof,
            "review_comment": payment.review_comment,
            "created_at": payment.created_at.isoformat() if payment.created_at else None,
        }
        for payment, tariff, user in rows
    ]


@router.patch("/{payment_id}/status")
def admin_update_payment_status(
    payment_id: str,
    payload: AdminPaymentStatusUpdateIn,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> dict:
    payment = db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    target = PaymentStatus(payload.status)
    payment.status = target
    payment.review_comment = payload.review_comment.strip() if payload.review_comment else payment.review_comment
    payment.reviewed_by_user_id = admin_user.id
    payment.reviewed_at = datetime.now(UTC)
    if target == PaymentStatus.succeeded:
        activate_subscription_for_payment(db, payment)
        return {"ok": True, "id": str(payment.id), "status": PaymentStatus.succeeded.value}

    if target == PaymentStatus.requires_clarification:
        admin_text = (payload.review_comment or "").strip() or "Нужны дополнительные данные по оплате."
        clarification_message = (
            "Нам нужно уточнить данные по вашему платежу.\n"
            "Сообщение от поддержки:\n\n"
            f"<i>{escape(admin_text)}</i>\n\n"
            "Пожалуйста, откройте PIT BET или ответьте в поддержку, если нужна помощь."
        )
        result = queue_direct_notification(
            db,
            title="💬 Уточнение по оплате PIT BET",
            message=clarification_message,
            user_id=str(payment.user_id),
        )
        if int(result.get("queued", 0)) <= 0:
            logger.warning(
                "payment_clarification_not_queued payment_id=%s user_id=%s reason=%s",
                payment.id,
                payment.user_id,
                result.get("reason"),
            )
        else:
            logger.info("payment_clarification_queued payment_id=%s user_id=%s", payment.id, payment.user_id)

    payment.paid_at = None
    db.add(payment)
    db.commit()
    db.refresh(payment)

    active_subscription = db.scalar(
        select(Subscription)
        .where(Subscription.user_id == payment.user_id)
        .order_by(desc(Subscription.ends_at))
        .limit(1)
    )
    return {
        "ok": True,
        "id": str(payment.id),
        "status": payment.status.value,
        "updated_at": datetime.now(UTC).isoformat(),
        "subscription_id": str(active_subscription.id) if active_subscription else None,
    }
