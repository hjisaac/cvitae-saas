from __future__ import annotations

from typing import Optional

from pydantic import BaseModel

from db.models import Selector, Variant


class SelectorResponse(BaseModel):
    id: str
    variant_id: str
    content: str
    created_at: str
    updated_at: str

    @classmethod
    def from_model(cls, selector: Selector) -> "SelectorResponse":
        return cls(
            id=selector.id,
            variant_id=selector.variant.id,
            content=selector.content,
            created_at=selector.created_at.isoformat(),
            updated_at=selector.updated_at.isoformat(),
        )


class VariantSummaryResponse(BaseModel):
    id: str
    name: str
    template_id: Optional[str] = None
    language: str
    updated_at: str

    @classmethod
    def from_model(cls, variant: Variant) -> "VariantSummaryResponse":
        return cls(
            id=variant.id,
            name=variant.name,
            template_id=variant.template_id,
            language=variant.language,
            updated_at=variant.updated_at.isoformat(),
        )


class VariantDetailResponse(VariantSummaryResponse):
    content: str
    created_at: str
    selector: SelectorResponse

    @classmethod
    def from_model(cls, variant: Variant) -> "VariantDetailResponse":
        selector = variant.selector
        if selector is None:
            raise ValueError("Variant is missing its selector.")
        return cls(
            id=variant.id,
            name=variant.name,
            template_id=variant.template_id,
            language=variant.language,
            updated_at=variant.updated_at.isoformat(),
            content=variant.content,
            created_at=variant.created_at.isoformat(),
            selector=SelectorResponse.from_model(selector),
        )


class CreateVariantRequest(BaseModel):
    name: Optional[str] = None
    content: str
    selector_content: str
    language: str = "en"
    template_id: Optional[str] = None
    source_variant_id: Optional[str] = None


class GeneratePdfRequest(BaseModel):
    yaml_content: str


class SyncTexRequest(BaseModel):
    page: int
    x: float
    y: float


class TranslationArtifact(BaseModel):
    source: str
    translated: str


class TranslateDocumentRequest(BaseModel):
    variant_content: str
    selector_content: str
    source_language: str = "en"
    target_language: str


class TranslateDocumentResponse(BaseModel):
    target_language: str
    variant: TranslationArtifact
    selector: TranslationArtifact
