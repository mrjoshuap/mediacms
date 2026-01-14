# Permissions Reference

Complete reference for MediaCMS permissions system.

## Permission System Overview

MediaCMS provides a flexible permission system with multiple levels:

1. **Basic Permissions**: Public, private, unlisted media
2. **Direct Permissions**: User-specific permissions
3. **Role-Based Access Control (RBAC)**: Category-based permissions

## Media States

### Public

- Visible to everyone
- Appears in search results
- Listed on category pages
- Accessible via direct link

### Unlisted

- Accessible via direct link only
- Not shown in search or listings
- Share link to allow access

### Private

- Only visible to owner
- Not accessible to others (unless permissions granted)
- Can grant specific user permissions
- RBAC can override (if enabled)

## User Roles

### Regular User

- Upload and manage own media
- Create playlists
- Comment on media
- Basic user capabilities

### Advanced User

- Additional capabilities (configurable)
- Set via `advancedUser` flag
- Can be required for certain actions

### MediaCMS Editor

- Edit and review content across platform
- Can mark media as reviewed
- Set via `is_editor` flag

### MediaCMS Manager

- Full management capabilities
- User management
- Content management
- Set via `is_manager` flag

### Admin

- Complete system access
- Django admin access
- All permissions
- Set via `is_superuser` and `is_staff` flags

## Direct Media Permissions

### Permission Levels

**Viewer**:
- Can view private media
- Read-only access

**Editor**:
- Can view and edit media metadata
- Cannot delete media

**Owner**:
- Full control
- Can delete media
- Can change permissions

### Granting Permissions

1. Edit media
2. Add users with permissions
3. Set permission level (Viewer, Editor, Owner)
4. Save

## Role-Based Access Control (RBAC)

### RBAC Roles

**Member**:
- Can view media in associated categories
- Access private media in categories
- See category listings

**Contributor**:
- All Member permissions
- Can edit media in categories
- Can publish media to categories

**Manager**:
- All Contributor permissions
- Full control over category media

### RBAC Workflow

1. Create RBAC group
2. Associate category with group
3. Add users to group with roles
4. Users inherit permissions based on role

### Permission Checking Order

1. Is media public? → Allow access
2. Is user the owner? → Allow full access
3. Does user have direct permissions? → Grant corresponding access
4. Is RBAC enabled and user in group? → Grant role-based access
5. Otherwise → Deny access

## Configuration Settings

### Enable RBAC

```python
USE_RBAC = True
```

### Control Who Can Add Media

```python
CAN_ADD_MEDIA = "all"           # All users
CAN_ADD_MEDIA = "email_verified" # Email-verified users
CAN_ADD_MEDIA = "advancedUser"   # Advanced users only
```

### Control Who Can Comment

```python
CAN_COMMENT = "all"           # All users
CAN_COMMENT = "email_verified" # Email-verified users
CAN_COMMENT = "advancedUser"   # Advanced users only
```

### Global Login Requirement

```python
GLOBAL_LOGIN_REQUIRED = True  # Require login for all content
```

## Permission Methods

### User Model Methods

```python
user.has_member_access_to_media(media)
user.has_contributor_access_to_media(media)
user.has_owner_access_to_media(media)
```

### Media Listing

Media is filtered based on permissions:
- Public media visible to all
- Private media filtered by permissions
- RBAC categories included for group members

## Best Practices

1. **Default to Private**: Consider private as default for new uploads
2. **Use Categories**: Organize media with categories
3. **RBAC for Teams**: Use RBAC for team collaboration
4. **Direct Permissions**: Use for one-off sharing
5. **Regular Reviews**: Review permissions periodically

## Troubleshooting

See [Authentication Problems](../../troubleshooting/authentication-problems.md) for permission-related issues.

## Next Steps

- [RBAC Guide](../../administration/authentication/rbac.md) - RBAC setup
- [User Management](../../administration/configuration/user-management.md) - User configuration
- [Troubleshooting](../../troubleshooting/authentication-problems.md) - Permission issues
