from __future__ import annotations

from fastapi import APIRouter

from api.endpoints import health, pdf, schema, selectors, synctex, translation, variants

api_router = APIRouter()

# Stateless — available without login
api_router.include_router(health.router)
api_router.include_router(translation.router)
api_router.include_router(pdf.router)
api_router.include_router(schema.router)
api_router.include_router(synctex.router)

# Account — require authentication
api_router.include_router(variants.router)
api_router.include_router(selectors.router)
