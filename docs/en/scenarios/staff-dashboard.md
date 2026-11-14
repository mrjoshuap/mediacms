---
id: staff-dashboard
role: staff
audience: admin
goal: Open the admin portal dashboard and open one overview page from a card
duration: 3m
viewport: 1280x800
preconditions:
  - Signed in as a staff user with the model permissions for the files and users apps
  - The staff user is not an editor, a manager, or a superuser
related_tests:
  - tests/admin/test_admin_dashboard_stats.py::DashboardIndexOrderTest::test_admin_index_is_slim_health_overview
  - tests/admin/test_admin_dashboard_stats.py::DashboardIndexOrderTest::test_dashboard_section_pages_keep_detailed_tables
  - tests/admin/test_admin_smoke.py::AdminAccessTest::test_staff_without_permissions_cannot_open_changelists
  - tests/admin/test_admin_smoke.py::AdminAccessTest::test_non_staff_user_is_sent_to_admin_login
---

# Open the admin portal dashboard and open one overview page from a card

Related guides: [Admin portal map](../guides/admin/portal-map.md), [Moderation](../guides/admin/moderation.md), [Staff role](../roles/staff.md)

## Before you start

1. Open the portal in a desktop browser at 1280 by 800.
2. Sign in as a staff user.

## Steps

1. Open the address `/admin/`.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The admin portal dashboard. The cards show Reported media, Failed encodings, Encoding queue, and Site check warnings. The sidebar shows six groups.">
  <figcaption>The admin portal dashboard. The cards show Reported media, Failed encodings, Encoding queue, and Site check warnings. The sidebar shows six groups.</figcaption>
</figure>

2. Select **Refresh stats**. The numbers come from a cache that lasts 60 seconds.
3. Select the **Open** link on the card **Reported media**.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The Moderation overview page. The page shows the parts Media approval and Reports. Each card has an Open link.">
  <figcaption>The Moderation overview page. The page shows the parts Media approval and Reports. Each card has an Open link.</figcaption>
</figure>

## Expected result

The dashboard shows the health summary and the links to the overview pages. The overview page shows the detailed tables for its group.

The staff user does not see **Manage media**, **Manage users**, or **Manage comments** in the portal menu.

## If this fails

- If the portal asks you to sign in to the admin portal, your account is not staff.
- If a table shows the error 403, an administrator did not give your account the model permission for that table.
- If you need the Manage pages, a manager must also give you the Editor role.
- If a number looks old, select **Refresh stats**.
