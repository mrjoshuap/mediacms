# Database Schema

MediaCMS database structure and relationships.

## Core Models

### Media (files_media)

Main media file model:

- `id`: Primary key
- `friendly_token`: Unique identifier for URLs
- `title`: Media title
- `description`: Media description
- `media_type`: Type (video, audio, image, pdf)
- `user`: Owner (ForeignKey to User)
- `category`: Categories (ManyToMany)
- `tags`: Tags (ManyToMany)
- `state`: Visibility state (public, unlisted, private)
- `date_added`: Creation timestamp
- `media_file`: Original file path
- `thumbnail`: Thumbnail image
- `sprites`: Sprite sheet for video previews

### User (users_user)

User account model:

- `id`: Primary key
- `username`: Unique username
- `email`: Email address
- `name`: Display name
- `is_staff`: Staff status
- `is_superuser`: Admin status
- `is_editor`: Editor status
- `is_manager`: Manager status
- `advancedUser`: Advanced user flag
- `date_added`: Registration date

### Category (files_category)

Media categories:

- `id`: Primary key
- `title`: Category name
- `description`: Category description
- `rbac_groups`: Associated RBAC groups (ManyToMany)

### Encode (files_encode)

Transcoded media versions:

- `id`: Primary key
- `media`: Related media (ForeignKey)
- `profile`: Encoding profile (ForeignKey)
- `status`: Encoding status (pending, running, success, error)
- `file`: Encoded file path
- `chunk`: Whether this is a chunk
- `resolution`: Video resolution
- `codec`: Video codec

### EncodeProfile (files_encodeprofile)

Encoding profiles:

- `id`: Primary key
- `name`: Profile name
- `resolution`: Target resolution
- `codec`: Video codec
- `active`: Whether profile is enabled

### Playlist (files_playlist)

User playlists:

- `id`: Primary key
- `title`: Playlist name
- `description`: Playlist description
- `user`: Owner (ForeignKey)
- `media`: Media items (ManyToMany)
- `state`: Visibility state

### RBACGroup (rbac_rbacgroup)

RBAC groups:

- `id`: Primary key
- `name`: Group name
- `description`: Group description
- `categories`: Associated categories (ManyToMany)

### RBACMembership (rbac_rbacmembership)

User-group memberships:

- `id`: Primary key
- `user`: User (ForeignKey)
- `group`: RBAC group (ForeignKey)
- `role`: Role (member, contributor, manager)

## Relationships

### Media Relationships

```
Media
├── User (owner)
├── Categories (ManyToMany)
├── Tags (ManyToMany)
├── Encode objects (OneToMany)
└── MediaPermission objects (OneToMany)
```

### User Relationships

```
User
├── Media (OneToMany - owned media)
├── Playlists (OneToMany)
└── RBACMemberships (OneToMany)
```

### RBAC Relationships

```
RBACGroup
├── Categories (ManyToMany)
└── Memberships (OneToMany)
    └── Users (ManyToMany through Memberships)
```

## Key Indexes

- `files_media.friendly_token`: Unique index
- `files_media.user_id`: Index for user queries
- `files_media.date_added`: Index for sorting
- `files_encode.media_id`: Index for media lookups
- `files_encode.status`: Index for queue queries

## Database Queries

### Common Queries

**Get user's media**:

```python
Media.objects.filter(user=user)
```

**Get public media**:

```python
Media.objects.filter(state='public', listable=True)
```

**Get pending encodes**:

```python
Encode.objects.filter(status='pending')
```

**Get RBAC accessible media**:

```python
# Complex query involving groups and categories
Media.objects.filter(
    category__rbac_groups__memberships__user=user
).distinct()
```

## Migrations

### Running Migrations

```bash
python manage.py migrate
```

### Creating Migrations

```bash
python manage.py makemigrations
```

### Migration Files

Migrations are in:
- `files/migrations/`
- `users/migrations/`
- `rbac/migrations/`

## Database Backups

See [Backup Guide](../../administration/maintenance/backups.md) for backup procedures.

## Next Steps

- [System Overview](system-overview.md) - Architecture overview
- [API Reference](api-reference.md) - API documentation
- [Development Environment](../setup/development-environment.md) - Development setup
