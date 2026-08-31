from __future__ import annotations

from fastapi import APIRouter

from api.schemas import GeneratePdfRequest
from services.pdf import generate_pdf

router = APIRouter()


@router.post("/generate-pdf")
async def generate_pdf_route(payload: GeneratePdfRequest):
    return generate_pdf(payload.yaml_content)
