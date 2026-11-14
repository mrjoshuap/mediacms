import tempfile
from pathlib import Path
from unittest.mock import patch

from django.core.exceptions import ValidationError
from django.test import TestCase

from files.management.commands.upgrade_site import restore_scratch
from files.models import Category, Tag, UpgradeDecision
from files.tests import create_account, create_media
from files.upgrade_audit import (
    anonymous_page_flags,
    apply_approval_choice,
    assess_migrations,
    inventory_snapshot,
    pages_to_copy,
    rebuild_taxonomy_counts,
    report_only,
    template_diffs,
)


class MigrationAssessmentTest(TestCase):
    def test_fast_forward_when_hashes_match_and_only_later_migrations_are_new(self):
        applied = [("files", "0001_initial")]
        image = {("files", "0001_initial"): "abc", ("files", "0002_next"): "def"}
        report = assess_migrations(applied, image, {("files", "0001_initial"): "abc"})
        self.assertTrue(report["fast_forward"])
        self.assertEqual(report["problems"], [])
        self.assertEqual(report["pending"], [{"app": "files", "name": "0002_next"}])

    def test_same_name_with_a_different_hash_is_not_faked(self):
        applied = [("files", "0001_initial")]
        image = {("files", "0001_initial"): "new"}
        previous = {("files", "0001_initial"): "old"}
        report = assess_migrations(applied, image, previous)
        self.assertFalse(report["fast_forward"])
        self.assertEqual(report["problems"], [{"app": "files", "name": "0001_initial", "reason": "do-not-fake"}])

    def test_a_missing_migration_is_not_a_fast_forward(self):
        report = assess_migrations([("files", "0099_local")], {}, {})
        self.assertFalse(report["fast_forward"])
        self.assertEqual(report["problems"][0]["reason"], "missing")


class UpgradeAnswerTest(TestCase):
    def test_empty_checks_are_omitted_and_protected_pages_are_not_copied(self):
        checks = inventory_snapshot()
        self.assertFalse(any(item["key"] == "pages" for item in checks))
        blocked, allowed = pages_to_copy(["sidebar-browse--handbook", "accounts", "sidebar-browse--api"])
        self.assertEqual(blocked, ["accounts", "sidebar-browse--api"])
        self.assertEqual(allowed, ["sidebar-browse--handbook"])
        with self.assertRaises(ValidationError):
            from files.models import Page

            Page.objects.create(slug="accounts", title="Stolen")

    def test_approval_answer_is_applied_once(self):
        pending = create_account()
        pending.is_approved = None
        pending.save(update_fields=["is_approved"])
        later = create_account()
        later.is_approved = False
        later.save(update_fields=["is_approved"])
        self.assertEqual(apply_approval_choice("approve"), 2)
        pending.refresh_from_db()
        later.refresh_from_db()
        self.assertTrue(pending.is_approved)
        self.assertTrue(later.is_approved)
        another = create_account()
        another.is_approved = False
        another.save(update_fields=["is_approved"])
        self.assertEqual(apply_approval_choice("approve"), 0)
        another.refresh_from_db()
        self.assertFalse(another.is_approved)
        self.assertTrue(UpgradeDecision.objects.get(key="approval").applied)

    def test_category_and_tag_counts_rebuild_once(self):
        user = create_account()
        media = create_media(user, title="counted", state="public", is_reviewed=True)
        category = Category.objects.create(uid="count-uid", title="Counted")
        tag = Tag.objects.create(title="Counted tag")
        media.category.add(category)
        media.tags.add(tag)
        # M2M signals may already sync counts; force stale values so rebuild has work.
        Category.objects.filter(pk=category.pk).update(media_count=0)
        Tag.objects.filter(pk=tag.pk).update(media_count=4)
        self.assertGreater(rebuild_taxonomy_counts(), 0)
        category.refresh_from_db()
        tag.refresh_from_db()
        self.assertEqual(category.media_count, 1)
        self.assertEqual(tag.media_count, 1)
        self.assertEqual(rebuild_taxonomy_counts(), 0)


class ScratchRestoreTest(TestCase):
    def test_scratch_restore_migrates_the_destination_database_only(self):
        source = "postgres://mediacms:secret@db:5432/sourcedb"
        dest = "postgres://mediacms:secret@db:5432/scratchdb"
        with patch("files.management.commands.upgrade_site.subprocess.run") as run:
            restore_scratch(source, dest)
        self.assertEqual(run.call_count, 3)
        self.assertEqual(run.call_args_list[0].args[0][0], "pg_dump")
        self.assertIn("sourcedb", run.call_args_list[0].args[0][-1])
        self.assertEqual(run.call_args_list[1].args[0][0], "pg_restore")
        self.assertIn("scratchdb", run.call_args_list[1].args[0][3])
        migrate = run.call_args_list[2]
        self.assertEqual(migrate.args[0][-2:], ["migrate", "--noinput"])
        self.assertEqual(migrate.kwargs["env"]["POSTGRES_NAME"], "scratchdb")
        self.assertNotIn("sourcedb", migrate.kwargs["env"]["POSTGRES_NAME"])


class ReportOnlyTest(TestCase):
    def test_template_diffs_and_anonymous_flags_are_reported_without_a_rewrite(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            image = root / "image"
            previous = root / "previous"
            (image / "templates").mkdir(parents=True)
            (previous / "templates" / "cms").mkdir(parents=True)
            (previous / "cms").mkdir()
            (image / "templates" / "root.html").write_text("new")
            (previous / "templates" / "root.html").write_text("old")
            (previous / "cms" / "local_settings.py").write_text("GLOBAL_LOGIN_REQUIRED = True\n")
            self.assertEqual(template_diffs(image, previous), ["root.html"])
            self.assertEqual(anonymous_page_flags(previous), {"GLOBAL_LOGIN_REQUIRED": "True"})
            reports = report_only(image, previous, root / "missing-media")
        self.assertEqual([item["key"] for item in reports], ["templates", "anonymous_pages"])
        self.assertFalse(any(item["key"] == "missing_media" for item in reports))
        self.assertFalse(any(item["key"] == "rbac_grants" for item in reports))
