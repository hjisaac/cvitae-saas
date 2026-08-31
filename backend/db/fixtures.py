from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

CONTENTS_VARIANTS_DIR = "cv_variants"
CONTENTS_SELECTORS_DIR = "cv_selectors"


@dataclass(frozen=True, slots=True)
class VariantFixture:
    name: str
    variant_file: str
    selector_file: str

    def read(self, contents_dir: Path) -> tuple[str, str] | None:
        variant_path = contents_dir / CONTENTS_VARIANTS_DIR / self.variant_file
        selector_path = contents_dir / CONTENTS_SELECTORS_DIR / self.selector_file
        if not variant_path.is_file() or not selector_path.is_file():
            return None
        return (
            variant_path.read_text(encoding="utf-8"),
            selector_path.read_text(encoding="utf-8"),
        )


VARIANT_FIXTURES: tuple[VariantFixture, ...] = (
    VariantFixture("general", "general.yaml", "general.yaml"),
    VariantFixture("academic", "academic.yaml", "academic.yaml"),
    VariantFixture("ml_engineer", "ml_engineer.yaml", "ml_engineer.yaml"),
)
