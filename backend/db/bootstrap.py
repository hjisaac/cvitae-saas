from __future__ import annotations

from pathlib import Path

from db.database import initialize_database
from db.fixtures import VARIANT_FIXTURES
from db.models import DEFAULT_LANGUAGE, DEFAULT_USER_ID, Selector, Variant
from db.repository import VariantRepository


def initialize_variant_storage(contents_dir: Path) -> None:
    initialize_database()
    Variant.create_table(safe=True)
    Selector.create_table(safe=True)
    seed_from_fixtures(contents_dir, DEFAULT_USER_ID)


def seed_from_fixtures(contents_dir: Path, user_id: str) -> None:
    repository = VariantRepository()

    for fixture in VARIANT_FIXTURES:
        if Variant.select().where((Variant.user_id == user_id) & (Variant.name == fixture.name)).exists():
            continue

        contents = fixture.read(contents_dir)
        if contents is None:
            continue

        variant_content, selector_content = contents
        repository.create_for_user(
            user_id,
            name=fixture.name,
            content=variant_content,
            selector_content=selector_content,
            language=DEFAULT_LANGUAGE,
        )
