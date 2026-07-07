import tempfile
import os
import yaml
import re
import shutil
import gzip
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
from typing import Any, Dict, Optional

from backend.latex import escape_for_latex, compile_pdf
from backend.build import create_latex_template
from backend.constants import TEMPLATES_DIR, CV_TEMPLATE_FILENAME, DEFAULT_ENCODING
from backend.models import CVConfig, ContentData

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
            
            # 2. Render Template & Inject SyncTeX activation
            latex_content = template.render(**escaped)
            # Inject \synctex=1 right before the document starts to enable SyncTeX engine-agnostically
            if "\\documentclass" in latex_content:
                latex_content = latex_content.replace("\\documentclass", "\\synctex=1\n\\documentclass", 1)
            else:
                latex_content = "\\synctex=1\n" + latex_content

            tex_path.write_text(latex_content, encoding=DEFAULT_ENCODING)

            # 3. Compile PDF (will use local compiler if installed in Docker, else fallback)
            compile_pdf(str(tex_path), str(tmp_path))

            # Copy synctex and tex files to static locations for SyncTeX queries
            persistent_dir = Path(__file__).parent
            synctex_src = tmp_path / "document.synctex.gz"
            if synctex_src.exists():
                shutil.copy(synctex_src, persistent_dir / "latest.synctex.gz")
            if tex_path.exists():
                shutil.copy(tex_path, persistent_dir / "latest.tex")

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

@app.get("/profiles")
def list_profiles():
    selectors_dir = Path(__file__).parent.parent / "core-engine" / "contents" / "cv_selectors"
    if not selectors_dir.exists():
        return []
    
    profiles = []
    for file in selectors_dir.glob("*.yaml"):
        if file.name.startswith("_") or file.name.endswith("_fr.yaml"):
            continue
        profiles.append(file.stem)
    return sorted(profiles)

@app.get("/file-content")
def get_file_content(profile: str, file_type: str):
    base_dir = Path(__file__).parent.parent / "core-engine" / "contents"
    
    if file_type == "selector":
        file_path = base_dir / "cv_selectors" / f"{profile}.yaml"
    elif file_type == "variant":
        file_path = base_dir / "cv_variants" / f"{profile}.yaml"
    elif file_type == "general":
        file_path = base_dir / "cv_variants" / "general.yaml"
    else:
        raise HTTPException(status_code=400, detail="Invalid file type")
        
    if not file_path.exists():
        if file_type == "variant":
            file_path = base_dir / "cv_variants" / "general.yaml"
        else:
            raise HTTPException(status_code=404, detail=f"File not found: {file_path.name}")
            
    content = file_path.read_text(encoding="utf-8")
    return {"content": content, "filepath": str(file_path.relative_to(base_dir.parent.parent))}

class SaveFileRequest(BaseModel):
    profile: str
    file_type: str
    content: str

@app.post("/file-content")
def save_file_content(req: SaveFileRequest):
    base_dir = Path(__file__).parent.parent / "core-engine" / "contents"
    
    if req.file_type == "selector":
        file_path = base_dir / "cv_selectors" / f"{req.profile}.yaml"
    elif req.file_type == "variant":
        file_path = base_dir / "cv_variants" / f"{req.profile}.yaml"
    elif req.file_type == "general":
        file_path = base_dir / "cv_variants" / "general.yaml"
    else:
        raise HTTPException(status_code=400, detail="Invalid file type")
        
    try:
        file_path.write_text(req.content, encoding="utf-8")
        return {"status": "success", "filepath": str(file_path.relative_to(base_dir.parent.parent))}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/schema/selector")
def get_selector_schema():
    return CVConfig.model_json_schema()

@app.get("/schema/variant")
def get_variant_schema():
    return ContentData.model_json_schema()

class SyncTexRequest(BaseModel):
    page: int
    x: float
    y: float

def parse_synctex_coordinates(synctex_gz_path: Path, page: int, target_x: float, target_y: float):
    if not synctex_gz_path.exists():
        return None
        
    inputs = {}
    nodes = []
    
    # 1pt = 65536sp
    SCALE = 65536.0
    
    with gzip.open(synctex_gz_path, 'rt', encoding='utf-8', errors='ignore') as f:
        in_target_sheet = False
        for line in f:
            line = line.strip()
            if not line:
                continue
                
            if line.startswith("Input:"):
                parts = line.split(":", 2)
                if len(parts) >= 3:
                    inputs[parts[1]] = parts[2]
                continue
                
            if line.startswith("Sheet:"):
                sheet_num = int(line.split(":")[1])
                if sheet_num == page:
                    in_target_sheet = True
                continue
            elif line.startswith("}"):
                if in_target_sheet:
                    break
                continue
                
            if not in_target_sheet:
                continue
                
            # Parse horizontal '(' and vertical '[' boxes
            if line[0] in ('(', '['):
                match = re.match(r'[(\[](.*?):(.*?),(.*?),(.*?):(.*?),(.*?),(.*)', line)
                if match:
                    tag, src_line, x, y, w, h, d = match.groups()
                    try:
                        node_x = float(x) / SCALE
                        node_y = float(y) / SCALE
                        node_w = float(w) / SCALE
                        node_h = float(h) / SCALE
                        node_d = float(d) / SCALE
                        
                        # SyncTeX box boundaries (Points)
                        x_min = node_x
                        x_max = node_x + node_w
                        y_min = node_y - node_h
                        y_max = node_y + node_d
                        
                        nodes.append({
                            "tag": tag,
                            "line": int(src_line),
                            "x_min": x_min,
                            "x_max": x_max,
                            "y_min": y_min,
                            "y_max": y_max,
                            "area": node_w * (node_h + node_d)
                        })
                    except ValueError:
                        pass
                        
    # Find matching nodes
    matching_nodes = []
    for node in nodes:
        if (node["x_min"] <= target_x <= node["x_max"]) and (node["y_min"] <= target_y <= node["y_max"]):
            matching_nodes.append(node)
            
    if not matching_nodes:
        return None
        
    # Sort by smallest area for maximum precision
    matching_nodes.sort(key=lambda n: n["area"])
    best_node = matching_nodes[0]
    
    return {
        "file": inputs.get(best_node["tag"], "unknown"),
        "line": best_node["line"]
    }

def map_tex_line_to_yaml_path(tex_path: Path, line_num: int) -> Optional[str]:
    if not tex_path.exists():
        return None
    with open(tex_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    # Walk backward from target line to find nearest % SOURCE: comment
    start_idx = min(line_num - 1, len(lines) - 1)
    for idx in range(start_idx, -1, -1):
        line = lines[idx].strip()
        match = re.search(r"%\s*SOURCE:\s*(.*)", line)
        if match:
            return match.group(1).strip()
    return None

@app.post("/synctex-resolve")
def resolve_synctex(req: SyncTexRequest):
    persistent_dir = Path(__file__).parent
    synctex_path = persistent_dir / "latest.synctex.gz"
    tex_path = persistent_dir / "latest.tex"
    
    if not synctex_path.exists():
        raise HTTPException(status_code=404, detail="No synctex file found. Render the PDF first.")
        
    result = parse_synctex_coordinates(synctex_path, req.page, req.x, req.y)
    if not result:
        raise HTTPException(status_code=404, detail="No source line matches these coordinates.")
        
    yaml_path = map_tex_line_to_yaml_path(tex_path, result["line"])
    return {
        "tex_file": result["file"],
        "tex_line": result["line"],
        "yaml_path": yaml_path
    }
