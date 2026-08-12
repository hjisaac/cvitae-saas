from __future__ import annotations

from fastapi import APIRouter, HTTPException

from api.schemas import SyncTexRequest
from services.synctex import resolve_synctex

router = APIRouter()


@router.post("/synctex-resolve")
def resolve_synctex_route(payload: SyncTexRequest):
    try:
        return resolve_synctex(payload.page, payload.x, payload.y)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
