from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.db import Base, SessionLocal, engine
from app.models import Notification, Payment, Prediction, Subscription, Tariff, User, UserSettings  # noqa: F401
from app.services.seed_service import seed_tariffs

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
            columns = {
                row[0]
                for row in conn.execute(
                    text(
                        """
                        SELECT column_name
                        FROM information_schema.columns
                        WHERE table_name = 'user_settings'
                        """
                    )
                )
            }
            if "notifications_enabled" not in columns:
                conn.execute(text("ALTER TABLE user_settings ADD COLUMN notifications_enabled BOOLEAN DEFAULT TRUE"))
            if "notify_free" not in columns:
                conn.execute(text("ALTER TABLE user_settings ADD COLUMN notify_free BOOLEAN DEFAULT TRUE"))
            if "notify_premium" not in columns:
                conn.execute(text("ALTER TABLE user_settings ADD COLUMN notify_premium BOOLEAN DEFAULT TRUE"))
            if "notify_results" not in columns:
                conn.execute(text("ALTER TABLE user_settings ADD COLUMN notify_results BOOLEAN DEFAULT TRUE"))
        db = SessionLocal()
        try:
            seed_tariffs(db)
        finally:
            db.close()
