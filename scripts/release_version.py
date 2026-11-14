#!/usr/bin/env python3
"""Compute date-stamped fork release tags: v1.2.3.YYYYMMDD[.N]."""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FORK_VERSION_FILE = ROOT / "version" / "FORK_VERSION"
TAG_RE = re.compile(r"^v(?P<base>\d+\.\d+\.\d+)\.(?P<stamp>\d{8})(?:\.(?P<n>\d+))?$")


def read_base() -> str:
    text = FORK_VERSION_FILE.read_text(encoding="utf-8").strip()
    if not re.fullmatch(r"\d+\.\d+\.\d+", text):
        raise SystemExit(f"Invalid FORK_VERSION in {FORK_VERSION_FILE}: {text!r}")
    return text


def utc_stamp(when: datetime | None = None) -> str:
    when = when or datetime.now(timezone.utc)
    return when.strftime("%Y%m%d")


def existing_tags() -> set[str]:
    try:
        out = subprocess.check_output(
            ["git", "tag", "--list", "v*"],
            cwd=ROOT,
            text=True,
            stderr=subprocess.DEVNULL,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return set()
    return {line.strip() for line in out.splitlines() if line.strip()}


def parse_tag(tag: str) -> dict | None:
    match = TAG_RE.match(tag)
    if not match:
        return None
    data = match.groupdict()
    data["n"] = int(data["n"]) if data["n"] else None
    return data


def next_tag(base: str, stamp: str, tags: set[str] | None = None) -> tuple[str, bool]:
    """Return (tag, is_emergency)."""
    tags = tags if tags is not None else existing_tags()
    primary = f"v{base}.{stamp}"
    if primary not in tags:
        return primary, False
    n = 1
    while f"v{base}.{stamp}.{n}" in tags:
        n += 1
    return f"v{base}.{stamp}.{n}", True


def validate_stable_tag(tag: str, base: str | None = None) -> dict:
    parsed = parse_tag(tag)
    if not parsed:
        raise SystemExit(f"Tag {tag!r} does not match vMAJOR.MINOR.PATCH.YYYYMMDD[.N]")
    expected = base or read_base()
    if parsed["base"] != expected:
        raise SystemExit(f"Tag base {parsed['base']!r} does not match FORK_VERSION {expected!r}")
    return parsed


def emit_github_output(payload: dict) -> None:
    path = os.environ.get("GITHUB_OUTPUT")
    if not path:
        return
    with open(path, "a", encoding="utf-8") as handle:
        for key, value in payload.items():
            handle.write(f"{key}={value}\n")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--channel",
        choices=("beta", "stable"),
        required=True,
        help="Release channel.",
    )
    parser.add_argument(
        "--tag",
        default="",
        help="Existing git tag for stable releases (e.g. v1.2.3.20251114).",
    )
    parser.add_argument(
        "--stamp",
        default="",
        help="Override UTC YYYYMMDD stamp (tests).",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print JSON to stdout.",
    )
    args = parser.parse_args()

    base = read_base()
    stamp = args.stamp or utc_stamp()
    if not re.fullmatch(r"\d{8}", stamp):
        raise SystemExit(f"Invalid stamp {stamp!r}; expected YYYYMMDD")

    if args.channel == "stable":
        if not args.tag:
            raise SystemExit("--tag is required for --channel stable")
        tag = args.tag[1:] if args.tag.startswith("refs/tags/") else args.tag
        if tag.startswith("refs/tags/"):
            tag = tag.removeprefix("refs/tags/")
        parsed = validate_stable_tag(tag, base=base)
        is_emergency = parsed["n"] is not None
        version = tag.lstrip("v")
    else:
        tag, is_emergency = next_tag(base, stamp)
        version = tag.lstrip("v")

    payload = {
        "base": base,
        "stamp": stamp if args.channel == "beta" else (parse_tag(tag) or {}).get("stamp", stamp),
        "version": version,
        "tag": tag,
        "channel": args.channel,
        "is_emergency": str(is_emergency).lower(),
        "image_version": version,
    }
    if args.channel == "stable":
        payload["stamp"] = parse_tag(tag)["stamp"]  # type: ignore[index]

    emit_github_output(payload)
    if args.json:
        print(json.dumps(payload, indent=2, sort_keys=True))
    else:
        print(tag)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
