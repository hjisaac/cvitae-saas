from __future__ import annotations

from fastapi import APIRouter

from backend.models import CVConfig, ContentData
from backend.schema import translate_schema_descriptions
from backend.translate import Translator
from config import LOCALES_DIR

router = APIRouter()


@router.get("/schema/selector")
def get_selector_schema(locale: str = "en"):
    translator = Translator(locale, LOCALES_DIR)
    schema = CVConfig.model_json_schema()
    return translate_schema_descriptions(schema, translator)


@router.get("/schema/variant")
def get_variant_schema(locale: str = "en"):
    translator = Translator(locale, LOCALES_DIR)
    schema = ContentData.model_json_schema()
    return translate_schema_descriptions(schema, translator)
