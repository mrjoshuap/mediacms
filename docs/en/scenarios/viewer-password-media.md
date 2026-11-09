---
id: viewer-password-media
role: viewer
audience: user
goal: Open password-protected unlisted media with the correct password
duration: 5m
viewport: 1280x800
preconditions:
  - Signed in as a viewer who owns or can edit the media
  - A second browser session without unlock state
related_tests:
  - tests/api/test_media_password.py
---

# Open password-protected unlisted media with the correct password

Related guides: [Permissions and access](../guides/operator/permissions.md), [Review and publish](../guides/operator/review.md)

## Before you start

1. Open the portal in a desktop browser at 1280 by 800.
2. Sign in as a viewer who can edit the media.

## Steps

1. Open a media item that you own.
2. Select **EDIT**.
3. Open the **Publish** tab.
4. Set **State** to **Unlisted**.
5. Enter a password under **Password protection**.
6. Select **Publish Media**.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The Publish tab. State is Unlisted. The Password protection field has a value. The button Publish Media is visible.">
  <figcaption>The Publish tab. State is Unlisted. The Password protection field has a value. The button Publish Media is visible.</figcaption>
</figure>

7. Copy the media page link.
8. Open a private or second browser session that is not unlocked for this media.
9. Paste the link and open the media page.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The media page password form. The heading says Password required. The Password field is empty. The button Unlock is visible.">
  <figcaption>The media page password form. The heading says Password required. The Password field is empty. The button Unlock is visible.</figcaption>
</figure>

10. Enter the wrong password. Select **Unlock**.
11. Enter the correct password. Select **Unlock**.

## Expected result

The wrong password shows an error and keeps the form. The correct password loads the media player in that browser session. A later visit in the same session does not ask again until the session ends.

## If this fails

- If the page says the media is private, change the state to **Unlisted** or **Public** first.
- If you never see the password form, the media has no password, or you open it as the owner or an editor.
- If unlock always fails, set a new password on the **Publish** tab and try again.
