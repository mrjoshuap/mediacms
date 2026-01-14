# API Reference

MediaCMS REST API documentation.

## API Overview

MediaCMS provides a RESTful API built with Django REST Framework.

### Base URL

```
https://your-mediacms-instance.com/api/v1/
```

### Documentation

Interactive API documentation available at:

```
https://your-mediacms-instance.com/swagger/
```

Example: https://demo.mediacms.io/swagger/

## Authentication

### Session Authentication

Use Django session authentication (default for web interface).

### Token Authentication

For API access, use token authentication:

1. Get token from `/api/v1/auth/token/`
2. Include in requests: `Authorization: Token your-token`

### Basic Authentication

For testing, use basic authentication:

```python
import requests

auth = ('username', 'password')
response = requests.get('https://api.example.com/api/v1/media/', auth=auth)
```

## Endpoints

### Media

#### List Media

```
GET /api/v1/media/
```

**Query Parameters**:
- `page`: Page number
- `page_size`: Items per page
- `search`: Search query
- `category`: Filter by category
- `user`: Filter by user

#### Get Media

```
GET /api/v1/media/{id}/
```

#### Upload Media

```
POST /api/v1/media/
```

**Request**:
```python
import requests

auth = ('username', 'password')
files = {'media_file': open('video.mp4', 'rb')}
data = {
    'title': 'My Video',
    'description': 'Video description',
    'category': 'category-id'
}

response = requests.post(
    'https://api.example.com/api/v1/media/',
    files=files,
    data=data,
    auth=auth
)
```

#### Update Media

```
PATCH /api/v1/media/{id}/
PUT /api/v1/media/{id}/
```

#### Delete Media

```
DELETE /api/v1/media/{id}/
```

### Users

#### List Users

```
GET /api/v1/users/
```

#### Get User

```
GET /api/v1/users/{id}/
```

#### Update User

```
PATCH /api/v1/users/{id}/
PUT /api/v1/users/{id}/
```

### Categories

#### List Categories

```
GET /api/v1/categories/
```

#### Get Category

```
GET /api/v1/categories/{id}/
```

### Playlists

#### List Playlists

```
GET /api/v1/playlists/
```

#### Create Playlist

```
POST /api/v1/playlists/
```

#### Update Playlist

```
PATCH /api/v1/playlists/{id}/
PUT /api/v1/playlists/{id}/
```

## Example Usage

### Python Example

```python
import requests

# Authentication
auth = ('username', 'password')
base_url = 'https://api.example.com/api/v1/'

# Upload media
upload_url = f'{base_url}media/'
files = {'media_file': open('video.mp4', 'rb')}
data = {
    'title': 'My Video',
    'description': 'Video description'
}

response = requests.post(
    upload_url,
    files=files,
    data=data,
    auth=auth
)

media_id = response.json()['id']

# Get media
media_url = f'{base_url}media/{media_id}/'
media = requests.get(media_url, auth=auth).json()

# Update media
update_data = {'title': 'Updated Title'}
requests.patch(media_url, json=update_data, auth=auth)
```

### cURL Example

```bash
# Upload media
curl -X POST \
  https://api.example.com/api/v1/media/ \
  -u username:password \
  -F "media_file=@video.mp4" \
  -F "title=My Video" \
  -F "description=Video description"

# Get media
curl -u username:password \
  https://api.example.com/api/v1/media/{id}/

# Update media
curl -X PATCH \
  https://api.example.com/api/v1/media/{id}/ \
  -u username:password \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}'
```

## Response Format

### Success Response

```json
{
  "id": 1,
  "title": "My Video",
  "description": "Video description",
  "media_type": "video",
  "user": {
    "id": 1,
    "username": "user",
    "name": "User Name"
  },
  "date_added": "2024-01-01T00:00:00Z"
}
```

### Error Response

```json
{
  "detail": "Error message",
  "field_name": ["Field-specific error"]
}
```

## Pagination

API responses are paginated:

```json
{
  "count": 100,
  "next": "https://api.example.com/api/v1/media/?page=2",
  "previous": null,
  "results": [...]
}
```

Default page size: 50 items

## Rate Limiting

API may have rate limiting configured. Check response headers:

- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time

## Swagger Documentation

For complete API documentation:

1. Visit `/swagger/` on your MediaCMS instance
2. Log in to access authenticated endpoints
3. Test endpoints directly in Swagger UI
4. View request/response schemas

## Next Steps

- [System Overview](system-overview.md) - Architecture overview
- [Database Schema](database-schema.md) - Database structure
- [Development Environment](../setup/development-environment.md) - Development setup
