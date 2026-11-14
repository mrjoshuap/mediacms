"""Tests for scripts/release_version.py (no Django)."""

import importlib.util
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "release_version.py"


def _load():
    spec = importlib.util.spec_from_file_location("release_version", SCRIPT)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    return mod


def test_next_tag_primary():
    mod = _load()
    tag, emergency = mod.next_tag("10.0.0", "20251114", tags=set())
    assert tag == "v10.0.0.20251114"
    assert emergency is False


def test_next_tag_emergency_increments():
    mod = _load()
    tags = {"v10.0.0.20251114", "v10.0.0.20251114.1"}
    tag, emergency = mod.next_tag("10.0.0", "20251114", tags=tags)
    assert tag == "v10.0.0.20251114.2"
    assert emergency is True


def test_validate_stable_tag():
    mod = _load()
    parsed = mod.validate_stable_tag("v10.0.0.20251114", base="10.0.0")
    assert parsed["stamp"] == "20251114"
    assert parsed["n"] is None


def test_validate_stable_tag_rejects_wrong_base():
    mod = _load()
    with pytest.raises(SystemExit):
        mod.validate_stable_tag("v9.4.0.20251114", base="10.0.0")


def test_parse_tag_emergency():
    mod = _load()
    parsed = mod.parse_tag("v10.0.0.20251114.3")
    assert parsed == {"base": "10.0.0", "stamp": "20251114", "n": 3}
