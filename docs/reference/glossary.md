# Glossary

Terms and definitions used in MediaCMS documentation.

## A

### Advanced User

A user role with additional capabilities beyond regular users. Can be required for certain actions like uploading media or commenting.

### API

Application Programming Interface. MediaCMS provides a REST API for programmatic access.

## B

### Basic Authentication

HTTP authentication method using username and password encoded in Base64.

## C

### Category

Organizational grouping for media. Categories can be associated with RBAC groups for access control.

### Celery

Distributed task queue system used by MediaCMS for background processing like video transcoding.

### Chunking

Process of splitting long videos into smaller segments for parallel transcoding.

### Contributor

RBAC role that allows users to view and edit media in associated categories.

## D

### Django

Python web framework used for MediaCMS backend.

### Docker

Containerization platform used for MediaCMS deployment.

## E

### Encode

Processed version of a media file at a specific resolution and codec.

### Encode Profile

Configuration defining resolution, codec, and other encoding parameters.

## F

### FFmpeg

Multimedia framework used for video transcoding in MediaCMS.

### Frontend

User interface layer, built with React in MediaCMS.

## G

### Gunicorn

Python WSGI HTTP Server used to serve Django in production.

## H

### HLS

HTTP Live Streaming protocol. MediaCMS generates HLS versions for adaptive streaming.

## I

### Identity Provider (IdP)

External service that provides authentication, such as Microsoft Entra ID or Okta.

## M

### Manager

RBAC role with full control over media in associated categories.

### Media

Generic term for uploaded content (video, audio, image, PDF).

### Member

RBAC role that allows users to view media in associated categories.

## N

### Nginx

Web server and reverse proxy used in MediaCMS production deployments.

## P

### Playlist

Collection of media items organized by a user.

### PostgreSQL

Relational database management system used by MediaCMS.

### Private

Media visibility state where only the owner and authorized users can access.

### Public

Media visibility state where everyone can access.

## R

### RBAC

Role-Based Access Control. System for managing permissions through groups and categories.

### Redis

In-memory data store used for caching and message brokering in MediaCMS.

### REST API

Representational State Transfer API. MediaCMS provides a RESTful API.

## S

### SAML

Security Assertion Markup Language. Protocol for single sign-on authentication.

### Service Provider (SP)

Application that receives authentication assertions from an Identity Provider. MediaCMS acts as an SP.

### Sprite

Image sheet containing video frame thumbnails for preview on timeline.

### Swagger

API documentation tool. MediaCMS API is documented with Swagger UI.

## T

### Tag

Label applied to media for organization and search.

### Token Authentication

API authentication method using a token instead of username/password.

### Transcoding

Process of converting media files to different formats, resolutions, or codecs.

## U

### Unlisted

Media visibility state where content is accessible via direct link but not shown in listings.

### User

Account holder in MediaCMS system.

## V

### VTT

WebVTT format used for subtitles and captions.

## W

### Whisper

OpenAI's speech-to-text model used for automatic transcription in MediaCMS.

### Worker

Celery process that executes background tasks like video transcoding.

## Next Steps

- [API Reference](api-reference.md) - API documentation
- [Configuration Reference](configuration-reference.md) - Configuration options
- [Permissions Reference](permissions-reference.md) - Permissions system
