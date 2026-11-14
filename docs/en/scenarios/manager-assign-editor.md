---
id: manager-assign-editor
role: manager
audience: operator
goal: Give the Editor role to a viewer so that the user can open Manage media
duration: 4m
viewport: 1280x800
preconditions:
  - Signed in as a manager
  - One approved viewer account exists
related_tests:
  - tests/settings/test_user_roles_settings.py::ManagerPrivilegesTest::test_promotes_a_user_to_editor_who_then_gains_editor_powers
  - tests/settings/test_user_roles_settings.py::ManagerPrivilegesTest::test_demotes_an_editor
  - tests/settings/test_user_roles_settings.py::EditorPrivilegesTest::test_cannot_promote_themselves
  - tests/users/test_users_pages.py::EditUserPageTest::test_manager_gets_the_edit_form_of_another_user_with_role_fields
---

# Give the Editor role to a viewer so that the user can open Manage media

Related guides: [Manage users](../guides/operator/manage-users.md), [Permissions](../guides/operator/permissions.md), [Manager role](../roles/manager.md)

## Before you start

1. Open the portal in a desktop browser at 1280 by 800.
2. Sign in as a manager.

## Steps

1. Open the menu on the left side of the page.
2. Select **Manage users**.
3. Select the name of the viewer. The profile page opens.
4. Select the edit icon (**Edit profile**).

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The edit form of another user. The role check boxes MediaCMS Editor and MediaCMS Manager are visible and clear.">
  <figcaption>The edit form of another user. The role check boxes MediaCMS Editor and MediaCMS Manager are visible and clear.</figcaption>
</figure>

5. Select the check box **MediaCMS Editor**.
6. Select **Update Profile**.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The profile page of the user after the update. A confirmation message is visible. The Editor role is shown on the profile.">
  <figcaption>The profile page of the user after the update. A confirmation message is visible. The Editor role is shown on the profile.</figcaption>
</figure>

## Expected result

The user is now an editor. On the next sign-in, the user sees **Manage media** and **Manage comments**. The user does not see **Manage users**.

## If this fails

- If you do not see the role check boxes, you are not a manager. An editor cannot give roles, not even to self.
- If the user does not see **Manage media**, ask the user to refresh the page or sign in again.
- To remove the role, clear **MediaCMS Editor** and select **Update Profile**.
- Give the lowest role that does the job. Do not select **MediaCMS Manager** unless the user must manage users.
