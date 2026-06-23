from app.models.enums import AccessLevel


def has_access(user_level: str, prediction_level: str) -> bool:
    order = {
        AccessLevel.free.value: 1,
        AccessLevel.premium.value: 2,
        AccessLevel.vip.value: 3,
    }
    return order.get(user_level, 1) >= order.get(prediction_level, 1)
