from __future__ import annotations

import hashlib
import hmac
import json
from datetime import UTC, datetime, timedelta
from urllib.parse import parse_qsl


def validate_telegram_init_data(init_data: str, bot_token: str, max_age_seconds: int = 3600) -> dict | None:
    user_data, _ = validate_telegram_init_data_with_reason(init_data, bot_token, max_age_seconds)
    return user_data


def validate_telegram_init_data_with_reason(
    init_data: str,
    bot_token: str,
    max_age_seconds: int = 3600,
) -> tuple[dict | None, str]:
    if not bot_token or ":" not in bot_token:
        return None, "invalid_bot_token"

    try:
        parsed = dict(parse_qsl(init_data, strict_parsing=True))
    except ValueError:
        return None, "invalid_init_data_format"

    received_hash = parsed.pop("hash", None)
    if not received_hash:
        return None, "hash_missing"

    check_pairs = [f"{k}={v}" for k, v in sorted(parsed.items(), key=lambda item: item[0])]
    check_string = "\n".join(check_pairs)

    secret = hmac.new(b"WebAppData", bot_token.encode("utf-8"), hashlib.sha256).digest()
    computed_hash = hmac.new(secret, check_string.encode("utf-8"), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(computed_hash, received_hash):
        return None, "hash_mismatch"

    auth_date_raw = parsed.get("auth_date")
    if not auth_date_raw or not auth_date_raw.isdigit():
        return None, "auth_date_invalid"

    auth_date = datetime.fromtimestamp(int(auth_date_raw), tz=UTC)
    if datetime.now(UTC) - auth_date > timedelta(seconds=max_age_seconds):
        return None, "auth_date_expired"

    user_json = parsed.get("user")
    if not user_json:
        return None, "user_missing"

    try:
        return json.loads(user_json), "ok"
    except json.JSONDecodeError:
        return None, "user_json_invalid"
