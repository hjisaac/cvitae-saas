from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from api.deps import get_selector_repository, get_variant_repository, require_user_id
from api.schemas import (
    CreateVariantRequest,
    SelectorResponse,
    VariantDetailResponse,
    VariantSummaryResponse,
)
from config import CONTENTS_DIR
from db.bootstrap import seed_from_fixtures
from db.repository import SelectorRepository, VariantRepository

router = APIRouter()


@router.get("/variants", response_model=list[VariantSummaryResponse])
def list_variants(
    user_id: str = Depends(require_user_id),
    repository: VariantRepository = Depends(get_variant_repository),
):
    variants = repository.list_for_user(user_id)
    if not variants:
        seed_from_fixtures(CONTENTS_DIR, user_id)
        variants = repository.list_for_user(user_id)
    return [VariantSummaryResponse.from_model(variant) for variant in variants]


@router.post("/variants", response_model=VariantDetailResponse, status_code=201)
def create_variant(
    payload: CreateVariantRequest,
    user_id: str = Depends(require_user_id),
    repository: VariantRepository = Depends(get_variant_repository),
):
    if payload.source_variant_id is None and payload.name is None:
        raise HTTPException(status_code=400, detail="name is required when source_variant_id is not provided")

    try:
        variant = repository.create_for_user(
            user_id,
            name=payload.name,
            content=payload.content,
            selector_content=payload.selector_content,
            language=payload.language,
            template_id=payload.template_id,
            source_variant_id=payload.source_variant_id,
        )
    except LookupError:
        raise HTTPException(status_code=404, detail="Source variant not found") from None

    return VariantDetailResponse.from_model(variant)


@router.get("/variants/{variant_id}", response_model=VariantDetailResponse)
def get_variant(
    variant_id: str,
    user_id: str = Depends(require_user_id),
    repository: VariantRepository = Depends(get_variant_repository),
):
    variant = repository.get_for_user(user_id, variant_id)
    if variant is None:
        raise HTTPException(status_code=404, detail="Variant not found")
    return VariantDetailResponse.from_model(variant)


@router.get("/variants/{variant_id}/selector", response_model=SelectorResponse)
def get_variant_selector(
    variant_id: str,
    user_id: str = Depends(require_user_id),
    repository: SelectorRepository = Depends(get_selector_repository),
):
    selector = repository.get_for_variant(user_id, variant_id)
    if selector is None:
        raise HTTPException(status_code=404, detail="Selector not found")
    return SelectorResponse.from_model(selector)
