"""Serve the MkDocs site from site/ at /documentation/ (development only)."""

from pathlib import Path

from django.conf import settings
from django.http import Http404, HttpResponseRedirect
from django.views.static import serve as static_serve


def documentation(request, path=""):
    """Serve built documentation HTML and assets when SERVE_DOCUMENTATION is on."""
    if not getattr(settings, "SERVE_DOCUMENTATION", False):
        raise Http404("Documentation is not served in this environment.")

    root = Path(getattr(settings, "DOCUMENTATION_ROOT", Path(settings.BASE_DIR) / "site"))
    if not root.is_dir():
        raise Http404("Documentation is not built yet. Start the docs profile: " "docker compose -f docker-compose-dev.yaml --profile docs up docs")

    # /documentation → /documentation/
    if path == "" and not request.path.endswith("/"):
        return HttpResponseRedirect(request.path + "/")

    relative = path
    candidate = root / relative
    if relative == "" or relative.endswith("/"):
        candidate = root / relative / "index.html"
    elif candidate.is_dir():
        return HttpResponseRedirect(request.path.rstrip("/") + "/")
    elif not candidate.is_file() and (root / relative / "index.html").is_file():
        return HttpResponseRedirect(request.path.rstrip("/") + "/")

    if not candidate.is_file():
        raise Http404(f"Documentation page not found: {path or '/'}")

    # Django's static serve wants a path relative to document_root.
    served = candidate.relative_to(root).as_posix()
    return static_serve(request, served, document_root=str(root))
