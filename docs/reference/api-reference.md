# API Reference

Complete REST API reference for MediaCMS.

## Base URL

```
https://your-mediacms-instance.com/api/v1/
```

## Interactive Documentation

Swagger UI documentation available at:

```
https://your-mediacms-instance.com/swagger/
```

Example: https://demo.mediacms.io/swagger/

## Authentication

### Session Authentication

Default for web interface. Uses Django session cookies.

### Token Authentication

1. Obtain token: `POST /api/v1/auth/token/`
2. Include in header: `Authorization: Token your-token`

### Basic Authentication

For API access: `Authorization: Basic base64(username:password)`

## Endpoints

### Media Endpoints

#### List Media

```
GET /api/v1/media/
```

**Query Parameters**:
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 50)
- `search`: Search query
- `category`: Filter by category ID
- `user`: Filter by user ID
- `media_type`: Filter by type (video, audio, image, pdf)
- `state`: Filter by state (public, unlisted, private)

**Response**: Paginated list of media objects

#### Get Media

```
GET /api/v1/media/{id}/
```

**Response**: Media object with details

#### Upload Media

```
POST /api/v1/media/
```

**Request**:
- `media_file`: File upload (multipart/form-data)
- `title`: Media title (required)
- `description`: Media description
- `category`: Category ID
- `tags`: Comma-separated tags
- `state`: Visibility state (public, unlisted, private)

**Response**: Created media object

#### Update Media

```
PATCH /api/v1/media/{id}/
PUT /api/v1/media/{id}/
```

**Request**: Media fields to update

**Response**: Updated media object

#### Delete Media

```
DELETE /api/v1/media/{id}/
```

**Response**: 204 No Content

### User Endpoints

#### List Users

```
GET /api/v1/users/
```

**Query Parameters**:
- `page`: Page number
- `page_size`: Items per page
- `search`: Search query

**Response**: Paginated list of users

#### Get User

```
GET /api/v1/users/{id}/
```

**Response**: User object

#### Update User

```
PATCH /api/v1/users/{id}/
PUT /api/v1/users/{id}/
```

**Response**: Updated user object

### Category Endpoints

#### List Categories

```
GET /api/v1/categories/
```

**Response**: List of categories

#### Get Category

```
GET /api/v1/categories/{id}/
```

**Response**: Category object

### Playlist Endpoints

#### List Playlists

```
GET /api/v1/playlists/
```

**Response**: List of playlists

#### Create Playlist

```
POST /api/v1/playlists/
```

**Request**:
- `title`: Playlist title (required)
- `description`: Playlist description
- `state`: Visibility state
- `media`: Array of media IDs

**Response**: Created playlist object

#### Update Playlist

```
PATCH /api/v1/playlists/{id}/
PUT /api/v1/playlists/{id}/
```

**Response**: Updated playlist object

#### Delete Playlist

```
DELETE /api/v1/playlists/{id}/
```

**Response**: 204 No Content

## Response Format

### Success Response

```json
{
  "id": 1,
  "title": "Example Media",
  "description": "Media description",
  "media_type": "video",
  "state": "public",
  "date_added": "2024-01-01T00:00:00Z",
  "user": {
    "id": 1,
    "username": "user",
    "name": "User Name"
  }
}
```

### Error Response

```json
{
  "detail": "Error message",
  "field_name": ["Field-specific error message"]
}
```

### Paginated Response

```json
{
  "count": 100,
  "next": "https://api.example.com/api/v1/media/?page=2",
  "previous": null,
  "results": [...]
}
```

## Status Codes

- `200 OK`: Successful GET, PUT, PATCH
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Invalid request
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Rate Limiting

API may implement rate limiting. Check response headers:

- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

## Examples

See [Development API Reference](../../development/architecture/api-reference.md) for code examples.

## Next Steps

- [Swagger Documentation](https://demo.mediacms.io/swagger/) - Interactive API docs
- [Development Guide](../../development/README.md) - Developer documentation
