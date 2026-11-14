---
id: manager-approve-user
role: manager
audience: operator
goal: Find a user who waits for approval and approve the account
duration: 4m
viewport: 1280x800
preconditions:
  - Signed in as a manager
  - USERS_NEEDS_TO_BE_APPROVED is True
  - One user account exists with is_approved set to False
related_tests:
  - tests/users/test_users_approval.py::ApprovalFlowTest::test_manager_approval_lets_the_user_in
  - tests/users/test_users_approval.py::ApprovalFlowTest::test_manager_can_filter_users_by_approval_state
  - tests/users/test_users_approval.py::ApprovalFlowTest::test_manager_disapproval_locks_the_user_out_again
  - tests/api/test_api_manage.py::ManageUsersTest::test_filters_by_approval_when_approval_is_required
---

# Find a user who waits for approval and approve the account

Related guides: [Manage users](../guides/operator/manage-users.md), [Pending approval role](../roles/pending.md), [Manager role](../roles/manager.md)

## Before you start

1. Open the portal in a desktop browser at 1280 by 800.
2. Sign in as a manager.

## Steps

1. Open the menu on the left side of the page.
2. Select **Manage users**.
3. Select **Filters**.
4. Under **APPROVED**, select **No**.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The Manage users table. The filter APPROVED is set to No. The first row is a user who waits for approval.">
  <figcaption>The Manage users table. The filter APPROVED is set to No. The first row is a user who waits for approval.</figcaption>
</figure>

5. Select **Approve** in the row of the user.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The approval confirmation window. The window names the user. The button PROCEED is visible.">
  <figcaption>The approval confirmation window. The window names the user. The button PROCEED is visible.</figcaption>
</figure>

6. Select **PROCEED**.

## Expected result

The row shows the approved mark. The filter **APPROVED: No** no longer lists the user.

The user can now upload and change own media when the other settings allow it.

## If this fails

- If you do not see **Manage users**, your account is not a manager. Editors cannot open this page.
- If you do not see the filter **APPROVED**, `USERS_NEEDS_TO_BE_APPROVED` is `False`.
- To lock a user out again, select **Disapprove** in the row of the user.
- To see how a pending user sees the portal, read [Pending upload refused](pending-upload-refused.md).
