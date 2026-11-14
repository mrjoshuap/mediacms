---
id: anonymous-browse
role: anonymous
audience: user
goal: Browse the home page and play one public video without signing in
duration: 3m
viewport: 1280x800
preconditions:
  - The portal has at least one public video that is listable
  - GLOBAL_LOGIN_REQUIRED is False
  - The browser has no signed-in session
related_tests:
  - tests/pages/test_pages_index.py::IndexPageLinksTest::test_anonymous_user_gets_public_links_and_sign_in
  - tests/pages/test_pages_media.py::MediaListingPagesTest::test_listing_pages_render_for_anonymous_users
  - tests/pages/test_pages_media.py::MediaPageAccessTest::test_anonymous_user_sees_the_media_page_without_edit_rights
  - tests/api/test_media_auth.py::MediaAuthTest::test_public_media_allowed_for_anonymous
---

# Browse the home page and play one public video without signing in

Related guides: [Browse and play](../guides/user/browse.md), [Search](../guides/user/search.md), [Anonymous role](../roles/anonymous.md)

## Before you start

1. Open the portal in a desktop browser at 1280 by 800.
2. Make sure that you are not signed in. The header must show **Sign in**.

## Steps

1. Open the portal address.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The home page for a visitor who is not signed in. The header shows Sign in. The list shows public videos.">
  <figcaption>The home page for a visitor who is not signed in. The header shows Sign in. The list shows public videos.</figcaption>
</figure>

2. Open the menu on the left side of the page.
3. Select **Latest**.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The Latest page. The menu item Latest is selected. The first row is a public video.">
  <figcaption>The Latest page. The menu item Latest is selected. The first row is a public video.</figcaption>
</figure>

4. Select the first video.
5. Select the play button on the player.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The media page of a public video. The player is playing. The SAVE button is visible but no Edit button is visible.">
  <figcaption>The media page of a public video. The player is playing. The SAVE button is visible but no Edit button is visible.</figcaption>
</figure>

## Expected result

The video plays. The page shows no **EDIT** button and no **My media** item. The header still shows **Sign in**.

## If this fails

- If the portal shows the sign-in page first, `GLOBAL_LOGIN_REQUIRED` is `True`. See [Anonymous sign-in required](anonymous-signin-required.md).
- If the list is empty, no media is listable. The media must be public, encoded, and reviewed.
- If the video does not play, check the encoding status. See [Browse and play](../guides/user/browse.md).
