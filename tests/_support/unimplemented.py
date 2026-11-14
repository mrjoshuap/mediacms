"""
Marks an expected product feature that is not implemented yet.

Pytest reports these as xfailed (they do not fail CI). Use only for
stubbed/absent behavior — not for tests you have not written yet.

Mirrors frontend/tests/_support/unimplemented.ts (Jest test.todo).
"""

from __future__ import annotations

import pytest


def unimplemented(description: str):
    """Decorator: warn-mode case for stubbed/absent product behavior."""
    reason = f"[unimplemented] {description}"

    def decorator(func):
        marked = pytest.mark.unimplemented(reason)(func)
        return pytest.mark.xfail(reason=reason, run=False, strict=False)(marked)

    return decorator
