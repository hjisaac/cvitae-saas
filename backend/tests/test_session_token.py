"""Tests for signed session cookies shared between Next.js and FastAPI."""

from __future__ import annotations

import base64
import json

from lib.session_token import decode_session, user_id_from_session


def test_decode_session_round_trip() -> None:
    secret = "test-auth-secret-for-unit-tests"
    payload = base64.urlsafe_b64encode(
        json.dumps(
            {
                "user": {
                    "id": "123456789",
                    "email": "user@example.com",
                    "name": "Test User",
                    "provider": "google",
                }
            }
        ).encode("utf-8")
    ).decode("ascii").rstrip("=")

    import hashlib
    import hmac

    signature = base64.urlsafe_b64encode(
        hmac.new(secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).digest()
    ).decode("ascii").rstrip("=")
    token = f"{payload}.{signature}"

    session = decode_session(token, secret)
    assert session is not None
    assert user_id_from_session(session) == "google:123456789"
