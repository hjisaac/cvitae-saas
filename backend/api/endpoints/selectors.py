from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from api.deps import get_selector_repository, require_user_id
from api.schemas import SelectorResponse
from db.repository import SelectorRepository

router = APIRouter()


@router.get("/selectors", response_model=list[SelectorResponse])
def list_selectors(
    user_id: str = Depends(require_user_id),
    repository: SelectorRepository = Depends(get_selector_repository),
):
    return [SelectorResponse.from_model(selector) for selector in repository.list_for_user(user_id)]


@router.get("/selectors/{selector_id}", response_model=SelectorResponse)
def get_selector(
    selector_id: str,
    user_id: str = Depends(require_user_id),
    repository: SelectorRepository = Depends(get_selector_repository),
):
    selector = repository.get_for_user(user_id, selector_id)
    if selector is None:
        raise HTTPException(status_code=404, detail="Selector not found")
    return SelectorResponse.from_model(selector)
