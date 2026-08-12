from __future__ import annotations

import shutil
import tempfile
import traceback
from pathlib import Path

from fastapi import HTTPException
from fastapi.responses import Response

from backend.build import create_latex_template
from backend.constants import CV_TEMPLATE_FILENAME, DEFAULT_ENCODING
from backend.latex import compile_pdf, escape_for_latex
from backend.loader import load_yaml, load_yaml_string, load_yaml_with_inheritance
from backend.models import CVConfig, ContentData
from backend.resolution import resolve_cv
from backend.translate import Translator
from config import ARTIFACTS_DIR, CONTENTS_DIR, LOCALES_DIR, TEMPLATES_DIR

_template = create_latex_template(TEMPLATES_DIR, template_filename=CV_TEMPLATE_FILENAME)


def generate_pdf(yaml_content: str) -> Response:
    try:
        cv_data = load_yaml_string(yaml_content)

        general_path = CONTENTS_DIR / "cv_variants" / "general.yaml"
        base_variant = load_yaml_with_inheritance(general_path) if general_path.exists() else {}

        locale = cv_data.get("locale", "en")
        translator = Translator(locale, LOCALES_DIR)

        ui_path = CONTENTS_DIR / "ui.static.yaml"
        ui_raw = load_yaml(ui_path) if ui_path.exists() else {}
        ui_labels = translator.data(ui_raw)

        if "sections" in cv_data:
            config = CVConfig(**translator.data(cv_data))
            source = ContentData(**translator.data(base_variant))
            cv_data = resolve_cv(config, source, ui_labels, translator)
        else:
            merged_variant = base_variant.copy()
            merged_variant.update(cv_data)

            default_selector_path = CONTENTS_DIR / "cv_selectors" / "general.yaml"
            selector_data = (
                load_yaml_with_inheritance(default_selector_path)
                if default_selector_path.exists()
                else {"sections": []}
            )

            locale = selector_data.get("locale", locale)
            translator = Translator(locale, LOCALES_DIR)
            ui_labels = translator.data(ui_raw)

            config = CVConfig(**translator.data(selector_data))
            source = ContentData(**translator.data(merged_variant))
            cv_data = resolve_cv(config, source, ui_labels, translator)

        escaped = escape_for_latex(cv_data)

        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_path = Path(tmpdir)
            tex_path = tmp_path / "document.tex"
            pdf_path = tmp_path / "document.pdf"

            latex_content = _template.render(**escaped)
            if "\\documentclass" in latex_content:
                latex_content = latex_content.replace("\\documentclass", "\\synctex=1\n\\documentclass", 1)
            else:
                latex_content = "\\synctex=1\n" + latex_content

            tex_path.write_text(latex_content, encoding=DEFAULT_ENCODING)
            compile_pdf(str(tex_path), str(tmp_path))

            synctex_src = tmp_path / "document.synctex.gz"
            if synctex_src.exists():
                shutil.copy(synctex_src, ARTIFACTS_DIR / "latest.synctex.gz")
            if tex_path.exists():
                shutil.copy(tex_path, ARTIFACTS_DIR / "latest.tex")

            if not pdf_path.exists():
                raise HTTPException(status_code=500, detail="PDF generation failed. No output file.")

            pdf_bytes = pdf_path.read_bytes()

        return Response(content=pdf_bytes, media_type="application/pdf")

    except HTTPException:
        raise
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(exc)) from exc
