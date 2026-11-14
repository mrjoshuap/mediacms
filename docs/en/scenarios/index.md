# Scenarios

A scenario follows one role through one path. Use a scenario as a script for a recording or as a manual test. Each scenario lists the automated tests that cover the same path.

Every step that changes the picture has a screenshot placeholder. Replace the placeholder with a recorded image. Keep the caption as the alt text.

To write a new scenario, use the [scenario template](../contributing/scenario-template.md). Run `python scripts/check_doc_scenarios.py` before you commit.

## Anonymous

| Scenario | Goal |
|----------|------|
| [Anonymous browse](anonymous-browse.md) | Browse the home page and play one public video without signing in |
| [Anonymous sign-in required](anonymous-signin-required.md) | Open a page on a portal that requires sign-in and return to that page after sign-in |

## Pending

| Scenario | Goal |
|----------|------|
| [Pending browse](pending-browse.md) | Sign in with an account that is not approved and browse media as a read-only user |
| [Pending upload refused](pending-upload-refused.md) | Try to upload media with an account that is not approved and see that the portal refuses |

## Viewer

| Scenario | Goal |
|----------|------|
| [Viewer upload](viewer-upload.md) | Upload one video and change its title |
| [Viewer comment](viewer-comment.md) | Add one comment to a public video |
| [Viewer playlist](viewer-playlist.md) | Create a playlist from a media page and find it in My playlists |
| [Viewer share](viewer-share.md) | Copy a share link that starts at a chosen time in a video |

## Editor

| Scenario | Goal |
|----------|------|
| [Editor review](editor-review.md) | Find media that is not reviewed and mark it as reviewed |
| [Editor moderate comment](editor-moderate-comment.md) | Find a comment in Manage comments and delete it |

## Manager

| Scenario | Goal |
|----------|------|
| [Manager approve user](manager-approve-user.md) | Find a user who waits for approval and approve the account |
| [Manager assign editor](manager-assign-editor.md) | Give the Editor role to a viewer so that the user can open Manage media |
| [Manager admin refused](manager-admin-refused.md) | Try to open the admin portal as a manager and see that the portal refuses |

## Staff

| Scenario | Goal |
|----------|------|
| [Staff dashboard](staff-dashboard.md) | Open the admin portal dashboard and open one overview page from a card |
| [Staff processing queue](staff-processing-queue.md) | Check the encoding queue and open the list of failed encodings |

## Superuser

| Scenario | Goal |
|----------|------|
| [Superuser mark reviewed](superuser-mark-reviewed.md) | Mark selected media as reviewed with the Needs review list in the admin portal |
| [Superuser health](superuser-health.md) | Read the Health page and find the cause of one warning |
| [Superuser content migration](superuser-content-migration.md) | Create a content migration draft for a source platform and test the connection |
| [Superuser upgrade inventory](superuser-upgrade-inventory.md) | Run the upgrade_site inventory command and confirm that the migrations fast-forward |

## Related pages

- [Roles](../roles/index.md)
- [Compare roles](../roles/compare.md)
- [Guides](../guides/index.md)
