"""Read-only upgrade inventory and one-shot answers. The source database is not migrated here."""

import hashlib
from pathlib import Path

from django.db import connection, transaction
from django.db.models import Q

from files.page_slugs import slug_error

MIGRATION_SKIP = {"__init__.py"}


def migration_hashes(root):
    """Map (app, migration name) to the sha256 of the migration file."""
    hashes = {}
    base = Path(root)
    if not base.is_dir():
        return hashes
    for migrations in base.glob("*/migrations"):
        if not migrations.is_dir():
            continue
        app = migrations.parent.name
        for path in migrations.glob("*.py"):
            if path.name in MIGRATION_SKIP:
                continue
            hashes[(app, path.stem)] = hashlib.sha256(path.read_bytes()).hexdigest()
    return hashes


def assess_migrations(applied, image_hashes, previous_hashes=None):
    """A fast-forward has every applied file present in the image with the same hash.

    A same-name file with a different hash is reported as do-not-fake. applied is a
    sequence of (app, name).
    """
    previous_hashes = previous_hashes or {}
    problems = []
    for app, name in applied:
        key = (app, name)
        if key not in image_hashes:
            problems.append({"app": app, "name": name, "reason": "missing"})
            continue
        if key in previous_hashes and previous_hashes[key] != image_hashes[key]:
            problems.append({"app": app, "name": name, "reason": "do-not-fake"})
    pending = sorted(set(image_hashes) - {(app, name) for app, name in applied})
    return {"fast_forward": not problems, "problems": problems, "pending": [{"app": app, "name": name} for app, name in pending]}


def _scalar(sql, params=()):
    try:
        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute(sql, params)
                row = cursor.fetchone()
                return row[0] if row else 0
    except Exception:
        return None


def inventory_snapshot(threshold=10):
    """Counts from the connected database using SQL. Missing tables yield None."""
    checks = []
    mismatches = _scalar(
        """
        SELECT COUNT(*) FROM files_media
        WHERE listable IS DISTINCT FROM (state = 'public' AND encoding_status = 'success' AND COALESCE(is_reviewed, false) IS TRUE)
        """
    )
    if mismatches:
        checks.append({"key": "listable", "count": mismatches})
    pending_users = _scalar(
        """
        SELECT COUNT(*) FROM users_user
        WHERE is_superuser IS NOT TRUE AND is_approved IS NOT TRUE
        """
    )
    if pending_users:
        checks.append({"key": "approval", "count": pending_users})
    public_reports = _scalar("SELECT COUNT(*) FROM files_media WHERE state = 'public' AND reported_times >= %s", [threshold])
    if public_reports:
        checks.append({"key": "reports_public", "count": public_reports})
    private_reports = _scalar(
        """
        SELECT COUNT(DISTINCT media_id) FROM actions_mediaaction
        WHERE action = 'report' AND media_id IN (SELECT id FROM files_media WHERE state = 'private')
        """
    )
    if private_reports:
        checks.append({"key": "reports_private", "count": private_reports})
    disagreed = _scalar(
        """
        SELECT COUNT(*) FROM files_media m
        WHERE m.reported_times <> (
            SELECT COUNT(*) FROM actions_mediaaction a WHERE a.media_id = m.id AND a.action = 'report'
        )
        """
    )
    if disagreed:
        checks.append({"key": "reports_disagree", "count": disagreed})
    blocked, allowed = pages_to_copy(_page_slugs())
    if blocked:
        checks.append({"key": "pages", "blocked": blocked, "copy": allowed})
    return checks


def _page_slugs():
    slugs = _fetch_slugs()
    return slugs


def _fetch_slugs():
    try:
        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute("SELECT slug FROM files_page")
                return [row[0] for row in cursor.fetchall()]
    except Exception:
        return []


def template_diffs(image_root, previous_root):
    """Relative template paths that differ. Missing trees produce no report."""
    image = Path(image_root) / "templates"
    previous = Path(previous_root) / "templates"
    if not image.is_dir() or not previous.is_dir():
        return []
    names = set()
    for root in (image, previous):
        for path in root.rglob("*"):
            if path.is_file():
                names.add(path.relative_to(root).as_posix())
    diffs = []
    for name in sorted(names):
        left = image / name
        right = previous / name
        if not left.is_file() or not right.is_file():
            diffs.append(name)
            continue
        if hashlib.sha256(left.read_bytes()).digest() != hashlib.sha256(right.read_bytes()).digest():
            diffs.append(name)
    return diffs


def missing_media_count(media_root):
    """How many stored media paths are absent from the mounted media tree. None if it is not mounted."""
    root = Path(media_root)
    if not root.is_dir():
        return None
    try:
        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute("SELECT media_file FROM files_media WHERE COALESCE(media_file, '') <> ''")
                names = [row[0] for row in cursor.fetchall()]
    except Exception:
        return None
    return sum(1 for name in names if not (root / name).is_file())


def rbac_grant_count():
    """Membership rows. Reported only; grants are not rewritten."""
    return _scalar("SELECT COUNT(*) FROM rbac_rbacmembership")


_ANONYMOUS_FLAGS = (
    "GLOBAL_LOGIN_REQUIRED",
    "ALLOW_ANONYMOUS_ACTIONS",
    "ALLOW_ANONYMOUS_USER_LISTING",
    "USERS_NEEDS_TO_BE_APPROVED",
)


def anonymous_page_flags(previous_root):
    """Settings lines that decide anonymous access. Reported only; rows are not changed."""
    path = Path(previous_root) / "cms" / "local_settings.py"
    if not path.is_file():
        return {}
    found = {}
    for line in path.read_text(errors="replace").splitlines():
        stripped = line.strip()
        if stripped.startswith("#") or "=" not in stripped:
            continue
        name, value = stripped.split("=", 1)
        name = name.strip()
        if name in _ANONYMOUS_FLAGS:
            found[name] = value.strip()
    return found


def report_only(image_root, previous_root, media_root):
    """Checks that describe the old install and do not offer a row rewrite."""
    checks = []
    diffs = template_diffs(image_root, previous_root)
    if diffs:
        checks.append({"key": "templates", "paths": diffs})
    missing = missing_media_count(media_root)
    if missing:
        checks.append({"key": "missing_media", "count": missing})
    grants = rbac_grant_count()
    if grants:
        checks.append({"key": "rbac_grants", "count": grants})
    flags = anonymous_page_flags(previous_root)
    if flags:
        checks.append({"key": "anonymous_pages", "flags": flags})
    return checks


def pages_to_copy(slugs):
    """Protected slugs are reported and left out of the copy list."""
    blocked = []
    allowed = []
    for slug in slugs:
        if slug_error(slug):
            blocked.append(slug)
        else:
            allowed.append(slug)
    return blocked, allowed


def apply_approval_choice(choice):
    """Mark the existing pending set approved once, or record that they stay pending.

    A second call does not change anyone.
    """
    from files.models import UpgradeDecision
    from users.models import User

    if choice not in ("approve", "leave"):
        raise ValueError(choice)
    decision, _created = UpgradeDecision.objects.get_or_create(key="approval", defaults={"choice": choice, "applied": False})
    if decision.applied:
        return 0
    updated = 0
    if choice == "approve":
        updated = User.objects.filter(is_superuser=False).filter(Q(is_approved=False) | Q(is_approved__isnull=True)).update(is_approved=True)
    decision.choice = choice
    decision.applied = True
    decision.save(update_fields=["choice", "applied"])
    return updated


def rebuild_taxonomy_counts():
    """Set category and tag counts from public reviewed media. A second run changes nothing."""
    from files.models import Category, Media, Tag

    changed = 0
    for category in Category.objects.all():
        count = Media.objects.filter(category=category, state="public", is_reviewed=True).count()
        if category.media_count != count:
            category.media_count = count
            category.save(update_fields=["media_count"])
            changed += 1
    for tag in Tag.objects.all():
        count = Media.objects.filter(tags=tag, state="public", is_reviewed=True).count()
        if tag.media_count != count:
            tag.media_count = count
            tag.save(update_fields=["media_count"])
            changed += 1
    return changed
