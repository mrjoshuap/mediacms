"""Write a gzipped database backup. The admin download stays on the quiet profile."""

from django.core.management.base import BaseCommand

from admin_customizations.database_backup import (
    BackupProfile,
    database_backup_filename,
    iter_database_backup,
)


class Command(BaseCommand):
    help = "Write a gzipped database backup. Engagement and failed status rows stay out unless requested."

    def add_arguments(self, parser):
        parser.add_argument("--output", required=True, help="Path of the .json.gz file to write.")
        parser.add_argument("--include-engagement", action="store_true", help="Include likes, dislikes, watches, and ratings.")
        parser.add_argument("--include-noisy-status", action="store_true", help="Include failed encodings and trim or caption requests.")

    def handle(self, *args, **options):
        profile = BackupProfile(
            include_engagement=options["include_engagement"],
            include_noisy_status=options["include_noisy_status"],
        )
        path = options["output"]
        with open(path, "wb") as handle:
            for chunk in iter_database_backup(profile):
                handle.write(chunk)
        self.stdout.write(database_backup_filename())
