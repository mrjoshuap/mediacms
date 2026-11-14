---
id: pending-upload-refused
role: pending
audience: user
goal: Try to upload media with an account that is not approved and see that the portal refuses
duration: 3m
viewport: 1280x800
preconditions:
  - USERS_NEEDS_TO_BE_APPROVED is True
  - A user account exists with is_approved set to False
  - Signed in as that pending user
related_tests:
  - tests/users/test_users_approval.py::ApprovalApiAuthenticationTest::test_an_unapproved_user_cannot_upload_through_the_api_with_a_token
  - tests/users/test_users_approval.py::ApprovalApiAuthenticationTest::test_null_approval_and_an_unapproved_editor_cannot_change_the_library
  - tests/users/test_users_approval.py::ApprovalApiAuthenticationTest::test_unapproved_users_are_let_in_when_approval_is_not_required
---

# Try to upload media with an account that is not approved and see that the portal refuses

Related guides: [Upload](../guides/user/upload.md), [Manage users](../guides/operator/manage-users.md), [Pending approval role](../roles/pending.md)

## Before you start

1. Open the portal in a desktop browser at 1280 by 800.
2. Sign in as the pending user.
3. Keep a small video file ready.

## Steps

1. Open the address `/upload`.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The home page after the redirect from the Upload page. The header shows the name of the pending user. No upload form is visible.">
  <figcaption>The home page after the redirect from the Upload page. The header shows the name of the pending user. No upload form is visible.</figcaption>
</figure>

2. Open the address `/manage/media`.
3. Check the page that opens.

## Expected result

The portal sends the pending user back to the home page each time. No upload form opens. The portal refuses a write request to the API with the status 403. No media is created.

The same limit applies to a pending editor. The approval check comes before the role check.

## If this fails

- If the upload form opens, the user is approved, or `USERS_NEEDS_TO_BE_APPROVED` is `False`. With approval off, the portal accepts the upload.
- If the form opens but shows a message that you cannot add media, a different setting limits uploads. Check `CAN_ADD_MEDIA` and the upload limit.
- To remove the limit, a manager must approve the account. See [Manager approve user](manager-approve-user.md).
