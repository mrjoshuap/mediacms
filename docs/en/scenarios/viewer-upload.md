---
id: viewer-upload
role: viewer
audience: user
goal: Upload one video and change its title
duration: 5m
viewport: 1280x800
preconditions:
  - Signed in as a viewer who may upload
  - CAN_ADD_MEDIA is all
  - PORTAL_WORKFLOW is public
  - A small video file is ready on the computer
related_tests:
  - tests/api/test_api_media_upload_search.py::MediaUploadTest::test_authenticated_user_uploads_an_image
  - tests/api/test_api_media_upload_search.py::MediaUploadTest::test_title_defaults_to_the_file_name
  - tests/pages/test_pages_editors.py::UploadAndRecordPagesTest::test_logged_in_user_may_upload_when_open_to_all
  - tests/api/test_new_media.py::TestX::test_file_upload
  - tests/api/test_api_permissions.py::IsAuthorizedToAddTest::test_any_user_may_add_by_default
---

# Upload one video and change its title

Related guides: [Upload](../guides/user/upload.md), [Edit your media](../guides/user/edit.md), [Viewer role](../roles/viewer.md)

## Before you start

1. Open the portal in a desktop browser at 1280 by 800.
2. Sign in as a viewer.

## Steps

1. Select **Upload media** at the top of the page.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The Upload media page. The drop area shows the button Browse your files.">
  <figcaption>The Upload media page. The drop area shows the button Browse your files.</figcaption>
</figure>

2. Select **Browse your files**.
3. Select the video file in the file dialog.
4. Wait until the progress bar is complete.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The Upload media page after the upload. The progress bar is full. The button View media is visible.">
  <figcaption>The Upload media page after the upload. The progress bar is full. The button View media is visible.</figcaption>
</figure>

5. Select **View media**.
6. Select **EDIT**.
7. Enter a new title in the field **Title**.
8. Select **Update Media**.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The edit page of the new media. The field Title shows the new title. A confirmation message is visible.">
  <figcaption>The edit page of the new media. The field Title shows the new title. A confirmation message is visible.</figcaption>
</figure>

## Expected result

The media page shows the new title. The media is in **My media**.

The media becomes listable after encoding succeeds. Until then, only you can find it.

## If this fails

- If **Upload media** is not available, `CAN_ADD_MEDIA` limits uploads to advanced users or verified email addresses. Read the message on the page.
- If the portal refuses the upload, you have reached the upload limit, or the account is pending. See [Pending upload refused](pending-upload-refused.md).
- If the media is not in the public lists, check `PORTAL_WORKFLOW`, the encoding status, and `MEDIA_IS_REVIEWED`. See [Editor review](editor-review.md).
