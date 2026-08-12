from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI

from api.router import api_router
from api.validation import register_validation_handlers
from db.database import initialize_database
from db.models import Selector, Variant


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_database()
    Variant.create_table(safe=True)
    Selector.create_table(safe=True)
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="CVitae Cloud Run Microservice", lifespan=lifespan)
    register_validation_handlers(app)
    app.include_router(api_router)
    return app


app = create_app()
