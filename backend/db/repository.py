from __future__ import annotations

from db.models import DEFAULT_LANGUAGE, Selector, Variant


class VariantRepository:
    def list_for_user(self, user_id: str) -> list[Variant]:
        return list(
            Variant.select()
            .where(Variant.user_id == user_id)
            .order_by(Variant.created_at.desc())
        )

    def get_for_user(self, user_id: str, variant_id: str) -> Variant | None:
        variant = Variant.get_or_none((Variant.id == variant_id) & (Variant.user_id == user_id))
        if variant is None or variant.selector is None:
            return None
        return variant

    def create_for_user(
        self,
        user_id: str,
        *,
        name: str | None,
        content: str,
        selector_content: str,
        language: str | None = None,
        template_id: str | None = None,
        source_variant_id: str | None = None,
    ) -> Variant:
        if source_variant_id is not None:
            source = self.get_for_user(user_id, source_variant_id)
            if source is None:
                raise LookupError(f"Source variant not found: {source_variant_id}")

            name = name or source.name
            language = language or source.language
            if template_id is None:
                template_id = source.template_id
        elif name is None:
            raise ValueError("name is required when source_variant_id is not provided")

        variant = Variant.create(
            user_id=user_id,
            name=name,
            template_id=template_id,
            language=language or DEFAULT_LANGUAGE,
            content=content,
        )
        Selector.create(
            variant=variant,
            content=selector_content,
        )
        return variant


class SelectorRepository:
    def list_for_user(self, user_id: str) -> list[Selector]:
        return list(
            Selector.select(Selector, Variant)
            .join(Variant)
            .where(Variant.user_id == user_id)
            .order_by(Variant.created_at.desc())
        )

    def get_for_user(self, user_id: str, selector_id: str) -> Selector | None:
        return (
            Selector.select(Selector, Variant)
            .join(Variant)
            .where((Selector.id == selector_id) & (Variant.user_id == user_id))
            .get_or_none()
        )

    def get_for_variant(self, user_id: str, variant_id: str) -> Selector | None:
        variant = Variant.get_or_none((Variant.id == variant_id) & (Variant.user_id == user_id))
        if variant is None:
            return None
        return variant.selector
