# Site upgrade

Use this page to move an existing MediaCMS install to a new MediaCMS version. Use the `upgrade_site` command to check the old install before the upgrade.

!!! warning
    A site upgrade is not a content migration. A site upgrade moves **your own MediaCMS install** to a new MediaCMS version. A content migration imports media from Kaltura, YouTube, or Panopto. For that job, read [Content migration](content-migration.md).

Only a superuser with server access can do a site upgrade. For the basic image update, see [Update](../../getting-started/update.md).

## What the tools do

| Tool | Changes the source database? | Purpose |
|------|------------------------------|---------|
| `upgrade_site inventory` | No. It only reads | Reports what is different between the old install and the new image |
| `upgrade_site scratch` | No. It copies, then migrates the copy | Proves that the migrations run on a copy of your data |
| `deploy/docker/postgres_gate.sh` | No. It only reads | Compares a restored copy with its source |
| `deploy/docker/upgrade_site_smoke.sh` | No for the source. It writes to the scratch and empty databases | Runs the whole check in one script |
| `upgrade_site apply` | Yes. It writes to the database it is connected to | Applies your answers once, after the upgrade |
| `export_database` | No. It only reads | Writes a database backup file |

`upgrade_site` does not run `prestart.sh`. It never starts the migrations container.

## The three steps

```mermaid
flowchart LR
    old["Old install: database, tree, media"] --> inventory["inventory: read only report"]
    inventory --> decide{"Fast-forward and no problems?"}
    decide -->|"No"| stop["Stop. Fix the problem. Run inventory again"]
    decide -->|"Yes"| scratch["scratch: copy source and migrate the copy"]
    scratch --> check["Check the copy: gate and smoke script"]
    check --> upgrade["Upgrade: start the new image on the live database"]
    upgrade --> apply["apply: approval answer once and recount"]
    apply --> health["Site Health page"]
```

1. **Inventory.** Read the report. The source is not changed.
2. **Scratch.** Copy the source database and migrate the copy. The source is not changed.
3. **Apply.** After the real upgrade, record your answers once.

## Before you start

You need:

- The new MediaCMS image.
- The old install tree, mounted read-only at `/audit/previous`. Or set `AUDIT_PREVIOUS` to another path.
- The old media tree, mounted read-only at `/audit/media`. Or set `AUDIT_MEDIA` to another path.
- Connection URLs for PostgreSQL databases: the source, and an empty scratch database.
- The `pg_dump`, `pg_restore`, and `psql` programs in the image.

Run the commands from the application directory (`/home/mediacms.io/mediacms` in the Docker image) in a one-off container of the new image. The application tree must stay the image code. Never mount the old tree on the application directory.

1. Back up the source database with `pg_dump`.
2. Copy the `media_files` directory.
3. Keep the same `SECRET_KEY`. Credentials of content migrations are encrypted with a key derived from it.
4. Point the settings of the one-off container at the source database. The Docker `local_settings.py` reads `POSTGRES_NAME`, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, and `POSTGRES_PASSWORD`.

## Step 1: Inventory

1. Run the command.

   ```bash
   python manage.py upgrade_site inventory --previous /audit/previous
   ```

2. Read the output. It is one line of JSON with three keys: `migrations`, `checks`, and `reports`.

The command reads `django_migrations` of the connected database. It compares those migrations with the migration files in the new image. Optionally, it also compares them with the migration files in the old tree.

### Read `migrations`

| Key | Meaning |
|-----|---------|
| `fast_forward` | `true` when every applied migration exists in the image |
| `problems` | List of migrations with a problem. Each has `app`, `name`, and `reason` |
| `pending` | Migrations in the image that are not applied yet |

| Reason | Meaning | Action |
|--------|---------|--------|
| `missing` | The database has a migration that the image does not have | Stop. Use an image that has the migration |
| `do-not-fake` | The migration has the same name but different file content in the old tree and in the image | Stop. Do not fake this migration. Ask for help |

A `do-not-fake` problem is found only when the old tree is mounted. When `fast_forward` is `false`, do not continue to the upgrade.

### Read `checks`

`checks` reports data in the source database. A check with no rows is left out. The `checks` list can be empty.

| Key | Meaning |
|-----|---------|
| `listable` | Count of media where the stored `listable` value differs from the rule (public, encoding success, reviewed) |
| `approval` | Count of non-superuser accounts where `is_approved` is not true |
| `reports_public` | Count of public media with 10 or more reports |
| `reports_private` | Count of private media with at least one report |
| `reports_disagree` | Count of media where `reported_times` is not the number of report actions |
| `pages` | Pages with reserved slugs. `blocked` lists reserved slugs. `copy` lists slugs that can be kept |

The report limit in this check is fixed at 10. It does not read `REPORTED_TIMES_THRESHOLD`.

### Read `reports`

`reports` describes the old install. MediaCMS does not rewrite any of this data.

| Key | Meaning |
|-----|---------|
| `templates` | Template files that are different in the old tree and in the image. Review your custom templates |
| `missing_media` | Count of stored media paths that are not in the mounted media tree. Shown only when the media tree is mounted |
| `rbac_grants` | Count of RBAC membership rows. They are kept as they are |
| `anonymous_pages` | Values of `GLOBAL_LOGIN_REQUIRED`, `ALLOW_ANONYMOUS_ACTIONS`, `ALLOW_ANONYMOUS_USER_LISTING`, and `USERS_NEEDS_TO_BE_APPROVED` that the old `cms/local_settings.py` sets |

!!! note
    Compare `anonymous_pages` with the new settings. Make sure that anonymous access in the new install is the same as before. See the [Settings catalog](settings.md).

## Step 2: Scratch

Use `scratch` to prove that the migrations run on a copy of your data.

1. Create an empty PostgreSQL database for the copy.
2. Run the command.

   ```bash
   python manage.py upgrade_site scratch \
     --source-url postgres://USER:PASSWORD@SOURCE_HOST:5432/mediacms \
     --dest-url postgres://USER:PASSWORD@SCRATCH_HOST:5432/mediacms_scratch
   ```

3. Read the last line. `scratch restored and migrated` means success.

The command does these things:

1. It runs `pg_dump --format=custom` on the source.
2. It runs `pg_restore --no-owner` into the scratch database.
3. It runs `python manage.py migrate --noinput` for the scratch database only.

The destination URL must start with `postgres://` or `postgresql://`. It needs a host and a database name. The command checks this after the restore. If a step fails, the command stops with an error. The source rows are not changed.

### Compare a restored copy with its source (optional)

The `postgres_gate.sh` script compares a restored copy with its source. Run it before any migration on the copy. `scratch` migrates the copy, so a gate after `scratch` can fail on `django_migrations` when migrations were pending.

1. Restore a copy by hand.

   ```bash
   pg_dump --format=custom --file /tmp/source.dump "$SOURCE_DATABASE_URL"
   pg_restore --no-owner --dbname "$DEST_DATABASE_URL" /tmp/source.dump
   ```

2. Run the gate.

   ```bash
   SOURCE_DATABASE_URL=postgres://... DEST_DATABASE_URL=postgres://... \
     bash deploy/docker/postgres_gate.sh
   ```

The gate checks:

| Check | Tables or data |
|-------|----------------|
| Row counts | `files_media`, `users_user`, `files_page`, `django_migrations` |
| Sequences | A hash of the sequence names and last values |
| Keys | A hash of the `id` values of `files_media`, `users_user`, and `files_page` |
| No migration | The gate does not change the count in `django_migrations` |

| Result | Meaning |
|--------|---------|
| `postgres gate ok` | All checks passed |
| `count mismatch <table>: <source> <dest>` | A table has a different row count |
| `sequence mismatch` | A sequence is different |
| `key mismatch <table>` | The `id` values are different |
| Exit code 2 | `SOURCE_DATABASE_URL` or `DEST_DATABASE_URL` is not set |

## Run the whole check with one script

`upgrade_site_smoke.sh` runs the inventory, the scratch copy, an export round trip, and page checks.

1. Set the variables.

   | Variable | Needed | Meaning |
   |----------|--------|---------|
   | `SOURCE_DATABASE_URL` | Yes | The source database |
   | `DEST_DATABASE_URL` | Yes | The scratch database |
   | `EMPTY_DATABASE_URL` | Yes | A second, empty database for the export round trip |
   | `AUDIT_PREVIOUS` | No | Old tree. The default is `/audit/previous` |
   | `AUDIT_MEDIA` | No | Old media tree. The default is `/audit/media` |

2. Run the script.

   ```bash
   bash deploy/docker/upgrade_site_smoke.sh
   ```

3. Read the last line. `upgrade_site smoke ok` means success.

The script does these things in order:

1. It refuses to run when the old tree is mounted on the application directory.
2. It counts `django_migrations` in the source, runs `inventory`, and counts again. The counts must be equal.
3. When `.secret_key` exists in the old tree, it checks that `inventory` did not change the file.
4. It checks that the media tree is mounted.
5. It runs `scratch`. Then it checks that the source `django_migrations` count did not change.
6. It writes a backup with `export_database`. It restores that file into the empty database. It compares the row counts of `files_media`, `users_user`, and `files_page`.
7. On the scratch database, anonymous `/`, `/about`, and `/latest` must return 200. The sign-in page `/accounts/login/` must show a password field.
8. On the scratch database, it creates two test users: `audit-editor` and `audit-pending`. The editor must open `/manage/media`. The pending user must open `/`. The pending user must get 403 for an upload to `/api/v1/media`.

The script does not call `postgres_gate.sh`. Run the gate by hand if you want it.

## Step 3: Upgrade and apply

1. Update the image and start the containers. See [Update](../../getting-started/update.md). The `migrations` container runs `migrate`.
2. Open **Site** > **Health**. Fix failures.
3. Run `apply` once, with your answers.

   ```bash
   python manage.py upgrade_site apply --choice approve --recount
   ```

`apply` needs at least one of `--choice` or `--recount`. Without them it stops with an error.

| Option | Effect |
|--------|--------|
| `--choice approve` | Marks all existing pending accounts as approved. Only non-superusers with `is_approved` false or empty |
| `--choice leave` | Does not change any account. Records that you chose to leave them |
| `--recount` | Sets `media_count` of each category and tag from public, reviewed media |

Output examples: `approval approve 12` and `recount 3`. The number is the count of changed rows.

Run `apply` only after the upgrade. The `UpgradeDecision` table comes from migration `0022_upgradedecision`.

### The approval answer is used once

`apply --choice` stores the answer in the `UpgradeDecision` table. The row has the key `approval`, your `choice`, and `applied`.

- The first call applies the answer and sets `applied` to true.
- A later call changes no account. This is true for `approve` and for `leave`. The count is `0`.
- A new pending account that arrives later stays pending.

To read the stored answer:

```bash
python manage.py shell -c "from files.models import UpgradeDecision; print(list(UpgradeDecision.objects.values()))"
```

There is no admin page for `UpgradeDecision`.

`--recount` can run again. A second run changes nothing when the counts are right.

## Reserved page slugs

Page slugs decide the public address of a custom page. These names are reserved. They are used by MediaCMS routes:

`accounts`, `login`, `logout`, `signup`, `password`, `saml`, `approval_required`, `api`, `api-auth`, `swagger`, `docs`, `admin`, `lti`, `tinymce`, `fu`, `manage`, `user`, `channel`

A page cannot be saved with a reserved slug. The save raises an error. A page that was created with a reserved slug in an old install is not served as a public page. The inventory `pages` check lists these pages in `blocked`. It does not put them in the `copy` list.

To fix a blocked page:

1. Open **Site** > **Pages**.
2. Open the blocked page.
3. Change **Slug** to an allowed value.
4. Select **Save**.

See [Custom pages and appearance](pages-appearance.md) for the full slug rules.

## If something fails

| Problem | What to do |
|---------|-----------|
| `fast_forward` is `false` | Do not upgrade. Fix the `problems` list first |
| `scratch` stops in `pg_dump` or `pg_restore` | Check the URLs, the passwords, and the PostgreSQL client version |
| `scratch` stops in `migrate` | Read the migration error. The source is not changed. Fix the cause and run `scratch` with a new empty database |
| Smoke script reports a count change | Stop. Do not upgrade. The source `django_migrations` changed |
| `postgres gate` reports a mismatch | The copy is not the same as the source. Restore the copy again |
| Version 2 data directory | PostgreSQL 13 data does not start on a newer PostgreSQL. See [Update](../../getting-started/update.md) |

## MediaCMS Architecture

The check tools read the old install and write only to scratch databases. The upgrade uses the live database.

```mermaid
flowchart TD
    sourceDb[("Source database")] -->|"read only"| inventory["upgrade_site inventory"]
    oldTree["Old tree /audit/previous"] -->|"read only"| inventory
    oldMedia["Old media /audit/media"] -->|"read only"| inventory
    imageCode["New image code"] --> inventory
    inventory --> report["JSON report: migrations, checks, reports"]
    sourceDb -->|"pg_dump"| scratch["upgrade_site scratch"]
    scratch -->|"pg_restore then migrate"| scratchDb[("Scratch database")]
    sourceDb -.->|"compare"| gate["postgres_gate.sh"]
    scratchDb -.-> gate
    scratchDb --> smoke["upgrade_site_smoke.sh page checks"]
    report --> go{"Go?"}
    smoke --> go
    go -->|"Yes"| liveUpgrade["Start new image: migrations run"]
    liveUpgrade --> liveDb[("Live database")]
    liveDb --> apply["upgrade_site apply"]
    apply --> decision[("UpgradeDecision: approval once")]
```
