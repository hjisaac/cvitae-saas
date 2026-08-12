from __future__ import annotations

from datetime import UTC, datetime

import ulid
from peewee import CharField, DateTimeField, ForeignKeyField, Model, TextField

from db.database import database

DEFAULT_LANGUAGE = "en"

# Fixture seeding identity until real auth exists.
DEFAULT_USER_ID = "local-user"


def utc_now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def new_ulid() -> str:
    return str(ulid.new())


class BaseModel(Model):
    class Meta:
        database = database


class Variant(BaseModel):
    id = CharField(primary_key=True, default=new_ulid)
    user_id = CharField(index=True)
    name = CharField()
    template_id = CharField(null=True)
    language = CharField(default=DEFAULT_LANGUAGE)
    content = TextField()
    created_at = DateTimeField(default=utc_now)
    updated_at = DateTimeField(default=utc_now)

    class Meta:
        table_name = "variants"

    @property
    def selector(self) -> "Selector | None":
        return self.selector_record.get_or_none()


class Selector(BaseModel):
    id = CharField(primary_key=True, default=new_ulid)
    variant = ForeignKeyField(Variant, backref="selector_record", unique=True, on_delete="CASCADE")
    content = TextField()
    created_at = DateTimeField(default=utc_now)
    updated_at = DateTimeField(default=utc_now)

    class Meta:
        table_name = "selectors"
