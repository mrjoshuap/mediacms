# Configuration Reference

Complete reference for all MediaCMS configuration options.

## Configuration Files

### Docker Installation

Edit `custom/local_settings.py`

### Single Server Installation

Edit `cms/local_settings.py`

**Important**: Never edit `cms/settings.py` directly. Always use `local_settings.py`.

## Portal Settings

### Portal Name

```python
PORTAL_NAME = 'My Media Portal'
```

### Portal Logo

```python
# SVG (recommended)
PORTAL_LOGO_DARK_SVG = '/static/images/logo_dark.svg'
PORTAL_LOGO_LIGHT_SVG = '/static/images/logo_light.svg'

# PNG
PORTAL_LOGO_DARK_PNG = '/static/images/logo_dark.png'
PORTAL_LOGO_LIGHT_PNG = '/static/images/logo_light.png'
```

### Portal Workflow

```python
PORTAL_WORKFLOW = 'public'  # Options: 'public', 'private', 'unlisted'
```

## Authentication Settings

### Login and Registration

```python
LOGIN_ALLOWED = True
REGISTER_ALLOWED = True
USERS_CAN_SELF_REGISTER = True
GLOBAL_LOGIN_REQUIRED = False
```

### Email Verification

```python
ACCOUNT_EMAIL_VERIFICATION = 'optional'  # Options: 'optional', 'mandatory'
```

### User Approval

```python
USERS_NEEDS_TO_BE_APPROVED = False
```

### Rate Limiting

```python
ACCOUNT_LOGIN_ATTEMPTS_LIMIT = 20
ACCOUNT_LOGIN_ATTEMPTS_TIMEOUT = 5
```

### Domain Restrictions

```python
RESTRICTED_DOMAINS_FOR_USER_REGISTRATION = ['example.com']
ALLOWED_DOMAINS_FOR_USER_REGISTRATION = ['company.com']
```

## Media Settings

### Upload Limits

```python
UPLOAD_MAX_SIZE = 4 * 1024 * 1024 * 1024  # 4GB default
UPLOAD_MAX_FILES_NUMBER = 100
NUMBER_OF_MEDIA_USER_CAN_UPLOAD = 100
```

### Allowed File Types

```python
ALLOWED_MEDIA_UPLOAD_TYPES = ["video", "audio", "image", "pdf"]
# Or allow all:
ALLOWED_MEDIA_UPLOAD_TYPES = ["all"]
```

### Custom URLs

```python
ALLOW_CUSTOM_MEDIA_URLS = True
```

### Transcoding

```python
DO_NOT_TRANSCODE_VIDEO = False
FFMPEG_DEFAULT_PRESET = "medium"
CHUNKIZE_VIDEO_DURATION = 60 * 5
VIDEO_CHUNKS_DURATION = 60 * 4
MINIMUM_RESOLUTIONS_TO_ENCODE = [144, 240]
SPRITE_NUM_SECS = 10
```

### Whisper Transcription

```python
USE_WHISPER_TRANSCRIBE = False
WHISPER_MODEL = 'base'
USER_CAN_TRANSCRIBE_VIDEO = True
```

## User Permissions

### Who Can Add Media

```python
CAN_ADD_MEDIA = "all"  # Options: "all", "email_verified", "advancedUser"
```

### Who Can Comment

```python
CAN_COMMENT = "all"  # Options: "all", "email_verified", "advancedUser"
```

### Members Page Access

```python
CAN_SEE_MEMBERS_PAGE = "all"  # Options: "all", "editors", "admins"
ALLOW_ANONYMOUS_USER_LISTING = True
```

### User Search

```python
USER_SEARCH_FIELD = "name_username"  # Options: "name_username", "name_username_email"
```

## UI Settings

### Action Buttons

```python
CAN_LIKE_MEDIA = True
CAN_DISLIKE_MEDIA = True
CAN_REPORT_MEDIA = True
CAN_SHARE_MEDIA = True
```

### Upload Button

```python
UPLOAD_MEDIA_ALLOWED = True
```

### Rounded Corners

```python
USE_ROUNDED_CORNERS = True
```

### Custom Upload Message

```python
PRE_UPLOAD_MEDIA_MESSAGE = 'Custom message'
```

### Media Counts

```python
INCLUDE_LISTING_NUMBERS = True
```

## Playlist Settings

```python
MAX_MEDIA_PER_PLAYLIST = 100
```

## Comment Settings

```python
MAX_CHARS_FOR_COMMENT = 10000
```

## Media Review

```python
MEDIA_IS_REVIEWED = True  # False = require review
REPORTED_TIMES_THRESHOLD = 2  # Auto-hide after N reports
```

## Email Settings

```python
DEFAULT_FROM_EMAIL = 'info@mediacms.io'
EMAIL_HOST = 'smtp.example.com'
EMAIL_PORT = 587
EMAIL_HOST_USER = 'info@mediacms.io'
EMAIL_HOST_PASSWORD = 'password'
EMAIL_USE_TLS = True
SERVER_EMAIL = DEFAULT_FROM_EMAIL
ADMIN_EMAIL_LIST = ['admin@mediacms.io']
```

## Notifications

### User Notifications

```python
USERS_NOTIFICATIONS = {
    'MEDIA_ADDED': True,
}
```

### Admin Notifications

```python
ADMINS_NOTIFICATIONS = {
    'NEW_USER': True,
    'MEDIA_ADDED': True,
    'MEDIA_REPORTED': True,
}
```

## RBAC Settings

```python
USE_RBAC = False
```

## SAML Settings

```python
USE_SAML = False
USE_IDENTITY_PROVIDERS = False

USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True

SOCIALACCOUNT_ADAPTER = 'saml_auth.adapter.SAMLAccountAdapter'
SOCIALACCOUNT_PROVIDERS = {
    "saml": {
        "provider_class": "saml_auth.custom.provider.CustomSAMLProvider",
    }
}
```

## Sitemap

```python
GENERATE_SITEMAP = False
```

## Security Settings

### Secret Key

```python
SECRET_KEY = 'your-secret-key-here'
```

### Allowed Hosts

```python
ALLOWED_HOSTS = ['your-domain.com', 'www.your-domain.com']
```

### Debug Mode

```python
DEBUG = False  # Never True in production!
```

## Database Settings

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'mediacms',
        'USER': 'mediacms',
        'PASSWORD': 'password',
        'HOST': 'localhost',
        'PORT': '5432',
        'CONN_MAX_AGE': 600,
    }
}
```

## Cache Settings

```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'TIMEOUT': 300,
    }
}
```

## Celery Settings

```python
CELERY_BROKER_URL = 'redis://127.0.0.1:6379/0'
CELERY_RESULT_BACKEND = 'redis://127.0.0.1:6379/0'
```

## Translations

```python
LANGUAGE_CODE = 'en'
LANGUAGES = [
    ('en', 'English'),
    ('es', 'Spanish'),
    # Add more languages
]
```

## Custom CSS

```python
EXTRA_CSS_PATHS = [
    '/custom/static/css/custom.css',
]
```

## Next Steps

- [Basic Settings](../../administration/configuration/basic-settings.md) - Essential configuration
- [Advanced Configuration](../../administration/configuration/advanced-configuration.md) - Advanced options
- [Configuration Guide](../../administration/configuration/README.md) - Configuration overview
