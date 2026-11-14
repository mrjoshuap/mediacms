"""Inventory a mounted install, optionally restore a scratch database, and apply answers once."""

import json
import logging
import os
import subprocess
import sys
import tempfile
from urllib.parse import unquote, urlparse

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from files.upgrade_audit import (
    apply_approval_choice,
    assess_migrations,
    inventory_snapshot,
    migration_hashes,
    rebuild_taxonomy_counts,
    report_only,
)

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Report upgrade deltas. Migrates a scratch database only. Does not run prestart."

    def add_arguments(self, parser):
        parser.add_argument("step", choices=("inventory", "apply", "scratch"))
        parser.add_argument("--previous", default=os.environ.get("AUDIT_PREVIOUS", "/audit/previous"))
        parser.add_argument("--choice", choices=("approve", "leave"))
        parser.add_argument("--recount", action="store_true")
        parser.add_argument("--source-url", default="")
        parser.add_argument("--dest-url", default="")

    def handle(self, *args, **options):
        step = options["step"]
        logger.info("upgrade_site started - step=%s", step)
        if step == "inventory":
            image = migration_hashes(settings.BASE_DIR)
            previous = migration_hashes(options["previous"])
            from django.db import connection

            with connection.cursor() as cursor:
                cursor.execute("SELECT app, name FROM django_migrations")
                applied = cursor.fetchall()
            report = {
                "migrations": assess_migrations(applied, image, previous),
                "checks": inventory_snapshot(),
                "reports": report_only(settings.BASE_DIR, options["previous"], os.environ.get("AUDIT_MEDIA", "/audit/media")),
            }
            self.stdout.write(json.dumps(report, default=list))
            logger.info("upgrade_site inventory finished")
            return
        if step == "apply":
            if options["choice"]:
                updated = apply_approval_choice(options["choice"])
                self.stdout.write(f"approval {options['choice']} {updated}")
                logger.info("upgrade_site apply approval - choice=%s, updated=%s", options["choice"], updated)
            if options["recount"]:
                recounted = rebuild_taxonomy_counts()
                self.stdout.write(f"recount {recounted}")
                logger.info("upgrade_site apply recount finished - result=%s", recounted)
            if not options["choice"] and not options["recount"]:
                raise CommandError("Pass --choice and or --recount.")
            return
        source = options["source_url"]
        dest = options["dest_url"]
        if not source or not dest:
            raise CommandError("scratch needs --source-url and --dest-url.")
        restore_scratch(source, dest)
        logger.info("upgrade_site scratch restore finished")
        self.stdout.write("scratch restored and migrated")


def postgres_env(database_url):
    """Map a postgres URL onto the POSTGRES_* variables local_settings reads."""
    parsed = urlparse(database_url)
    if parsed.scheme not in ("postgres", "postgresql"):
        raise CommandError("Database URL must start with postgres://")
    name = parsed.path.lstrip("/")
    if not name or not parsed.hostname:
        raise CommandError("Database URL needs a host and a database name.")
    env = os.environ.copy()
    env["POSTGRES_NAME"] = name
    env["POSTGRES_HOST"] = parsed.hostname
    env["POSTGRES_PORT"] = str(parsed.port or 5432)
    if parsed.username:
        env["POSTGRES_USER"] = unquote(parsed.username)
    if parsed.password is not None:
        env["POSTGRES_PASSWORD"] = unquote(parsed.password)
    return env


def restore_scratch(source_url, dest_url):
    """Dump source, restore into dest, and migrate dest. Source rows stay untouched."""
    with tempfile.TemporaryDirectory() as tmp:
        dump_path = os.path.join(tmp, "scratch.dump")
        subprocess.run(["pg_dump", "--format=custom", "--file", dump_path, f"--dbname={source_url}"], check=True)
        subprocess.run(["pg_restore", "--no-owner", "--dbname", dest_url, dump_path], check=True)
    subprocess.run([sys.executable, "manage.py", "migrate", "--noinput"], check=True, env=postgres_env(dest_url))
