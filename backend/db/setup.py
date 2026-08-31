"""Initialize the local SQLite database and seed fixture data."""

from __future__ import annotations

from config import CONTENTS_DIR
from db.bootstrap import initialize_variant_storage
from db.models import DEFAULT_USER_ID


def main() -> None:
    initialize_variant_storage(CONTENTS_DIR)
    print(f"Database ready with fixture data for user '{DEFAULT_USER_ID}'.")


if __name__ == "__main__":
    main()
