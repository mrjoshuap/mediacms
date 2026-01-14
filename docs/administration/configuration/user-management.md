# User Management Configuration

Configure user registration, permissions, and roles.

## Who Can Add Media

Control who can upload media:

```python
CAN_ADD_MEDIA = "all"           # All registered users (default)
CAN_ADD_MEDIA = "email_verified"  # Only email-verified users
CAN_ADD_MEDIA = "advancedUser"     # Only advanced users
```

## Who Can Comment

Control who can add comments:

```python
CAN_COMMENT = "all"           # All registered users (default)
CAN_COMMENT = "email_verified"  # Only email-verified users
CAN_COMMENT = "advancedUser"     # Only advanced users
```

## Who Can See Members Page

Control access to the members listing page:

```python
CAN_SEE_MEMBERS_PAGE = "all"     # All users (default)
CAN_SEE_MEMBERS_PAGE = "editors" # Only editors
CAN_SEE_MEMBERS_PAGE = "admins"  # Only admins
```

## Anonymous User Listing

Control whether anonymous users can list all users:

```python
ALLOW_ANONYMOUS_USER_LISTING = True   # Allow (default)
ALLOW_ANONYMOUS_USER_LISTING = False  # Restrict to authenticated users
```

## User Search Fields

Configure which fields are searched when looking up users:

```python
USER_SEARCH_FIELD = "name_username"         # Default: name and username
USER_SEARCH_FIELD = "name_username_email"    # Include email addresses
```

When set to `"name_username_email"`:
- User search matches email addresses
- Email displayed in UI
- Useful for administrative interfaces

## User Upload Limits

Limit the number of media files each user can upload:

```python
NUMBER_OF_MEDIA_USER_CAN_UPLOAD = 100  # Default: 100 media items
```

Set to a lower number to limit uploads:

```python
NUMBER_OF_MEDIA_USER_CAN_UPLOAD = 10
```

## User Roles

MediaCMS has several user roles:

- **Regular User**: Basic user, can upload and manage own media
- **Advanced User**: Additional capabilities (configurable)
- **MediaCMS Editor**: Can edit and review content across platform
- **MediaCMS Manager**: Full management capabilities
- **Admin**: Complete system access

### Making Users Advanced

1. Log in as admin
2. Navigate to user management
3. Edit user profile
4. Check "Advanced User" checkbox
5. Save

## Media Review Workflow

Require media to be reviewed before appearing in listings:

```python
MEDIA_IS_REVIEWED = False  # Require review
MEDIA_IS_REVIEWED = True   # No review required (default)
```

When enabled:
- Uploaded media is private until reviewed
- Editors, managers, and admins can review
- Review option appears in media edit page

## Reported Media

Automatically hide media after being reported multiple times:

```python
REPORTED_TIMES_THRESHOLD = 2  # Hide after 2 reports
```

When threshold is reached:
- Media becomes private
- Email sent to admins
- Media removed from public listings

## User Approval

Require administrator approval for new users:

```python
USERS_NEEDS_TO_BE_APPROVED = True
```

When enabled:
- Users cannot log in until approved
- Admins approve via:
  - Django admin panel
  - User management page
  - User profile edit page

## Next Steps

- [Media Settings](media-settings.md) - Configure media uploads
- [RBAC Guide](../authentication/rbac.md) - Role-Based Access Control
- [Advanced Configuration](advanced-configuration.md) - Advanced options
