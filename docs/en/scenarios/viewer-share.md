---
id: viewer-share
role: viewer
audience: user
goal: Copy a share link that starts at a chosen time in a video
duration: 3m
viewport: 1280x800
preconditions:
  - Signed in as a viewer
  - The portal has a public video that is listable
related_tests:
  - frontend/tests/components/media-actions/MediaShareOptions.test.tsx
  - frontend/tests/components/media-actions/MediaShareEmbed.test.tsx
  - tests/pages/test_pages_media.py::EmbedPageTest::test_embed_renders_the_player_page_for_the_media
  - tests/pages/test_pages_media.py::MediaModelVisibilityOnPagesTest::test_unlisted_media_page_is_reachable_by_link
---

# Copy a share link that starts at a chosen time in a video

Related guides: [Share and embed](../guides/user/share.md), [Viewer role](../roles/viewer.md)

## Before you start

1. Open the portal in a desktop browser at 1280 by 800.
2. Sign in as a viewer.

## Steps

1. Open a public video.
2. Play the video. Pause at the time that you want.
3. Select **SHARE**.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The window Share media. The check box Start at shows the paused time. The button COPY is visible.">
  <figcaption>The window Share media. The check box Start at shows the paused time. The button COPY is visible.</figcaption>
</figure>

4. Select the check box **Start at**.
5. Select **COPY**.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The window Share media after COPY. The check box Start at is selected. A message says that the link is copied.">
  <figcaption>The window Share media after COPY. The check box Start at is selected. A message says that the link is copied.</figcaption>
</figure>

6. Open a new browser tab.
7. Paste the link in the address bar. Press **Enter**.

## Expected result

The media page opens. The link has the parameter `t` with the time in seconds. The player starts at the chosen time.

## If this fails

- If **SHARE** is not visible, the portal owner turned the control off.
- If **Embed** is not in the list, the media is not a video or an audio file.
- If another person cannot open the link, the media is private. A link does not give access to private media. See [Share and embed](../guides/user/share.md).
