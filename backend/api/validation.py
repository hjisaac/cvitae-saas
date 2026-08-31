from __future__ import annotations

import json
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from pydantic_i18n import PydanticI18n

from config import LOCALES_DIR


def get_pydantic_i18n(locales_path: Path) -> PydanticI18n:
    translations = {"en": {}, "fr": {}}

    for locale in ("en", "fr"):
        locale_file = locales_path / f"{locale}.json"
        if not locale_file.exists():
            continue
        try:
            content = json.loads(locale_file.read_text(encoding="utf-8"))
            for key, value in content.items():
                if value:
                    translations[locale][key] = value
        except Exception:
            continue

    return PydanticI18n(translations, default_locale="en")


pydantic_i18n = get_pydantic_i18n(LOCALES_DIR)


def register_validation_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        locale = request.query_params.get("locale", "en")
        if locale not in ("en", "fr"):
            locale = "en"
        translated = pydantic_i18n.translate(exc.errors(), locale=locale)
        return JSONResponse(status_code=422, content={"detail": translated})

    @app.exception_handler(ValidationError)
    async def pydantic_validation_exception_handler(request: Request, exc: ValidationError):
        locale = request.query_params.get("locale", "en")
        if locale not in ("en", "fr"):
            locale = "en"
        translated = pydantic_i18n.translate(exc.errors(), locale=locale)
        return JSONResponse(status_code=422, content={"detail": translated})
