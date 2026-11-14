# Scenario template

Copy this file into `docs/en/scenarios/` and fill every field.

```markdown
---
id: role-short-name
role: viewer
audience: user
goal: Upload one video and add a title
duration: 5m
viewport: 1280x800
preconditions:
  - Signed in as a viewer who may upload
  - PORTAL_WORKFLOW allows the expected state
related_tests:
  - tests/api/test_media.py::SomeTest::test_something
# coverage: gap
---

# Title that matches the goal

Related guide: [Upload](../guides/user/upload.md)

## Before you start

1. Open the portal in a desktop browser at 1280 by 800.
2. Sign in as the role named above.

## Steps

1. Open **Upload Media**.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The header. The Upload Media button is visible on the right.">
  <figcaption>The header. The Upload Media button is visible on the right.</figcaption>
</figure>

2. Select a video file and wait until the upload finishes.

## Expected result

State what the user sees when the path succeeds.

## If this fails

List the most common blockers and the setting or role that causes them.
```

## Frontmatter

| Field | Required | Notes |
|-------|----------|-------|
| `id` | Yes | Stable slug |
| `role` | Yes | anonymous, pending, viewer, editor, manager, staff, superuser |
| `audience` | Yes | user, operator, admin, developer |
| `goal` | Yes | One sentence |
| `duration` | No | Estimate for a recording |
| `viewport` | No | Default `1280x800` |
| `preconditions` | Yes | Setup before recording |
| `related_tests` | Yes | Pytest node ids or Jest file paths. Empty only with `coverage: gap` |
| `coverage` | No | Set to `gap` when no test exists |

Run `python scripts/check_doc_scenarios.py` before you commit.
