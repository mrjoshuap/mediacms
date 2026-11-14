---
id: viewer-comment
role: viewer
audience: user
goal: Add one comment to a public video
duration: 3m
viewport: 1280x800
preconditions:
  - Signed in as a viewer
  - CAN_COMMENT is all
  - Comments are on for the video
  - The portal has a public video that is listable
related_tests:
  - tests/api/test_api_comments.py::MediaCommentCreateTest::test_user_comments_and_media_owner_is_notified
  - tests/api/test_api_comments.py::MediaCommentCreateTest::test_empty_comment_is_rejected
  - tests/api/test_api_comments.py::MediaCommentCreateTest::test_commenting_is_refused_where_comments_are_disabled
  - tests/api/test_api_permissions.py::UserAllowedToCommentTest::test_everyone_logged_in_may_comment_by_default
  - frontend/tests/components/comments/Comments.test.tsx
---

# Add one comment to a public video

Related guides: [Comments and mentions](../guides/user/comments.md), [Viewer role](../roles/viewer.md)

## Before you start

1. Open the portal in a desktop browser at 1280 by 800.
2. Sign in as a viewer.

## Steps

1. Open a public video.
2. Scroll to the comments area.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The comments area of a media page. The field Add a comment is empty. The button SUBMIT is visible.">
  <figcaption>The comments area of a media page. The field Add a comment is empty. The button SUBMIT is visible.</figcaption>
</figure>

3. Select the field **Add a comment...**.
4. Enter your text. For example, enter `Clear and short. Thank you.`
5. Select **SUBMIT**.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The comments area after submit. The new comment is first in the list. The field Add a comment is empty.">
  <figcaption>The comments area after submit. The new comment is first in the list. The field Add a comment is empty.</figcaption>
</figure>

## Expected result

The new comment shows at the top of the list. The field is empty again. The portal sends a notification to the media owner.

## If this fails

- If you see **Comments are disabled**, the owner turned comments off, or `CAN_COMMENT` limits who can comment.
- If **SUBMIT** does nothing, the text is empty. The portal does not accept a comment that has only spaces.
- If you do not see the comment field, you are not signed in. An anonymous visitor cannot comment.
- To remove a comment, see [Editor moderate comment](editor-moderate-comment.md).
