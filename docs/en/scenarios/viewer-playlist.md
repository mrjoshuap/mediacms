---
id: viewer-playlist
role: viewer
audience: user
goal: Create a playlist from a media page and find it in My playlists
duration: 4m
viewport: 1280x800
preconditions:
  - Signed in as a viewer who is allowed to upload
  - The portal has a public video that is listable
related_tests:
  - tests/api/test_api_playlists.py::PlaylistListTest::test_authenticated_user_creates_playlist_owned_by_them
  - tests/api/test_api_playlists.py::PlaylistEditTest::test_owner_adds_public_media
  - tests/api/test_api_playlists.py::PlaylistEditTest::test_owner_removes_media
  - frontend/tests/components/playlist-form/PlaylistCreationForm.test.tsx
  - frontend/tests/components/media-actions/MediaSaveButton.test.tsx
---

# Create a playlist from a media page and find it in My playlists

Related guides: [Playlists](../guides/user/playlists.md), [Viewer role](../roles/viewer.md)

## Before you start

1. Open the portal in a desktop browser at 1280 by 800.
2. Sign in as a viewer.

## Steps

1. Open a public video.
2. Select **SAVE**.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The window Save to. The list has no playlist yet. The link Create a new playlist is visible.">
  <figcaption>The window Save to. The list has no playlist yet. The link Create a new playlist is visible.</figcaption>
</figure>

3. Select **Create a new playlist**.
4. Enter a title in the playlist title field. For example, enter `Watch later`.
5. Select **CREATE**.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The window Save to after CREATE. The playlist Watch later is in the list. Its check box is selected.">
  <figcaption>The window Save to after CREATE. The playlist Watch later is in the list. Its check box is selected.</figcaption>
</figure>

6. Open the menu on the left side of the page.
7. Select **My playlists**.
8. Select the playlist **Watch later**.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The playlist page for Watch later. The list shows the saved video as the first item.">
  <figcaption>The playlist page for Watch later. The list shows the saved video as the first item.</figcaption>
</figure>

## Expected result

The playlist holds the video. The playlist page plays the items in order.

## If this fails

- If you cannot create a playlist, the portal does not allow your account to upload. The portal owner uses the same rule for playlists.
- If you cannot add more items, the playlist has reached the item limit.
- If a private item is missing for other people, they cannot open that item. The playlist page hides it.
