from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

# Load repo-root env files so `make dev-backend` shares AUTH_SECRET with Next.js.
load_dotenv(PROJECT_ROOT / ".env.local")
load_dotenv(PROJECT_ROOT / ".env")

CONTENTS_DIR = PROJECT_ROOT / "core-engine" / "contents"
LOCALES_DIR = CONTENTS_DIR / "cv_locales"
TEMPLATES_DIR = (
    BACKEND_DIR / "templates"
    if (BACKEND_DIR / "templates").exists()
    else PROJECT_ROOT / "core-engine" / "templates"
)
ARTIFACTS_DIR = BACKEND_DIR

AUTH_SECRET = os.getenv("AUTH_SECRET")
