"""Slug grammar for sidebar placement, fragments, and protected routes."""

import re

PROTECTED_NAMES = frozenset(
    {
        "accounts",
        "login",
        "logout",
        "signup",
        "password",
        "saml",
        "approval_required",
        "api",
        "api-auth",
        "swagger",
        "docs",
        "admin",
        "lti",
        "tinymce",
        "fu",
        "manage",
        "user",
        "channel",
    }
)
LINK_SECTIONS = ("browse", "library", "personal", "info", "manage")
HTML_SECTIONS = ("below", "after-theme", "footer")
SECTIONS = HTML_SECTIONS + LINK_SECTIONS
BUILTIN_INFO_SLUGS = frozenset({"about", "tos", "contact", "setlanguage"})
INJECT_SLUGS = frozenset({"inject-head", "inject-css", "inject-header", "inject-footer", "inject-js"})
_NAME = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class PageSlug:
    def __init__(self, kind, name, section=None):
        self.kind = kind
        self.name = name
        self.section = section

    @property
    def public_path(self):
        if self.kind == "link":
            return f"/{self.name}"
        if self.kind == "document":
            return f"/{self.name}"
        return ""


def parse_page_slug(slug):
    """Classify a stored slug. Unknown shapes are ordinary documents."""
    if slug in INJECT_SLUGS:
        return PageSlug("inject", slug)
    for section in sorted(SECTIONS, key=len, reverse=True):
        prefix = f"sidebar-{section}--"
        if slug.startswith(prefix):
            name = slug[len(prefix) :]
            kind = "html" if section in HTML_SECTIONS else "link"
            return PageSlug(kind, name, section)
    return PageSlug("document", slug)


def slug_error(slug):
    """A reason the slug cannot be saved, or None when it is allowed."""
    if not slug or slug in PROTECTED_NAMES:
        return "That address is reserved."
    parsed = parse_page_slug(slug)
    if parsed.kind == "inject":
        return None
    if parsed.kind in ("link", "html"):
        if not _NAME.match(parsed.name or ""):
            return "The page name is not a valid address."
        if parsed.name in PROTECTED_NAMES:
            return "That address is reserved."
        if parsed.kind == "link" and parsed.name in BUILTIN_INFO_SLUGS:
            return "That sidebar link is already built in."
        return None
    if not _NAME.match(slug):
        return "The page name is not a valid address."
    return None


def resolve_public_page(slug):
    """The Page served at /<slug>, or None when the address is reserved or unknown."""
    from files.models import Page

    if not slug or slug in PROTECTED_NAMES or not _NAME.match(slug):
        return None
    parsed = parse_page_slug(slug)
    if parsed.kind != "document":
        return None
    direct = Page.objects.filter(slug=slug).first()
    if direct is not None:
        return direct
    for section in LINK_SECTIONS:
        page = Page.objects.filter(slug=f"sidebar-{section}--{slug}").first()
        if page is not None:
            return page
    return None


def is_unroutable(slug):
    """HTML slots, fragments, and protected names are not public pages."""
    if slug in PROTECTED_NAMES:
        return True
    parsed = parse_page_slug(slug)
    return parsed.kind in ("inject", "html") or parsed.name in PROTECTED_NAMES
