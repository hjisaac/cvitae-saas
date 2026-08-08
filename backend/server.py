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
        from backend.loader import Loader, load_yaml, load_yaml_with_inheritance
        from backend.models import CVConfig, ContentData
        from backend.resolution import resolve_cv
        from backend.translate import Translator

        cv_data = yaml.load(req.yaml_content, Loader=Loader) or {}
        if not isinstance(cv_data, dict):
            cv_data = {}

        contents_dir = Path(__file__).parent.parent / "core-engine" / "contents"
        general_path = contents_dir / "cv_variants" / "general.yaml"
        base_variant = load_yaml_with_inheritance(general_path) if general_path.exists() else {}

        # Set up translator using locale from config (default to "en")
        locale = cv_data.get("locale", "en")
        locales_dir = contents_dir / "cv_locales"
        translator = Translator(locale, locales_dir)

        # Translate ui labels
        ui_path = contents_dir / "ui.static.yaml"
        ui_raw = load_yaml(ui_path) if ui_path.exists() else {}
        ui_labels = translator.data(ui_raw)

        if "sections" in cv_data:
            # User edited a Selector file
            config = CVConfig(**translator.data(cv_data))
            source = ContentData(**translator.data(base_variant))
            cv_data = resolve_cv(config, source, ui_labels, translator)
        else:
            # User edited a Variant file. Resolve against general/default selector.
            merged_variant = base_variant.copy()
            merged_variant.update(cv_data)
            
            default_selector_path = contents_dir / "cv_selectors" / "general.yaml"
            selector_data = load_yaml_with_inheritance(default_selector_path) if default_selector_path.exists() else {"sections": []}
            
            # Use locale from default selector or override
            locale = selector_data.get("locale", locale)
            translator = Translator(locale, locales_dir)
            ui_labels = translator.data(ui_raw)

            config = CVConfig(**translator.data(selector_data))
            source = ContentData(**translator.data(merged_variant))
            cv_data = resolve_cv(config, source, ui_labels, translator)

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
        import traceback
        traceback.print_exc()
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
        # Add 10pt tolerance buffer to box boundaries
        if (node["x_min"] - 10 <= target_x <= node["x_max"] + 10) and (node["y_min"] - 10 <= target_y <= node["y_max"] + 10):
            matching_nodes.append(node)
            
    if not matching_nodes and nodes:
        # Fallback to closest node by Euclidean distance if click is slightly outside text boxes
        import math
        best_node = min(nodes, key=lambda n: math.hypot(target_x - (n["x_min"] + n["x_max"])/2, target_y - (n["y_min"] + n["y_max"])/2))
    elif matching_nodes:
        # Sort by smallest area for maximum precision
        matching_nodes.sort(key=lambda n: n["area"])
        best_node = matching_nodes[0]
    else:
        return None
        
    return {
        "file": inputs.get(best_node["tag"], "unknown"),
        "line": best_node["line"]
    }

def extract_text_at_line(tex_path: Path, line_num: int) -> str:
    if not tex_path.exists():
        return ""
    with open(tex_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    start_idx = max(0, line_num - 1)
    selected = []
    for idx in range(start_idx, min(len(lines), start_idx + 4)):
        l = lines[idx].strip()
        if l and not l.startswith("%"):
            selected.append(l)

    raw_text = " ".join(selected) if selected else (lines[start_idx] if start_idx < len(lines) else "")
    # Clean LaTeX markup to extract plain text words
    clean = re.sub(r'\\[a-zA-Z]+\*?(?:\[[^\]]*\])?(?:\{([^\}]*)\})?', r' \1 ', raw_text)
    clean = re.sub(r'[\{\}\\\%\#\&]', ' ', clean).strip()
    return clean

LETTER_PAGE_HEIGHT_PTS = 792.0
FIRST_LINE_INDEX = 1

@app.post("/synctex-resolve")
def resolve_synctex(req: SyncTexRequest):
    persistent_dir = Path(__file__).parent
    synctex_path = persistent_dir / "latest.synctex.gz"
    tex_path = persistent_dir / "latest.tex"
    
    if synctex_path.exists():
        result = parse_synctex_coordinates(synctex_path, req.page, req.x, req.y)
        if result:
            tex_text = extract_text_at_line(tex_path, result["line"])
            return {
                "tex_line": result["line"],
                "tex_text": tex_text
            }
        
    if tex_path.exists():
        with open(tex_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        total_lines = len(lines)
        # Estimate line number from y position ratio
        ratio = min(1.0, max(0.0, req.y / LETTER_PAGE_HEIGHT_PTS))
        estimated_line = max(FIRST_LINE_INDEX, min(total_lines, int(ratio * total_lines)))
        tex_text = extract_text_at_line(tex_path, estimated_line)
        return {
            "tex_line": estimated_line,
            "tex_text": tex_text
        }

    raise HTTPException(status_code=404, detail="No source file available for preview.")
