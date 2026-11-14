---
id: editor-moderate-comment
role: editor
audience: operator
goal: Find a comment in Manage comments and delete it
duration: 4m
viewport: 1280x800
preconditions:
  - Signed in as an editor
  - One media item has a comment that breaks the rules
related_tests:
  - tests/api/test_api_manage.py::ManageApisAccessTest::test_editors_managers_and_admins_can_list_every_manage_api
  - tests/api/test_api_manage.py::ManageCommentsTest::test_lists_comments_on_any_media_including_private
  - tests/api/test_api_manage.py::ManageCommentsTest::test_editors_bulk_delete_comments
  - tests/api/test_api_comments.py::MediaCommentDeleteTest::test_editors_managers_and_admins_delete_any_comment
  - frontend/tests/components/management-table/ManageItem/ManageItems.test.tsx
---

# Find a comment in Manage comments and delete it

Related guides: [Manage media and comments](../guides/operator/manage-media.md), [Comments and mentions](../guides/user/comments.md), [Editor role](../roles/editor.md)

## Before you start

1. Open the portal in a desktop browser at 1280 by 800.
2. Sign in as an editor.

## Steps

1. Open the menu on the left side of the page.
2. Select **Manage comments**.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The Manage comments table. The newest comment is first. Each row has the buttons View media and Delete.">
  <figcaption>The Manage comments table. The newest comment is first. Each row has the buttons View media and Delete.</figcaption>
</figure>

3. Select **View media** in the row of the comment. Read the comment in context.
4. Go back to **Manage comments**.
5. Select **Delete** in the row of the comment.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The delete confirmation window. The window asks to confirm the removal of one comment. The button PROCEED is visible.">
  <figcaption>The delete confirmation window. The window asks to confirm the removal of one comment. The button PROCEED is visible.</figcaption>
</figure>

6. Select **PROCEED**.

## Expected result

The row leaves the table. The comment no longer shows on the media page. The comment of an editor needs no extra role.

## If this fails

- If you do not see **Manage comments**, your account is not an editor.
- If you want to remove several comments, select the rows. Select **Bulk actions**, then **Delete selected**, then **Apply**.
- A regular user cannot bulk delete comments. The portal refuses the request.
- To stop new comments on one media item, clear **Enable comments** on its **Metadata** tab.
