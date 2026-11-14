#!/bin/bash
# Smoke the upgrade audit against read-only mounts.
# The application tree must stay the image code. The old install is /audit/previous.
set -euo pipefail

if [ -z "${SOURCE_DATABASE_URL:-}" ]; then
    echo "Set SOURCE_DATABASE_URL to the database under audit" >&2
    exit 2
fi

previous="${AUDIT_PREVIOUS:-/audit/previous}"
media="${AUDIT_MEDIA:-/audit/media}"
app="/home/mediacms.io/mediacms"

if [ "$(readlink -f "$previous" 2>/dev/null || echo "$previous")" = "$(readlink -f "$app")" ]; then
    echo "previous tree is mounted on the application directory" >&2
    exit 1
fi

before="$(psql "$SOURCE_DATABASE_URL" -Atqc 'SELECT COUNT(*) FROM django_migrations')"
python manage.py upgrade_site inventory --previous "$previous"
after="$(psql "$SOURCE_DATABASE_URL" -Atqc 'SELECT COUNT(*) FROM django_migrations')"
if [ "$before" != "$after" ]; then
    echo "inventory changed django_migrations" >&2
    exit 1
fi

secret="${previous}/.secret_key"
if [ -f "$secret" ]; then
    stat_before="$(stat -c '%Y %s' "$secret")"
    python manage.py upgrade_site inventory --previous "$previous" >/dev/null
    stat_after="$(stat -c '%Y %s' "$secret")"
    if [ "$stat_before" != "$stat_after" ]; then
        echo "inventory rewrote .secret_key" >&2
        exit 1
    fi
fi

if [ ! -d "$media" ]; then
    echo "media mount ${media} is missing" >&2
    exit 1
fi

if [ -z "${DEST_DATABASE_URL:-}" ] || [ -z "${EMPTY_DATABASE_URL:-}" ]; then
    echo "Set DEST_DATABASE_URL and EMPTY_DATABASE_URL" >&2
    exit 2
fi

python manage.py upgrade_site scratch --source-url "$SOURCE_DATABASE_URL" --dest-url "$DEST_DATABASE_URL"
scratch_migrations="$(psql "$SOURCE_DATABASE_URL" -Atqc 'SELECT COUNT(*) FROM django_migrations')"
if [ "$before" != "$scratch_migrations" ]; then
    echo "scratch changed the source django_migrations" >&2
    exit 1
fi

export_dir="$(mktemp -d)"
python manage.py export_database --output "${export_dir}/default.json.gz"

python - "$EMPTY_DATABASE_URL" "${export_dir}/default.json.gz" "$SOURCE_DATABASE_URL" <<'PY'
import os
import subprocess
import sys
from urllib.parse import unquote, urlparse

empty_url, fixture, source_url = sys.argv[1:]
parsed = urlparse(empty_url)
env = os.environ.copy()
env["POSTGRES_NAME"] = parsed.path.lstrip("/")
env["POSTGRES_HOST"] = parsed.hostname or "127.0.0.1"
env["POSTGRES_PORT"] = str(parsed.port or 5432)
if parsed.username:
    env["POSTGRES_USER"] = unquote(parsed.username)
if parsed.password is not None:
    env["POSTGRES_PASSWORD"] = unquote(parsed.password)
subprocess.run([sys.executable, "manage.py", "migrate", "--noinput"], check=True, env=env)
os.environ.update({key: env[key] for key in env if key.startswith("POSTGRES_")})

import django

django.setup()
from django.core.files.uploadedfile import SimpleUploadedFile

from admin_customizations.database_restore import restore_database_backup

with open(fixture, "rb") as handle:
    uploaded = SimpleUploadedFile("default.json.gz", handle.read(), content_type="application/gzip")
restore_database_backup(uploaded)

def count(url, sql):
    return subprocess.check_output(["psql", url, "-Atqc", sql], text=True).strip()

for table in ("files_media", "users_user", "files_page"):
    if count(source_url, f"SELECT COUNT(*) FROM {table}") != count(empty_url, f"SELECT COUNT(*) FROM {table}"):
        raise SystemExit(f"export round trip count mismatch {table}")
PY

python - "$DEST_DATABASE_URL" <<'PY'
import os
import sys
from urllib.parse import unquote, urlparse

parsed = urlparse(sys.argv[1])
os.environ["POSTGRES_NAME"] = parsed.path.lstrip("/")
os.environ["POSTGRES_HOST"] = parsed.hostname or "127.0.0.1"
os.environ["POSTGRES_PORT"] = str(parsed.port or 5432)
if parsed.username:
    os.environ["POSTGRES_USER"] = unquote(parsed.username)
if parsed.password is not None:
    os.environ["POSTGRES_PASSWORD"] = unquote(parsed.password)

import django

django.setup()
from django.contrib.auth import get_user_model
from django.test import Client

User = get_user_model()
client = Client()
for path in ("/", "/about", "/latest"):
    response = client.get(path)
    if response.status_code != 200:
        raise SystemExit(f"anonymous {path} returned {response.status_code}")
login = client.get("/accounts/login/")
if login.status_code != 200 or b"password" not in login.content.lower():
    raise SystemExit("login form is not /accounts/login/")

editor, _created = User.objects.get_or_create(username="audit-editor", defaults={"email": "audit-editor@example.com", "is_editor": True, "is_approved": True})
editor.is_editor = True
editor.is_approved = True
editor.set_password("audit-editor")
editor.save()
client.force_login(editor)
manage = client.get("/manage/media")
if manage.status_code != 200:
    raise SystemExit(f"editor manage page returned {manage.status_code}")

pending, _created = User.objects.get_or_create(username="audit-pending", defaults={"email": "audit-pending@example.com", "is_approved": False})
pending.is_approved = False
pending.is_superuser = False
pending.is_editor = False
pending.set_password("audit-pending")
pending.save()
client.force_login(pending)
home = client.get("/")
if home.status_code != 200:
    raise SystemExit(f"pending home returned {home.status_code}")
upload = client.post("/api/v1/media", {})
if upload.status_code != 403:
    raise SystemExit(f"pending upload returned {upload.status_code}")
PY

rm -rf "$export_dir"
echo "upgrade_site smoke ok"
