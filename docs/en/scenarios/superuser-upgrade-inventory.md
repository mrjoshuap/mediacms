---
id: superuser-upgrade-inventory
role: superuser
audience: admin
goal: Run the upgrade_site inventory command and confirm that the migrations fast-forward
duration: 5m
viewport: 1280x800
preconditions:
  - Signed in to a terminal on the server as a superuser with server access
  - A one-off container of the new MediaCMS image can reach the source database
  - The old install tree is mounted read-only at /audit/previous
  - The source database has a backup
related_tests:
  - tests/upgrade/test_upgrade_audit.py::MigrationAssessmentTest::test_fast_forward_when_hashes_match_and_only_later_migrations_are_new
  - tests/upgrade/test_upgrade_audit.py::MigrationAssessmentTest::test_same_name_with_a_different_hash_is_not_faked
  - tests/upgrade/test_upgrade_audit.py::MigrationAssessmentTest::test_a_missing_migration_is_not_a_fast_forward
---

# Run the upgrade_site inventory command and confirm that the migrations fast-forward

Related guides: [Site upgrade](../guides/admin/site-upgrade.md), [Update](../getting-started/update.md), [Superuser role](../roles/superuser.md)

!!! warning
    A site upgrade moves your own MediaCMS install to a new version. It is not a content migration. For media from Kaltura, YouTube, or Panopto, read [Superuser content migration](superuser-content-migration.md).

## Before you start

1. Open a terminal window on the server. Make the window about 1280 by 800 pixels.
2. Back up the source database with `pg_dump`.
3. Copy the `media_files` directory.
4. Start a one-off container of the new image in the application directory. Point its settings at the source database.

## Steps

1. Run the command.

   ```bash
   python manage.py upgrade_site inventory --previous /audit/previous
   ```

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="A terminal after the inventory command. One line of JSON shows the keys migrations, checks, and reports. The key fast_forward is true.">
  <figcaption>A terminal after the inventory command. One line of JSON shows the keys migrations, checks, and reports. The key fast_forward is true.</figcaption>
</figure>

2. Read the key `migrations`. Find `fast_forward`.
3. Check that `problems` is an empty list.
4. Read `pending`. It lists the migrations that the new image adds.
5. Read `checks` and `reports`. Note each item for the upgrade.

## Expected result

The output is one line of JSON. `fast_forward` is `true`. `problems` is empty. The command does not change the source database.

Go to the next step only when `fast_forward` is `true`. The next step is `upgrade_site scratch`.

## If this fails

- If `fast_forward` is `false` and a problem has the reason `missing`, the database has a migration that the image does not have. Stop. Use an image that has the migration.
- If a problem has the reason `do-not-fake`, the migration has the same name but different file content. Stop. Do not fake this migration. Ask for help.
- If the output has no data about the old install, the old tree is not mounted. Check the path `/audit/previous`. A `do-not-fake` problem is found only when the old tree is mounted.
- The command reads data only. After the upgrade, open **Site** > **Health**. See [Superuser health](superuser-health.md).
