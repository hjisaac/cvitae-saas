"""Decode signed auth sessions issued by the Next.js OAuth routes."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
from typing import Any


def _sign_payload(payload: str, secret: str) -> str:
    digest = hmac.new(secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")


def decode_session(token: str, secret: str) -> dict[str, Any] | None:
    parts = token.split(".", 1)
    if len(parts) != 2:
        return None

    payload, signature = parts
    expected = _sign_payload(payload, secret)
    if signature != expected:
        return None

    try:
        padded = payload + "=" * (-len(payload) % 4)
        decoded = base64.urlsafe_b64decode(padded.encode("ascii"))
        return json.loads(decoded.decode("utf-8"))
    except (ValueError, json.JSONDecodeError, UnicodeDecodeError):
        return None


def user_id_from_session(session: dict[str, Any]) -> str | None:
    user = session.get("user")
    if not isinstance(user, dict):
        return None

    provider = user.get("provider")
    oauth_id = user.get("id")
    if provider not in {"google", "github"} or not oauth_id:
        return None

    return f"{provider}:{oauth_id}"
