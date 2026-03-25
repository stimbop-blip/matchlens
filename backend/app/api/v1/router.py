from fastapi import APIRouter

from app.api.v1.routes.admin_payments import router as admin_payments_router
from app.api.v1.routes.admin_notifications import router as admin_notifications_router
from app.api.v1.routes.admin_predictions import router as admin_predictions_router
from app.api.v1.routes.admin_stats import router as admin_stats_router
from app.api.v1.routes.admin_subscriptions import router as admin_subscriptions_router
from app.api.v1.routes.admin_users import router as admin_users_router
from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.bot import router as bot_router
from app.api.v1.routes.health import router as health_router
from app.api.v1.routes.payments import router as payments_router
from app.api.v1.routes.predictions import router as predictions_router
from app.api.v1.routes.stats import router as stats_router
from app.api.v1.routes.subscriptions import router as subscriptions_router
from app.api.v1.routes.tariffs import router as tariffs_router
from app.api.v1.routes.users import router as users_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(bot_router)
api_router.include_router(users_router)
api_router.include_router(tariffs_router)
api_router.include_router(predictions_router)
api_router.include_router(stats_router)
api_router.include_router(subscriptions_router)
api_router.include_router(payments_router)
api_router.include_router(admin_predictions_router)
api_router.include_router(admin_users_router)
api_router.include_router(admin_payments_router)
api_router.include_router(admin_subscriptions_router)
api_router.include_router(admin_stats_router)
api_router.include_router(admin_notifications_router)
