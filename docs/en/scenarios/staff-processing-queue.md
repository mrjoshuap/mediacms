---
id: staff-processing-queue
role: staff
audience: admin
goal: Check the encoding queue and open the list of failed encodings
duration: 4m
viewport: 1280x800
preconditions:
  - Signed in as a staff user with the model permissions for the files app
  - At least one video is in the encoding queue or has a failed encoding
related_tests:
  - tests/admin/test_admin_smoke.py::AdminAppListTest::test_moderation_and_processing_include_queue_links
  - tests/admin/test_status_health.py::ProcessingStatusMetricsTest::test_status_groups_count_each_pipeline_status
  - tests/admin/test_status_health.py::ProcessingStatusMetricsTest::test_processing_overview_links_each_status
  - tests/admin/test_status_health.py::StatusHealthChecksTest::test_failure_statuses_warn_and_link_to_filtered_changelists
---

# Check the encoding queue and open the list of failed encodings

Related guides: [Processing](../guides/admin/processing.md), [Admin portal map](../guides/admin/portal-map.md), [Staff role](../roles/staff.md)

## Before you start

1. Open the portal in a desktop browser at 1280 by 800.
2. Sign in as a staff user.

## Steps

1. Open the address `/admin/`.
2. In the sidebar, open the group **Processing**.
3. Select **Overview**.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The Processing overview page. The card Encodings shows the counts Pending, Running, Success, and Failed. Each card has an Open link.">
  <figcaption>The Processing overview page. The card Encodings shows the counts Pending, Running, Success, and Failed. Each card has an Open link.</figcaption>
</figure>

4. Select **Encoding queue** in the sidebar.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The media list with the filter for the encoding queue. Each row is a video that waits to be encoded or is encoding.">
  <figcaption>The media list with the filter for the encoding queue. Each row is a video that waits to be encoded or is encoding.</figcaption>
</figure>

5. Select **Failed encodings** in the sidebar.
6. Open the first media row. Read the encoding logs.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The media list with the filter for failed encodings. The first row is a video with the encoding status fail.">
  <figcaption>The media list with the filter for failed encodings. The first row is a video with the encoding status fail.</figcaption>
</figure>

## Expected result

The overview shows the count of media for each encoding status. **Encoding queue** lists the media that wait. **Failed encodings** lists the media with the status fail.

The list is empty when no media is in that state.

## If this fails

- If **Encoding queue** or **Failed encodings** is missing, your account has no permission for media. An administrator must give you the permission.
- If media stays in the queue, check that a Celery worker runs and uses the same file system as the web server.
- To retry, use **Generate missing encodings** or **Force re-encode** in the **Action** list of the media list. See [Processing](../guides/admin/processing.md).
