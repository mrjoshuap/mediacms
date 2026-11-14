#!/usr/bin/env python3
"""Enable a documentation locale and create its home page."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
LANGUAGES = ROOT / "docs" / "languages.yml"
DOCS = ROOT / "docs"

INDEX_TEMPLATE = """# MediaCMS

MediaCMS documentation in {name}.

English pages appear here until you translate them. Copy a file from `docs/en/` to the same path under `docs/{locale}/`, then translate the sentences. Keep UI labels in bold as the English words on the product screen.

- [Getting started](getting-started/index.md)
- [Roles](roles/index.md)
- [Languages](languages.md)
"""


def main() -> int:
    parser = argparse.ArgumentParser(description="Enable a docs language locale.")
    parser.add_argument("locale", help="Locale code from docs/languages.yml, for example fr")
    args = parser.parse_args()
    locale = args.locale.strip()

    data = yaml.safe_load(LANGUAGES.read_text(encoding="utf-8"))
    entry = next((item for item in data["languages"] if item["locale"] == locale), None)
    if entry is None:
        print(f"Unknown locale: {locale}", file=sys.stderr)
        print("Add it to docs/languages.yml first, using a code from cms/settings.py LANGUAGES.", file=sys.stderr)
        return 1

    entry["build"] = True
    LANGUAGES.write_text(
        yaml.safe_dump(data, sort_keys=False, allow_unicode=True),
        encoding="utf-8",
    )

    locale_dir = DOCS / locale
    locale_dir.mkdir(parents=True, exist_ok=True)
    index = locale_dir / "index.md"
    if not index.exists():
        index.write_text(
            INDEX_TEMPLATE.format(name=entry["name"], locale=locale),
            encoding="utf-8",
        )

    update_mkdocs_i18n(locale, entry["name"], bool(entry.get("rtl")))

    rtl_note = " Theme direction is RTL for this locale." if entry.get("rtl") else ""
    print(f"Enabled {locale} ({entry['name']}).{rtl_note}")
    print(f"Home page: {index.relative_to(ROOT)}")
    print("Next: copy pages from docs/en/ into docs/%s/ and translate them." % locale)
    print("Rebuild with: python scripts/prepare_docs_build.py && mkdocs build --strict")
    return 0


def update_mkdocs_i18n(locale: str, name: str, rtl: bool) -> None:
    """Append the locale to mkdocs.yml i18n languages when it is missing."""
    path = ROOT / "mkdocs.yml"
    text = path.read_text(encoding="utf-8")
    if f"locale: {locale}" in text:
        return
    # rtl is recorded in languages.yml; Material picks direction when the locale builds.
    _ = rtl
    block = f"""        - locale: {locale}
          name: {name}
          build: true
"""
    anchor = "        - locale: en\n          default: true\n          name: English\n          build: true\n"
    if anchor not in text:
        print("Could not update mkdocs.yml automatically. Add the locale under plugins.i18n.languages.", file=sys.stderr)
        return
    path.write_text(text.replace(anchor, anchor + block, 1), encoding="utf-8")


if __name__ == "__main__":
    raise SystemExit(main())
