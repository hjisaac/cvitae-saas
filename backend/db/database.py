from __future__ import annotations

from pathlib import Path

from peewee import SqliteDatabase

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATABASE_PATH = DATA_DIR / "cvitae.sqlite3"

database = SqliteDatabase(None, pragmas={"foreign_keys": 1})


def initialize_database(database_path: Path = DATABASE_PATH) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    database.init(str(database_path))
    database.connect(reuse_if_open=True)
