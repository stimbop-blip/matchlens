import contextlib

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.db import Base, SessionLocal, engine
from app.models import NewsPost, Notification, Payment, PaymentMethod, Prediction, PromoCode, PromoCodeActivation, ReferralBonus, Subscription, Tariff, User, UserSettings  # noqa: F401
from app.services.seed_service import seed_payment_methods, seed_tariffs

app = FastAPI(title=settings.app_name, debug=settings.debug)

cors_origins = [item.strip() for item in settings.cors_allow_origins.split(",") if item.strip()]
if cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.api_prefix)


@app.on_event("startup")
def on_startup() -> None:
    if settings.auto_create_tables:
        Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        users_table_exists = conn.execute(text("SELECT to_regclass('public.users')")).scalar()
        if users_table_exists:
            user_columns = {row[0] for row in conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"))}
            if "referral_code" not in user_columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN referral_code VARCHAR(24)"))
            if "referred_by_user_id" not in user_columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN referred_by_user_id UUID"))
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_referral_code ON users (referral_code) WHERE referral_code IS NOT NULL"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_referred_by_user_id ON users (referred_by_user_id)"))

        table_exists = conn.execute(text("SELECT to_regclass('public.user_settings')")).scalar()
        if table_exists:
            columns = {row[0] for row in conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'user_settings'"))}
            if "notifications_enabled" not in columns:
                conn.execute(text("ALTER TABLE user_settings ADD COLUMN notifications_enabled BOOLEAN DEFAULT TRUE"))
            if "notify_new_predictions" not in columns:
                conn.execute(text("ALTER TABLE user_settings ADD COLUMN notify_new_predictions BOOLEAN DEFAULT TRUE"))
            if "notify_free" not in columns:
                conn.execute(text("ALTER TABLE user_settings ADD COLUMN notify_free BOOLEAN DEFAULT TRUE"))
            if "notify_premium" not in columns:
                conn.execute(text("ALTER TABLE user_settings ADD COLUMN notify_premium BOOLEAN DEFAULT TRUE"))
            if "notify_vip" not in columns:
                conn.execute(text("ALTER TABLE user_settings ADD COLUMN notify_vip BOOLEAN DEFAULT TRUE"))
            if "notify_results" not in columns:
                conn.execute(text("ALTER TABLE user_settings ADD COLUMN notify_results BOOLEAN DEFAULT TRUE"))
            if "notify_news" not in columns:
                conn.execute(text("ALTER TABLE user_settings ADD COLUMN notify_news BOOLEAN DEFAULT TRUE"))
            if "notify_subscription" not in columns:
                conn.execute(text("ALTER TABLE user_settings ADD COLUMN notify_subscription BOOLEAN DEFAULT TRUE"))
            if "preferred_language" not in columns:
                conn.execute(text("ALTER TABLE user_settings ADD COLUMN preferred_language VARCHAR(8) DEFAULT 'ru'"))
            if "preferred_theme" not in columns:
                conn.execute(text("ALTER TABLE user_settings ADD COLUMN preferred_theme VARCHAR(16) DEFAULT 'dark'"))

        notifications_table_exists = conn.execute(text("SELECT to_regclass('public.notifications')")).scalar()
        if notifications_table_exists:
            notification_columns = {
                row[0]
                for row in conn.execute(
                    text("SELECT column_name FROM information_schema.columns WHERE table_name = 'notifications'")
                )
            }
            if "cta_text" not in notification_columns:
                conn.execute(text("ALTER TABLE notifications ADD COLUMN cta_text VARCHAR(80)"))
            if "cta_url" not in notification_columns:
                conn.execute(text("ALTER TABLE notifications ADD COLUMN cta_url VARCHAR(1024)"))

        payment_table_exists = conn.execute(text("SELECT to_regclass('public.payments')")).scalar()
        if payment_table_exists:
            payment_columns = {
                row[0]
                for row in conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'payments'"))
            }
            if "method_code" not in payment_columns:
                conn.execute(text("ALTER TABLE payments ADD COLUMN method_code VARCHAR(40)"))
            if "method_name_snapshot" not in payment_columns:
                conn.execute(text("ALTER TABLE payments ADD COLUMN method_name_snapshot VARCHAR(120)"))
            if "duration_days_snapshot" not in payment_columns:
                conn.execute(text("ALTER TABLE payments ADD COLUMN duration_days_snapshot INTEGER DEFAULT 30"))
            if "access_level_snapshot" not in payment_columns:
                conn.execute(text("ALTER TABLE payments ADD COLUMN access_level_snapshot VARCHAR(16) DEFAULT 'premium'"))
            if "manual_note" not in payment_columns:
                conn.execute(text("ALTER TABLE payments ADD COLUMN manual_note TEXT"))
            if "manual_proof" not in payment_columns:
                conn.execute(text("ALTER TABLE payments ADD COLUMN manual_proof TEXT"))
            if "review_comment" not in payment_columns:
                conn.execute(text("ALTER TABLE payments ADD COLUMN review_comment TEXT"))
            if "reviewed_by_user_id" not in payment_columns:
                conn.execute(text("ALTER TABLE payments ADD COLUMN reviewed_by_user_id UUID"))
            if "reviewed_at" not in payment_columns:
                conn.execute(text("ALTER TABLE payments ADD COLUMN reviewed_at TIMESTAMPTZ"))
            with contextlib.suppress(Exception):
                conn.execute(text("ALTER TYPE paymentstatus ADD VALUE IF NOT EXISTS 'pending_manual_review'"))
            with contextlib.suppress(Exception):
                conn.execute(text("ALTER TYPE paymentstatus ADD VALUE IF NOT EXISTS 'requires_clarification'"))

    if settings.auto_create_tables:
        db = SessionLocal()
        try:
            seed_tariffs(db)
            seed_payment_methods(db)
        finally:
            db.close()
