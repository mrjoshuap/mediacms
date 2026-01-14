# Common Issues

Frequently encountered problems and their solutions.

## Media Not Processing

### Symptoms

- Media uploaded but stuck in "Processing" state
- No transcoded versions available
- Video won't play

### Solutions

1. **Check Celery Workers**:

```bash
# Docker
make ps | grep celery

# Single Server
sudo systemctl status mediacms-celery-long mediacms-celery-short
```

2. **Check Worker Logs**:

```bash
# Docker
make logs celery_long

# Single Server
sudo journalctl -u mediacms-celery-long -n 50
```

3. **Check Queue Length**:

Log in to Django admin (`/admin/`) and check `Files > Encode` objects for pending tasks.

4. **Restart Workers**:

```bash
# Docker
make restart celery_long celery_short

# Single Server
sudo systemctl restart mediacms-celery-long mediacms-celery-short
```

## Upload Failures

### Symptoms

- Upload fails immediately
- Upload progress stops
- Error message displayed

### Solutions

1. **Check File Size**:

Verify file is within upload limits:

```python
# Check UPLOAD_MAX_SIZE in local_settings.py
UPLOAD_MAX_SIZE = 4 * 1024 * 1024 * 1024  # 4GB default
```

2. **Check Disk Space**:

```bash
df -h
docker system df  # Docker installation
```

3. **Check File Type**:

Verify file type is allowed:

```python
ALLOWED_MEDIA_UPLOAD_TYPES = ["video", "audio", "image", "pdf"]
```

4. **Check User Limits**:

Verify user hasn't exceeded upload limit:

```python
NUMBER_OF_MEDIA_USER_CAN_UPLOAD = 100
```

5. **Check Logs**:

```bash
make logs api | grep -i upload
```

## Playback Issues

### Symptoms

- Video won't play
- Player shows error
- Buffering issues

### Solutions

1. **Check Media Processing**:

Ensure media has finished processing and transcoding is complete.

2. **Check Browser Console**:

Open browser developer tools (F12) and check for JavaScript errors.

3. **Check Media Files**:

Verify media files exist and are accessible:

```bash
# Docker
docker compose exec api ls -la /home/mediacms.io/mediacms/media_files/
```

4. **Check Nginx Configuration**:

Verify nginx is serving media files correctly.

5. **Check CORS Settings**:

If using CDN or external storage, verify CORS is configured.

## User Access Problems

### Symptoms

- Users can't log in
- Permission denied errors
- Can't access media

### Solutions

1. **Check User Status**:

Verify user account is:
- Active
- Approved (if approval required)
- Email verified (if required)

2. **Check Permissions**:

- Verify user has correct role
- Check RBAC group membership
- Verify media permissions

3. **Check Portal Workflow**:

```python
PORTAL_WORKFLOW = 'public'  # or 'private', 'unlisted'
GLOBAL_LOGIN_REQUIRED = False  # or True
```

4. **Check RBAC**:

If RBAC is enabled:
- Verify user is in correct group
- Check category associations
- Verify user role in group

## Email Delivery Issues

### Symptoms

- Users not receiving emails
- Email verification not working
- Notification emails not sent

### Solutions

1. **Test Email Configuration**:

See [Debugging Email Issues](#debugging-email-issues).

2. **Check Email Settings**:

```python
EMAIL_HOST = 'smtp.example.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@example.com'
EMAIL_HOST_PASSWORD = 'your-password'
```

3. **Check Spam Folder**:

Emails may be filtered as spam.

4. **Verify SMTP Server**:

Test SMTP connection:

```bash
# Test SMTP connection
telnet smtp.example.com 587
```

5. **Check Logs**:

```bash
make logs api | grep -i email
```

## Debugging Email Issues

### Django Shell Test

Enter Django shell:

```bash
# Docker
make shell

# Single Server
source /home/mediacms.io/bin/activate
python manage.py shell
```

Test email:

```python
from django.core.mail import EmailMessage
from django.conf import settings

settings.EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

email = EmailMessage(
    'Test Subject',
    'Test message',
    settings.DEFAULT_FROM_EMAIL,
    ['recipient@example.com'],
)
email.send(fail_silently=False)
```

Check for errors in the output.

## Thumbnail Preview Issues

### Symptoms

- Video thumbnails not showing
- Sprite generation fails
- Preview images missing

### Solutions

1. **Check ImageMagick Limits**:

For large videos, ImageMagick may have size limits. Edit `/etc/ImageMagick-6/policy.xml`:

```xml
<policy domain="resource" name="height" value="16000KP"/>
<policy domain="resource" name="width" value="16000KP"/>
```

2. **Regenerate Sprites**:

```python
# Django shell
from files.models import Media
from files.tasks import produce_sprite_from_video

for media in Media.objects.filter(media_type='video', sprites=''):
    produce_sprite_from_video(media.friendly_token)
```

3. **Check Sprite Settings**:

```python
SPRITE_NUM_SECS = 10  # Extract sprite every 10 seconds
```

## Search Not Working

### Symptoms

- Search returns no results
- Search is slow
- Search errors

### Solutions

1. **Check Database Indexes**:

Ensure database indexes are created:

```bash
python manage.py migrate
```

2. **Check Search Configuration**:

Verify search is enabled and configured correctly.

3. **Rebuild Indexes**:

If using full-text search, rebuild indexes.

## Performance Issues

### Symptoms

- Slow page loads
- Timeouts
- High resource usage

### Solutions

1. **Check Resource Usage**:

```bash
docker stats
top
```

2. **Check Database Performance**:

```bash
# Check slow queries
# Review database logs
```

3. **Check Queue Length**:

Long transcoding queues can slow the system.

4. **Optimize Configuration**:

See [Performance Issues](performance-issues.md) for detailed optimization.

## Next Steps

- [Installation Problems](installation-problems.md) - Installation issues
- [Transcoding Issues](transcoding-issues.md) - Video processing problems
- [Authentication Problems](authentication-problems.md) - Login issues
- [Performance Issues](performance-issues.md) - Performance optimization
