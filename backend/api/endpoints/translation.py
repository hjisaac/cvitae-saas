from __future__ import annotations

from fastapi import APIRouter

from api.schemas import TranslateDocumentRequest, TranslateDocumentResponse, TranslationArtifact
from services.translation import translate_yaml_content

router = APIRouter()


@router.post("/translate", response_model=TranslateDocumentResponse)
def translate_document(payload: TranslateDocumentRequest):
    translated_variant = translate_yaml_content(
        payload.variant_content,
        payload.source_language,
        payload.target_language,
    )
    translated_selector = translate_yaml_content(
        payload.selector_content,
        payload.source_language,
        payload.target_language,
    )

    return TranslateDocumentResponse(
        target_language=payload.target_language,
        variant=TranslationArtifact(source=payload.variant_content, translated=translated_variant),
        selector=TranslationArtifact(source=payload.selector_content, translated=translated_selector),
    )
