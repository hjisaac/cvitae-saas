from __future__ import annotations

import gzip
import math
import re
from pathlib import Path

from config import ARTIFACTS_DIR

LETTER_PAGE_HEIGHT_PTS = 792.0
FIRST_LINE_INDEX = 1
SYNCTEX_SCALE = 65536.0


def parse_synctex_coordinates(synctex_gz_path: Path, page: int, target_x: float, target_y: float):
    if not synctex_gz_path.exists():
        return None

    inputs: dict[str, str] = {}
    nodes: list[dict[str, float | int]] = []

    with gzip.open(synctex_gz_path, "rt", encoding="utf-8", errors="ignore") as file:
        in_target_sheet = False
        for line in file:
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
                in_target_sheet = sheet_num == page
                continue

            if line.startswith("}"):
                if in_target_sheet:
                    break
                continue

            if not in_target_sheet:
                continue

            if line[0] in ("(", "["):
                match = re.match(r"[(\[](.*?):(.*?),(.*?),(.*?):(.*?),(.*?),(.*)", line)
                if not match:
                    continue

                tag, src_line, x, y, w, h, depth = match.groups()
                try:
                    node_x = float(x) / SYNCTEX_SCALE
                    node_y = float(y) / SYNCTEX_SCALE
                    node_w = float(w) / SYNCTEX_SCALE
                    node_h = float(h) / SYNCTEX_SCALE
                    node_d = float(depth) / SYNCTEX_SCALE

                    nodes.append(
                        {
                            "tag": tag,
                            "line": int(src_line),
                            "x_min": node_x,
                            "x_max": node_x + node_w,
                            "y_min": node_y - node_h,
                            "y_max": node_y + node_d,
                            "area": node_w * (node_h + node_d),
                        }
                    )
                except ValueError:
                    continue

    matching_nodes = [
        node
        for node in nodes
        if (node["x_min"] - 10 <= target_x <= node["x_max"] + 10)
        and (node["y_min"] - 10 <= target_y <= node["y_max"] + 10)
    ]

    if not matching_nodes and nodes:
        best_node = min(
            nodes,
            key=lambda node: math.hypot(
                target_x - (node["x_min"] + node["x_max"]) / 2,
                target_y - (node["y_min"] + node["y_max"]) / 2,
            ),
        )
    elif matching_nodes:
        matching_nodes.sort(key=lambda node: node["area"])
        best_node = matching_nodes[0]
    else:
        return None

    return {
        "file": inputs.get(best_node["tag"], "unknown"),
        "line": best_node["line"],
    }


def extract_text_at_line(tex_path: Path, line_num: int) -> str:
    if not tex_path.exists():
        return ""

    with open(tex_path, encoding="utf-8") as file:
        lines = file.readlines()

    start_idx = max(0, line_num - 1)
    selected = []
    for idx in range(start_idx, min(len(lines), start_idx + 4)):
        line = lines[idx].strip()
        if line and not line.startswith("%"):
            selected.append(line)

    raw_text = " ".join(selected) if selected else (lines[start_idx] if start_idx < len(lines) else "")
    clean = re.sub(r"\\[a-zA-Z]+\*?(?:\[[^\]]*\])?(?:\{([^\}]*)\})?", r" \1 ", raw_text)
    return re.sub(r"[\{\}\\\%\#\&]", " ", clean).strip()


def resolve_synctex(page: int, x: float, y: float) -> dict[str, int | str]:
    synctex_path = ARTIFACTS_DIR / "latest.synctex.gz"
    tex_path = ARTIFACTS_DIR / "latest.tex"

    if synctex_path.exists():
        result = parse_synctex_coordinates(synctex_path, page, x, y)
        if result:
            return {
                "tex_line": result["line"],
                "tex_text": extract_text_at_line(tex_path, result["line"]),
            }

    if tex_path.exists():
        with open(tex_path, encoding="utf-8") as file:
            lines = file.readlines()
        total_lines = len(lines)
        ratio = min(1.0, max(0.0, y / LETTER_PAGE_HEIGHT_PTS))
        estimated_line = max(FIRST_LINE_INDEX, min(total_lines, int(ratio * total_lines)))
        return {
            "tex_line": estimated_line,
            "tex_text": extract_text_at_line(tex_path, estimated_line),
        }

    raise FileNotFoundError("No source file available for preview.")
