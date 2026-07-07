import tempfile
import os
import yaml
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
from typing import Any, Dict

from backend.latex import escape_for_latex, compile_pdf
from backend.build import create_latex_template
from backend.constants import TEMPLATES_DIR, CV_TEMPLATE_FILENAME, DEFAULT_ENCODING

app = FastAPI(title="CVitae Cloud Run Microservice")

# Load template once on startup
templates_dir = Path(__file__).parent / "templates" if (Path(__file__).parent / "templates").exists() else Path(__file__).parent.parent / "core-engine" / "templates"
template = create_latex_template(templates_dir, template_filename=CV_TEMPLATE_FILENAME)

class GenerateRequest(BaseModel):
    # We accept the raw YAML content from the frontend
    yaml_content: str

@app.post("/generate-pdf")
async def generate_pdf(req: GenerateRequest):
    try:
        # Parse the YAML content into a dictionary
        cv_data = yaml.safe_load(req.yaml_content)
        
        # 1. Escape LaTeX characters
        escaped = escape_for_latex(cv_data)

        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_path = Path(tmpdir)
            tex_path = tmp_path / "document.tex"
            pdf_path = tmp_path / "document.pdf"
            
            # 2. Render Template
            tex_path.write_text(template.render(**escaped), encoding=DEFAULT_ENCODING)

            # 3. Compile PDF (will use local compiler if installed in Docker, else fallback)
            compile_pdf(str(tex_path), str(tmp_path))

            if not pdf_path.exists():
                raise HTTPException(status_code=500, detail="PDF generation failed. No output file.")

            # Read the PDF bytes to return them directly, so tmpdir can be cleaned up
            pdf_bytes = pdf_path.read_bytes()

        # 4. Return as a StreamingResponse or Response
        return Response(content=pdf_bytes, media_type="application/pdf")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok"}
