---
id: manager-admin-refused
role: manager
audience: operator
goal: Try to open the admin portal as a manager and see that the portal refuses
duration: 2m
viewport: 1280x800
preconditions:
  - Signed in as a manager who is not staff and not a superuser
related_tests:
  - tests/settings/test_user_roles_settings.py::ManagerPrivilegesTest::test_has_no_django_admin_access
  - tests/settings/test_user_roles_settings.py::AdminPrivilegesTest::test_opens_the_django_admin
  - tests/pages/test_pages_index.py::IndexPageLinksTest::test_manager_also_gets_user_management
  - tests/pages/test_pages_index.py::IndexPageLinksTest::test_django_admin_url_is_only_exposed_to_superusers
  - tests/admin/test_admin_smoke.py::AdminAccessTest::test_non_staff_user_is_sent_to_admin_login
---

# Try to open the admin portal as a manager and see that the portal refuses

Related guides: [Admin portal map](../guides/admin/portal-map.md), [Permissions](../guides/operator/permissions.md), [Manager role](../roles/manager.md)

## Before you start

1. Open the portal in a desktop browser at 1280 by 800.
2. Sign in as a manager.

## Steps

1. Open the menu on the left side of the page.
2. Check the list.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The menu of a manager. The items Manage media, Manage users, and Manage comments are visible. No admin portal link is visible.">
  <figcaption>The menu of a manager. The items Manage media, Manage users, and Manage comments are visible. No admin portal link is visible.</figcaption>
</figure>

3. Open the address `/admin/` in the browser.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The admin portal sign-in page. The page asks for a user name and a password. The manager is not signed in to the admin portal.">
  <figcaption>The admin portal sign-in page. The page asks for a user name and a password. The manager is not signed in to the admin portal.</figcaption>
</figure>

## Expected result

The menu has no link to the admin portal. The address `/admin/` opens the admin sign-in page, not the dashboard.

A manager uses the Manage pages. Only staff and superusers use the admin portal.

## If this fails

- If the dashboard opens, the account is also staff or a superuser. The setup of this scenario is not correct.
- If you must use the admin portal, ask a superuser to set the flag `is_staff` on your account.
- The manager role does not include the admin portal. The user edit form has no field for the staff flag or the superuser flag.
