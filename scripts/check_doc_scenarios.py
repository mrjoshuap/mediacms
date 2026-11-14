#!/usr/bin/env python3
"""Validate scenario frontmatter, related tests, and screenshot placeholders."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCENARIOS = ROOT / "docs" / "en" / "scenarios"

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)
FIGURE_RE = re.compile(
    r'<figure class="screenshot-placeholder">\s*'
    r'<img[^>]*alt="([^"]*)"[^>]*>\s*'
    r"<figcaption>(.*?)</figcaption>\s*"
    r"</figure>",
    re.DOTALL,
)


def parse_frontmatter(text: str) -> dict[str, object]:
    match = FRONTMATTER_RE.match(text)
    if not match:
        raise ValueError("missing YAML frontmatter")
    data: dict[str, object] = {}
    key = None
    list_mode = False
    for raw in match.group(1).splitlines():
        line = raw.rstrip()
        if not line or line.strip().startswith("#"):
            continue
        if line.startswith("  - "):
            if not list_mode or key is None:
                raise ValueError(f"orphan list item: {line}")
            (data[key]).append(line[4:].strip().strip('"').strip("'"))  # type: ignore[index]
            continue
        if ":" not in line:
            raise ValueError(f"invalid frontmatter line: {line}")
        key, value = line.split(":", 1)
        key = key.strip()
        value = value.strip()
        if value == "":
            data[key] = []
            list_mode = True
        else:
            data[key] = value.strip('"').strip("'")
            list_mode = False
    return data


def related_tests_ok(tests: list[str], coverage: str | None) -> list[str]:
    errors: list[str] = []
    if not tests:
        if coverage != "gap":
            errors.append("related_tests empty without coverage: gap")
        return errors
    for item in tests:
        if "::" in item:
            path_part, func = item.split("::", 1)
            path = ROOT / path_part
            if not path.is_file():
                errors.append(f"missing test file: {path_part}")
                continue
            body = path.read_text(encoding="utf-8")
            # Accept class::method or function form
            method = func.split("::")[-1]
            if f"def {method}(" not in body:
                errors.append(f"missing test function {method} in {path_part}")
        else:
            path = ROOT / item
            if not path.is_file():
                errors.append(f"missing test file: {item}")
    return errors


def figure_ok(text: str) -> list[str]:
    errors: list[str] = []
    figures = FIGURE_RE.findall(text)
    if not figures:
        errors.append("no screenshot-placeholder figure with matching alt and figcaption")
        return errors
    for alt, caption in figures:
        caption = caption.strip()
        if not alt.strip():
            errors.append("empty alt on screenshot placeholder")
        if alt.strip() != caption:
            errors.append(f"alt/caption mismatch: {alt!r} != {caption!r}")
    return errors


def check_file(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    errors: list[str] = []
    try:
        meta = parse_frontmatter(text)
    except ValueError as exc:
        return [str(exc)]
    for required in ("id", "role", "audience", "goal"):
        if required not in meta:
            errors.append(f"missing frontmatter key: {required}")
    tests = meta.get("related_tests") or []
    if not isinstance(tests, list):
        errors.append("related_tests must be a list")
        tests = []
    coverage = meta.get("coverage") if isinstance(meta.get("coverage"), str) else None
    errors.extend(related_tests_ok(tests, coverage))  # type: ignore[arg-type]
    errors.extend(figure_ok(text))
    return errors


def main() -> int:
    if not SCENARIOS.is_dir():
        print(f"No scenarios directory at {SCENARIOS}", file=sys.stderr)
        return 1
    files = sorted(SCENARIOS.glob("*.md"))
    files = [path for path in files if path.name != "index.md"]
    if not files:
        print("No scenario files found", file=sys.stderr)
        return 1
    failed = 0
    for path in files:
        errors = check_file(path)
        if errors:
            failed += 1
            print(f"{path.relative_to(ROOT)}:")
            for error in errors:
                print(f"  - {error}")
    if failed:
        print(f"{failed} scenario file(s) failed", file=sys.stderr)
        return 1
    print(f"Checked {len(files)} scenario file(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
