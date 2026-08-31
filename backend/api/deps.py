from __future__ import annotations

from fastapi import HTTPException, Request, status

from config import AUTH_SECRET
from db.repository import SelectorRepository, VariantRepository
from lib.session_token import decode_session, user_id_from_session


def require_user_id(request: Request) -> str:
    """Return the authenticated user's id from the signed session cookie."""
    secret = AUTH_SECRET
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication not configured",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = request.cookies.get("cvitae_auth")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    session = decode_session(token, secret)
    user_id = user_id_from_session(session or {})
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_id


def get_variant_repository() -> VariantRepository:
    return VariantRepository()


def get_selector_repository() -> SelectorRepository:
    return SelectorRepository()
