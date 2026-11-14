---
id: superuser-health
role: superuser
audience: admin
goal: Read the Health page and find the cause of one warning
duration: 5m
viewport: 1280x800
preconditions:
  - Signed in as a superuser
  - At least one health check shows a warning or a failure
related_tests:
  - tests/admin/test_admin_dashboard_stats.py::DashboardStatisticsTest::test_site_health_checks_compare_site_and_portal_settings
  - tests/admin/test_admin_dashboard_stats.py::DashboardStatisticsTest::test_site_health_checks_sorted_by_severity
  - tests/admin/test_admin_dashboard_stats.py::DashboardIndexOrderTest::test_health_check_table_opens_for_a_warning
  - tests/admin/test_admin_dashboard_stats.py::DashboardIndexOrderTest::test_health_check_table_opens_for_a_failure
  - tests/admin/test_status_health.py::StatusHealthChecksTest::test_failure_statuses_warn_and_link_to_filtered_changelists
  - tests/admin/test_deployment_health.py::DeploymentHealthTests::test_https_production_gaps_warn
---

# Read the Health page and find the cause of one warning

Related guides: [Site health and database](../guides/admin/site.md), [Processing](../guides/admin/processing.md), [Superuser role](../roles/superuser.md)

## Before you start

1. Open the portal in a desktop browser at 1280 by 800.
2. Sign in as a superuser.

## Steps

1. Open the address `/admin/dashboard/health/`.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The Health page. The counters Passing checks, Warnings, Failures, and Info checks are at the top. The Health checks table is below.">
  <figcaption>The Health page. The counters Passing checks, Warnings, Failures, and Info checks are at the top. The Health checks table is below.</figcaption>
</figure>

2. Read the **Failures** counter. Fix failures first.
3. Open the table **Health checks**.
4. Find a row with the status Warning.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The Health checks table. One row has the status Warning. The check name in that row is a link.">
  <figcaption>The Health checks table. One row has the status Warning. The check name in that row is a link.</figcaption>
</figure>

5. Select the check name. The filtered list opens.
6. Fix the problem. Use the guide for that area.
7. Go back to the **Health** page. Select **Refresh stats**.

## Expected result

The check that you fixed now shows OK. The **Warnings** counter is lower by one.

## If this fails

- If the number does not change, the page uses a cache for 60 seconds. Select **Refresh stats** again.
- If a reverse-proxy check shows a warning, check `FRONTEND_HOST`, `ALLOWED_HOSTS`, and the proxy settings. Local and `DEBUG` installs show these gaps as **Info**.
- If a storage check fails, the portal cannot write in the directory. Check the owner and the permissions of the directory.
- Settings changes need a restart. See the [Settings catalog](../guides/admin/settings.md).
