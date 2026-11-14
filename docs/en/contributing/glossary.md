# Glossary

Use these words in every guide.

| Term | Meaning |
|------|---------|
| media | One uploaded video, audio, image, or PDF item |
| playlist | An ordered list of media |
| category | A group label for media |
| tag | A free keyword on media |
| public | Media state that can appear in listings when listable |
| private | Media state limited to the owner and people with access |
| unlisted | Media state reachable by URL, not shown in public listings |
| listable | Media is public, encoding succeeded, and it is reviewed |
| anonymous user | A visitor who is not signed in |
| pending user | A signed-in user waiting for approval |
| viewer | A signed-in user without editor, manager, staff, or superuser powers |
| editor | A portal editor (`is_editor`). Can open Manage media and comments |
| manager | A portal manager (`is_manager`). Can manage users. Not Django staff by itself |
| staff | Django `is_staff`. Opens the admin portal |
| superuser | Django `is_superuser`. Full portal and admin portal access |
| Manage pages | `/manage/media`, `/manage/users`, `/manage/comments` |
| admin portal | Django Jazzmin UI at `/admin/` |
| content migration | Import media from another platform into MediaCMS |
| site upgrade | Move an existing MediaCMS install to a new MediaCMS version |
| RBAC | Category groups with member, contributor, and manager roles |
| MediaPermission | Direct share on one media item: viewer, editor, or owner |
| encoding | Transcoding a video into profiles and HLS |
| reviewed | An editor or manager marked the media as reviewed |
