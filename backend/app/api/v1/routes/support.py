from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin, require_admin_or_support
from app.core.db import get_db
from app.models.user import User
from app.schemas.support import (
    SupportActionLogOut,
    SupportDialogDetailOut,
    SupportDialogPreviewOut,
    SupportDialogStatusUpdateIn,
    SupportMessageSendIn,
)
from app.services.support_service import (
    get_staff_dialog_detail,
    get_user_dialog_detail,
    list_staff_dialogs,
    list_support_action_logs,
    send_staff_dialog_message,
    send_user_dialog_message,
    update_dialog_status,
)

router = APIRouter(prefix="/support", tags=["support"])


def _as_http_error(exc: ValueError) -> HTTPException:
    detail = str(exc)
    status_code = 404 if "не найден" in detail.lower() else 400
    return HTTPException(status_code=status_code, detail=detail)


@router.get("/my-dialog", response_model=SupportDialogDetailOut)
def support_my_dialog(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SupportDialogDetailOut:
    payload = get_user_dialog_detail(db, current_user)
    return SupportDialogDetailOut(**payload)


@router.post("/my-dialog/messages", response_model=SupportDialogDetailOut)
def support_send_my_message(
    payload: SupportMessageSendIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SupportDialogDetailOut:
    try:
        result = send_user_dialog_message(
            db,
            user=current_user,
            body=payload.body,
            subject=payload.subject,
        )
    except ValueError as exc:
        raise _as_http_error(exc) from exc
    return SupportDialogDetailOut(**result)


@router.get("/dialogs", response_model=list[SupportDialogPreviewOut])
def support_dialogs(
    q: str | None = Query(default=None),
    status: str | None = Query(default=None),
    unread_only: bool = Query(default=False),
    limit: int = Query(default=100, ge=1, le=300),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_support),
) -> list[SupportDialogPreviewOut]:
    rows = list_staff_dialogs(db, q=q, status=status, unread_only=unread_only, limit=limit)
    return [SupportDialogPreviewOut(**item) for item in rows]


@router.get("/dialogs/{dialog_id}", response_model=SupportDialogDetailOut)
def support_dialog_detail(
    dialog_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_support),
) -> SupportDialogDetailOut:
    try:
        payload = get_staff_dialog_detail(db, dialog_id=dialog_id, actor=current_user, mark_open=True)
    except ValueError as exc:
        raise _as_http_error(exc) from exc
    return SupportDialogDetailOut(**payload)


@router.post("/dialogs/{dialog_id}/messages", response_model=SupportDialogDetailOut)
def support_dialog_reply(
    dialog_id: str,
    payload: SupportMessageSendIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_support),
) -> SupportDialogDetailOut:
    try:
        result = send_staff_dialog_message(db, dialog_id=dialog_id, actor=current_user, body=payload.body)
    except ValueError as exc:
        raise _as_http_error(exc) from exc
    return SupportDialogDetailOut(**result)


@router.patch("/dialogs/{dialog_id}/status", response_model=SupportDialogDetailOut)
def support_dialog_set_status(
    dialog_id: str,
    payload: SupportDialogStatusUpdateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_support),
) -> SupportDialogDetailOut:
    try:
        result = update_dialog_status(db, dialog_id=dialog_id, status=payload.status, actor=current_user)
    except ValueError as exc:
        raise _as_http_error(exc) from exc
    return SupportDialogDetailOut(**result)


@router.get("/logs", response_model=list[SupportActionLogOut])
def support_logs(
    dialog_id: str | None = Query(default=None),
    target_user_id: str | None = Query(default=None),
    action_type: str | None = Query(default=None),
    limit: int = Query(default=200, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[SupportActionLogOut]:
    rows = list_support_action_logs(
        db,
        dialog_id=dialog_id,
        target_user_id=target_user_id,
        action_type=action_type,
        limit=limit,
    )
    return [SupportActionLogOut(**item) for item in rows]
