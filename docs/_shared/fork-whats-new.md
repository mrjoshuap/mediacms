<!-- curated fork release notes; edit this file, not docs/en/reference/whats-new.md -->
# Fork changes since upstream MediaCMS 9.4.0

These notes cover the fork beta line (`mediacms-next`) relative to upstream `main` at MediaCMS 9.4.0. Entries use the same Conventional Commits types as `.releaserc.json`: **Features**, **Bug Fixes**, **Documentation**, **Refactors**.

See [Site health and database](../guides/admin/site.md), [Admin portal map](../guides/admin/portal-map.md), and [Fork beta and stable images](../getting-started/install.md#fork-beta-and-stable-images-ghcr).

## Features

* **admin:** workflow sidebar with Moderation, Library, Processing, People, Integrations, and Site groups
* **admin:** dashboard overview pages with cached statistics and **Refresh stats**
* **admin:** Site Health, Configuration, System, and Database pages
* **admin:** database backup download and restore upload for superusers
* **admin:** redacted support bundle on Get Support
* **admin:** Library and Engagement overview dashboards
* **admin:** grouped Actions dropdown choices and object change-form actions
* **admin:** optional changelist columns, icons, fieldsets, and related displays
* **admin:** navbar language chooser (Jazzmin language chooser)
* **integrity:** media and metadata integrity checks in Site Health and Library
* **actions:** MediaAction indexing and moderation audit support
* **upgrade:** `upgrade_site` command, UpgradeDecision model, and upgrade audit helpers
* **dev:** `populate_fake_media` command with locale and timestamp options; `ALLOW_POPULATE_FAKE_MEDIA` guard
* **docs:** MkDocs Material documentation (roles, guides, scenarios) served at `/documentation/`
* **ci:** mike versioned docs deploy on GitHub Pages (`dev` / `beta` / `latest`)
* **release:** GHCR date-stamped `:beta` and `:stable` images from `version/FORK_VERSION`
* **settings:** `ACCOUNT_LOGIN_BY_CODE_ENABLED` and `ALLOW_POPULATE_FAKE_MEDIA`
* **logging:** structured app logging with `LOGLEVEL`, optional SQL debug via `ENABLE_SQL_DEBUG_LOGGING`, and per-app loggers
* **logging:** failed-login warnings with client IP for django-allauth and API token login
* **logging:** operational logs for admin database backup/restore, support bundle, object actions, and related management commands
* **proxy:** `TRUSTED_PROXIES` with `ProxyAwareMiddleware` and `get_client_ip` (off when the list is empty)

## Bug Fixes

* **docs:** publish mike docs through the GitHub Pages Actions deploy path
* **i18n:** German translation additions and corrections (#1622)
* **templates:** default context keys for permissions, media, and current site to avoid AttributeError log floods
* **logging:** skip model log handlers on fixture/raw loads so admin database restore is not interrupted

## Documentation

* **admin:** admin portal guides for site, moderation, processing, people, integrations, and site upgrade
* **ops:** Docker upgrade checklist and maintenance backup notes (#1562, #1564)
* **meta:** AI disclosure attestation on pull request and issue templates (#1640)
* **settings:** catalog and deploy notes for logging and trusted reverse-proxy settings

## Refactors

* **admin:** statistics calculation and admin import organization cleanups
