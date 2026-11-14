---
id: superuser-mark-reviewed
role: superuser
audience: admin
goal: Mark selected media as reviewed with the Needs review list in the admin portal
duration: 4m
viewport: 1280x800
preconditions:
  - Signed in as a superuser
  - MEDIA_IS_REVIEWED is False
  - At least one media item is not reviewed
related_tests:
  - tests/admin/test_admin_files.py::MediaAdminTest::test_mark_as_reviewed_action
  - tests/admin/test_admin_smoke.py::AdminAppListTest::test_moderation_and_processing_include_queue_links
  - tests/admin/test_admin_dashboard_stats.py::DashboardStatisticsTest::test_moderation_stats_include_seven_day_workflow_counts
---

# Mark selected media as reviewed with the Needs review list in the admin portal

Related guides: [Moderation](../guides/admin/moderation.md), [Review and publish](../guides/operator/review.md), [Superuser role](../roles/superuser.md)

## Before you start

1. Open the portal in a desktop browser at 1280 by 800.
2. Sign in as a superuser.

## Steps

1. Open the address `/admin/`.
2. In the sidebar, open the group **Moderation**.
3. Select **Needs review**.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The Needs review media list in the admin portal. Two rows are listed. The Action list is closed.">
  <figcaption>The Needs review media list in the admin portal. Two rows are listed. The Action list is closed.</figcaption>
</figure>

4. Select the check box of each media row to approve.
5. Open the **Action** list.
6. Select **Mark as reviewed**.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The Needs review media list with two rows selected. The Action list shows Mark as reviewed. The button Go is visible.">
  <figcaption>The Needs review media list with two rows selected. The Action list shows Mark as reviewed. The button Go is visible.</figcaption>
</figure>

7. Select **Go**.

## Expected result

The portal shows a message that the media is marked as reviewed. The rows leave the **Needs review** list.

Media is listable only when it is public, its encoding succeeded, and it is reviewed.

## If this fails

- If **Needs review** is missing from the sidebar, `MEDIA_IS_REVIEWED` is `True`. New media is reviewed at once.
- If the media is still not in the public lists, check the state and the encoding status of the media.
- If you are an editor and not staff, use **Manage media**. See [Editor review](editor-review.md).
