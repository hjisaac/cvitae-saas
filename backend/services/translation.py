from __future__ import annotations

from typing import Any

from ruamel.yaml.comments import CommentedMap, CommentedSeq

from backend.loader import TaggedText, dump_yaml, load_yaml_document
from backend.translate import translate_text


def translate_yaml_content(content: str, source_language: str, target_language: str) -> str:
    parsed = load_yaml_document(content)
    translate_value(parsed, source_language, target_language)
    return dump_yaml(parsed)


def translate_value(value: Any, source_language: str, target_language: str) -> Any:
    if isinstance(value, (dict, CommentedMap)):
        for key in value:
            value[key] = translate_value(value[key], source_language, target_language)
        return value
    if isinstance(value, (list, CommentedSeq)):
        for index, item in enumerate(value):
            value[index] = translate_value(item, source_language, target_language)
        return value
    if isinstance(value, TaggedText):
        translated = translate_text(str(value), source=source_language, target=target_language)
        return TaggedText(translated or str(value))
    return value
