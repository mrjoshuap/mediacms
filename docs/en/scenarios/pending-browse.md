---
id: pending-browse
role: pending
audience: user
goal: Sign in with an account that is not approved and browse media as a read-only user
duration: 3m
viewport: 1280x800
preconditions:
  - USERS_NEEDS_TO_BE_APPROVED is True
  - A user account exists with is_approved set to False
  - The portal has at least one public video that is listable
related_tests:
  - tests/users/test_users_approval.py::ApprovalFlowTest::test_unapproved_user_can_read_the_site_after_login
  - tests/users/test_users_approval.py::ApprovalMiddlewareUnitTest::test_unapproved_user_can_open_public_pages_and_read_the_api
  - tests/users/test_users_approval.py::ApprovalMiddlewareUnitTest::test_unapproved_user_may_view_approval_page_and_logout
  - tests/users/test_users_approval.py::ApprovalFlowTest::test_unapproved_user_can_still_log_out
---

# Sign in with an account that is not approved and browse media as a read-only user

Related guides: [Browse and play](../guides/user/browse.md), [Pending approval role](../roles/pending.md)

## Before you start

1. Open the portal in a desktop browser at 1280 by 800.
2. Keep the user name and password of the pending account ready.

## Steps

1. Open the sign-in page.
2. Enter the user name and the password of the pending account.
3. Select **Sign in**.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The home page after sign-in of a pending user. The header shows the user name. The list shows public videos.">
  <figcaption>The home page after sign-in of a pending user. The header shows the user name. The list shows public videos.</figcaption>
</figure>

4. Open the menu on the left side of the page.
5. Select **Featured**.
6. Select a video and play it.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The media page of a public video. The player is playing. The comments area is visible.">
  <figcaption>The media page of a public video. The player is playing. The comments area is visible.</figcaption>
</figure>

7. Open the address `/approval_required/`.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The page Account Pending Approval. The text says that the account waits for approval. A Logout link is visible.">
  <figcaption>The page Account Pending Approval. The text says that the account waits for approval. A Logout link is visible.</figcaption>
</figure>

## Expected result

Sign-in works. The pending user can browse lists, play public media, and read comments. The portal does not block these pages.

The pending user can select **Logout** at any time.

## If this fails

- If you cannot sign in, check the user name and the password. Check that the account is active.
- If the portal gives full access, `USERS_NEEDS_TO_BE_APPROVED` is `False` or the user is already approved.
- To leave the pending state, a manager must approve the account. See [Manager approve user](manager-approve-user.md).
