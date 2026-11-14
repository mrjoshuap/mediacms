"""Dev-only MkDocs serving at /documentation/."""

import pytest
from django.test import Client, override_settings

pytestmark = pytest.mark.django_db


@pytest.fixture
def docs_site(tmp_path):
    index = tmp_path / "index.html"
    index.write_text("<html><body>MediaCMS docs</body></html>", encoding="utf-8")
    nested = tmp_path / "getting-started"
    nested.mkdir()
    (nested / "index.html").write_text("<html><body>Getting started</body></html>", encoding="utf-8")
    return tmp_path


def _body(response) -> bytes:
    if hasattr(response, "streaming_content"):
        return b"".join(response.streaming_content)
    return response.content


@override_settings(SERVE_DOCUMENTATION=True)
def test_documentation_serves_index(docs_site):
    client = Client()
    with override_settings(DOCUMENTATION_ROOT=str(docs_site)):
        response = client.get("/documentation/")
    assert response.status_code == 200
    assert b"MediaCMS docs" in _body(response)


@override_settings(SERVE_DOCUMENTATION=True)
def test_documentation_serves_nested_index(docs_site):
    client = Client()
    with override_settings(DOCUMENTATION_ROOT=str(docs_site)):
        response = client.get("/documentation/getting-started/")
    assert response.status_code == 200
    assert b"Getting started" in _body(response)


@override_settings(SERVE_DOCUMENTATION=True)
def test_documentation_missing_build_returns_404(tmp_path):
    missing = tmp_path / "no-site-here"
    client = Client()
    with override_settings(DOCUMENTATION_ROOT=str(missing)):
        response = client.get("/documentation/")
    assert response.status_code == 404


@override_settings(SERVE_DOCUMENTATION=False)
def test_documentation_disabled_returns_404(docs_site):
    client = Client()
    with override_settings(DOCUMENTATION_ROOT=str(docs_site)):
        response = client.get("/documentation/")
    assert response.status_code == 404


def test_documentation_is_protected_slug():
    from files.page_slugs import PROTECTED_NAMES

    assert "documentation" in PROTECTED_NAMES
