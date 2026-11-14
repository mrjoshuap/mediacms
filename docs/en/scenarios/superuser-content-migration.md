---
id: superuser-content-migration
role: superuser
audience: admin
goal: Create a content migration draft for a source platform and test the connection
duration: 6m
viewport: 1280x800
preconditions:
  - Signed in as a superuser
  - The database and the media_files directory have a backup
  - You have the connection values for one source platform, for example Kaltura
related_tests:
  - migrationservice/tests/test_api.py::TestPermissions::test_a_superuser_is_allowed
  - migrationservice/tests/test_api.py::TestPermissions::test_an_editor_is_rejected
  - migrationservice/tests/test_api.py::TestCrud::test_create
  - migrationservice/tests/test_api.py::TestCrud::test_the_secret_is_masked_on_read
  - migrationservice/tests/test_api.py::TestConnectionCheck::test_checks_an_unsaved_payload
  - migrationservice/tests/test_api.py::TestControls::test_start_moves_to_running
  - frontend/tests/utils/api/migrations.test.ts
---

# Create a content migration draft for a source platform and test the connection

Related guides: [Content migration](../guides/admin/content-migration.md), [Superuser role](../roles/superuser.md)

!!! warning
    Content migration imports media from another platform. It is not a site upgrade. For a site upgrade, read [Superuser upgrade inventory](superuser-upgrade-inventory.md).

## Before you start

1. Open the portal in a desktop browser at 1280 by 800.
2. Sign in as a superuser.
3. Back up the database and the `media_files` directory.

## Steps

1. Open **Migrations** in the top right menu. The address is `/migrations`.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The Migrations list page. The list is empty. The button New migration is visible.">
  <figcaption>The Migrations list page. The list is empty. The button New migration is visible.</figcaption>
</figure>

2. Select **New migration**.
3. Select the source **Kaltura**.
4. Enter **Service URL**, **Partner ID**, **App token ID**, and **App token value**.
5. Select **Test connection**.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The new Kaltura migration form. The connection fields are filled. The result of Test connection shows counts and the list of categories.">
  <figcaption>The new Kaltura migration form. The connection fields are filled. The result of Test connection shows counts and the list of categories.</figcaption>
</figure>

6. Select at least one top-level category.
7. Select **Save draft**.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The page of the saved migration. The status is pending. The App token value shows a mask, not the secret.">
  <figcaption>The page of the saved migration. The status is pending. The App token value shows a mask, not the secret.</figcaption>
</figure>

## Expected result

The portal saves the migration as a draft. **Test connection** reads counts and loads the choices. It imports nothing. The portal never shows the stored secret.

Nothing is imported until you select **Save and start**, or you start the draft later.

## If this fails

- If you cannot open `/migrations`, your account is not a superuser. The portal refuses editors and anonymous visitors.
- If **Test connection** reports an error, check the service URL, the partner ID, and the token. Do not add `/api_v3` to the service URL.
- If the form refuses **Save draft**, select at least one category, or fix the highlighted field.
- To control a running migration, use **Pause**, **Resume**, or **Abort**. See [Content migration](../guides/admin/content-migration.md).
