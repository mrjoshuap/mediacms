# Advanced Configuration

Advanced configuration options for MediaCMS.

## Hardware Encoding

MediaCMS includes jellyfin-ffmpeg with hardware acceleration support.

**Important**: Hardware encoding is NOT automatically enabled.

To enable hardware encoding:

1. Update `files/helpers.py` to use hardware encoders:
   - `h264_qsv` (Intel Quick Sync)
   - `h264_nvenc` (NVIDIA)
   - `h264_vaapi` (AMD/Intel VAAPI)

2. Configure GPU access in Docker (device passthrough)

3. Verify hardware supports chosen encoder

**Note**: Software encoding (default) provides best compatibility.

## Multi-Architecture Builds

MediaCMS supports multiple CPU architectures:

- `amd64` (x86_64) - Intel/AMD 64-bit
- `arm64` (aarch64) - ARM 64-bit (Apple Silicon, ARM servers)

### Build for Specific Architecture

```bash
docker buildx build --platform linux/amd64 -t mediacms/mediacms:latest .
docker buildx build --platform linux/arm64 -t mediacms/mediacms:latest .
```

### Build for Multiple Architectures

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t mediacms/mediacms:latest .
```

**Note**: Requires Docker buildx. Some utilities may only be available for specific architectures.

## FFmpeg Configuration

### FFmpeg Command Path

```python
FFMPEG_COMMAND = "ffmpeg"
FFPROBE_COMMAND = "ffprobe"
MP4HLS_COMMAND = "/usr/local/bin/mp4hls"
```

### Custom FFmpeg Options

Modify `files/helpers.py` for advanced FFmpeg options:
- Video bitrates
- Audio encoders
- CRF values
- Keyframe settings
- Codec-specific parameters

## Database Configuration

### Connection Settings

Configure in `custom/local_settings.py`:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'mediacms',
        'USER': 'mediacms',
        'PASSWORD': 'your-password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### Connection Pooling

Consider using connection pooling for high-traffic deployments:

```python
DATABASES = {
    'default': {
        # ... database settings ...
        'CONN_MAX_AGE': 600,  # Reuse connections for 10 minutes
    }
}
```

## Redis Configuration

### Connection Settings

```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}

CELERY_BROKER_URL = 'redis://127.0.0.1:6379/0'
CELERY_RESULT_BACKEND = 'redis://127.0.0.1:6379/0'
```

## Security Settings

### SSL/HTTPS

For production with reverse proxy:

```python
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
```

### Secret Key

**Important**: Change the default secret key!

```python
SECRET_KEY = 'your-secret-key-here'
```

Generate a new secret key:

```python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

### Allowed Hosts

```python
ALLOWED_HOSTS = ['your-domain.com', 'www.your-domain.com']
```

## Performance Tuning

### Static Files

For production, use a CDN or separate static file server:

```python
STATIC_URL = 'https://cdn.example.com/static/'
```

### Media Files

Consider using object storage (S3, etc.) for large deployments.

### Cache Settings

```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'TIMEOUT': 300,  # 5 minutes
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}
```

## Logging Configuration

### Log Levels

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/path/to/logs/mediacms.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

## Celery Configuration

### Task Routing

```python
CELERY_TASK_ROUTES = {
    'files.tasks.*': {'queue': 'long'},
    'files.tasks.produce_thumbnail': {'queue': 'short'},
}
```

### Task Timeouts

```python
CELERY_TASK_SOFT_TIME_LIMIT = 3600  # 1 hour
CELERY_TASK_TIME_LIMIT = 7200       # 2 hours
```

## Debug Settings

### Debug Mode

**Never enable in production!**

```python
DEBUG = False  # Production
DEBUG = True   # Development only
```

### Debug Toolbar

For development:

```python
if DEBUG:
    INSTALLED_APPS += ['debug_toolbar']
    MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
```

## Custom Settings

Add your own custom settings:

```python
# Custom settings
MY_CUSTOM_SETTING = 'value'
MY_CUSTOM_LIST = ['item1', 'item2']
```

Access in code:

```python
from django.conf import settings
value = settings.MY_CUSTOM_SETTING
```

## Environment Variables

Use environment variables for sensitive settings:

```python
import os

SECRET_KEY = os.environ.get('SECRET_KEY', 'default-secret-key')
DATABASE_PASSWORD = os.environ.get('DB_PASSWORD')
```

## Next Steps

- [Maintenance Guide](../maintenance/README.md) - Updates and backups
- [Troubleshooting](../../../troubleshooting/README.md) - Problem solving
- [Reference](../../reference/configuration-reference.md) - Complete configuration reference
