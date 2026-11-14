---
id: editor-review
role: editor
audience: operator
goal: Find media that is not reviewed and mark it as reviewed
duration: 5m
viewport: 1280x800
preconditions:
  - Signed in as an editor
  - MEDIA_IS_REVIEWED is False
  - One uploaded video waits for review and its encoding status is success
related_tests:
  - tests/settings/test_user_roles_settings.py::EditorPrivilegesTest::test_can_open_management_pages
  - tests/settings/test_user_roles_settings.py::EditorPrivilegesTest::test_can_review_media
  - tests/settings/test_user_roles_settings.py::PlainUserCannotTouchOthersTest::test_cannot_review_media_even_their_own
  - tests/api/test_api_manage.py::ManageMediaTest::test_filters_by_review_status
  - tests/pages/test_pages_manage.py::ManagePagesAccessTest::test_editors_managers_and_admins_can_open_every_manage_page
---

# Find media that is not reviewed and mark it as reviewed

Related guides: [Review and publish](../guides/operator/review.md), [Manage media and comments](../guides/operator/manage-media.md), [Editor role](../roles/editor.md)

## Before you start

1. Open the portal in a desktop browser at 1280 by 800.
2. Sign in as an editor.

## Steps

1. Open the menu on the left side of the page.
2. Select **Manage media**.
3. Select **Filters**.
4. Under **REVIEWED**, select **No**.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The Manage media table. The filter REVIEWED is set to No. The first row is a video that waits for review.">
  <figcaption>The Manage media table. The filter REVIEWED is set to No. The first row is a video that waits for review.</figcaption>
</figure>

5. Select the title of the first video.
6. Select **EDIT**.
7. Open the **Publish** tab.
8. Select **Is reviewed**.
9. Check that **State** shows **Public**.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The Publish tab of the edit page. The check box Is reviewed is selected. The State field shows Public.">
  <figcaption>The Publish tab of the edit page. The check box Is reviewed is selected. The State field shows Public.</figcaption>
</figure>

10. Select **Publish Media**.

## Expected result

The portal shows a confirmation message. The video is now reviewed. When the state is public and encoding succeeded, the video is listable and shows in the public lists.

In **Manage media**, the filter **REVIEWED: No** no longer lists the video.

## If this fails

- If you do not see **Manage media**, your account is not an editor. A manager must give you the role.
- If the field **Is reviewed** is read-only, you are not an editor. Only editors and managers can change it.
- If the video is still not in the public lists, check **State** and **Encoding Status**. Open **More options**, then **Status info**.
- To review in the admin portal, see [Superuser mark reviewed](superuser-mark-reviewed.md).
