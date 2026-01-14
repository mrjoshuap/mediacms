# Debugging Guide

Techniques and tools for debugging MediaCMS issues.

## Log Locations

### Docker Installation

**Application Logs**:

```bash
# All services
make logs

# Specific service
make logs api
make logs celery_long
make logs nginx
```

**Log Files**:

Logs are stored in Docker volumes. Access via:

```bash
docker compose exec api tail -f /path/to/logs/mediacms.log
```

### Single Server Installation

**Systemd Logs**:

```bash
# Application
sudo journalctl -u mediacms -f

# Celery workers
sudo journalctl -u celery_long -f
sudo journalctl -u celery_short -f

# All services
sudo journalctl -u 'mediacms*' -f
```

**Log Files**:

Check `local_settings.py` LOGGING configuration for log file locations.

## Django Shell Debugging

### Access Django Shell

**Docker Installation**:

```bash
make shell
```

**Single Server Installation**:

```bash
source /home/mediacms.io/bin/activate
python manage.py shell
```

### Common Debugging Tasks

**Check Settings**:

```python
from django.conf import settings
print(settings.DEBUG)
print(settings.DATABASES)
```

**Check Models**:

```python
from files.models import Media
media = Media.objects.first()
print(media.title)
print(media.media_type)
```

**Check Tasks**:

```python
from files.tasks import encode_video
# Test task execution
```

**Check Permissions**:

```python
from users.models import User
user = User.objects.get(username='testuser')
print(user.has_perm('files.add_media'))
```

## Celery Task Debugging

### Check Task Status

**Django Shell**:

```python
from celery.result import AsyncResult
result = AsyncResult('task-id')
print(result.state)
print(result.result)
```

### Monitor Tasks

**Flower** (Celery monitoring):

```bash
# Install Flower
pip install flower

# Run Flower
celery -A cms flower
```

Access at `http://localhost:5555`

### Check Queue Length

**Django Shell**:

```python
from celery import current_app
inspect = current_app.control.inspect()
active = inspect.active()
reserved = inspect.reserved()
```

### Test Task Execution

**Django Shell**:

```python
from files.tasks import produce_thumbnail
# Execute task synchronously for testing
produce_thumbnail.apply(args=['media-token'])
```

## Database Debugging

### Access Database Shell

**Docker Installation**:

```bash
make db-shell
```

**Single Server Installation**:

```bash
psql -U mediacms -d mediacms
```

### Common Queries

**Check Media Count**:

```sql
SELECT COUNT(*) FROM files_media;
```

**Check Encoding Status**:

```sql
SELECT status, COUNT(*) FROM files_encode GROUP BY status;
```

**Check User Count**:

```sql
SELECT COUNT(*) FROM users_user;
```

**Check Recent Media**:

```sql
SELECT title, date_added FROM files_media ORDER BY date_added DESC LIMIT 10;
```

### Slow Query Log

Enable slow query logging in PostgreSQL:

```sql
ALTER DATABASE mediacms SET log_min_duration_statement = 1000;  -- Log queries > 1 second
```

## Network Debugging

### Check Ports

```bash
# Check if ports are listening
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :8000
sudo netstat -tulpn | grep :5432
```

### Test Connections

```bash
# Test HTTP
curl http://localhost

# Test API
curl http://localhost/api/v1/media/

# Test Database
psql -h localhost -U mediacms -d mediacms -c "SELECT 1;"
```

### Check DNS

```bash
nslookup your-domain.com
dig your-domain.com
```

## File System Debugging

### Check Disk Space

```bash
df -h
docker system df  # Docker installation
```

### Check File Permissions

```bash
# Docker
docker compose exec api ls -la /home/mediacms.io/mediacms/media_files/

# Single Server
ls -la /home/mediacms.io/mediacms/media_files/
```

### Check File Sizes

```bash
du -sh /path/to/directory
find /path/to/directory -type f -size +1G
```

## Error Tracking

### Enable Debug Mode

**Development Only**:

```python
DEBUG = True
```

**Never enable in production!**

### Debug Toolbar

For development:

```python
if DEBUG:
    INSTALLED_APPS += ['debug_toolbar']
    MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
```

### Sentry Integration

For production error tracking:

```python
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[DjangoIntegration()],
    traces_sample_rate=1.0,
)
```

## Performance Profiling

### Django Debug Toolbar

Shows:
- SQL queries
- Template rendering
- Cache usage
- Request/response info

### Django Extensions

```bash
pip install django-extensions
```

Use profiling:

```bash
python manage.py runserver --noreload --nothreading
```

### cProfile

Profile Python code:

```python
import cProfile
cProfile.run('your_function()')
```

## Browser Debugging

### Developer Tools

- **F12**: Open developer tools
- **Network Tab**: Monitor requests
- **Console Tab**: JavaScript errors
- **Application Tab**: Cookies, storage

### Network Monitoring

1. Open browser developer tools
2. Go to Network tab
3. Enable "Preserve log"
4. Perform action
5. Review requests and responses

### Console Errors

Check browser console for:
- JavaScript errors
- API errors
- CORS issues
- Network failures

## Common Debugging Scenarios

### Media Not Processing

1. Check Celery workers: `make ps | grep celery`
2. Check worker logs: `make logs celery_long`
3. Check Encode objects in Django admin
4. Test task manually in Django shell

### Authentication Issues

1. Check browser network tab for SAML responses
2. Review authentication logs
3. Test in Django shell: `user.has_perm(...)`
4. Check session storage

### Database Issues

1. Check database logs
2. Test connection: `psql -U mediacms -d mediacms`
3. Review slow query log
4. Check connection count

### Performance Issues

1. Monitor resources: `docker stats`
2. Check queue lengths
3. Review slow queries
4. Profile application code

## Debugging Best Practices

1. **Start with Logs**: Always check logs first
2. **Reproduce Issue**: Reproduce in development
3. **Isolate Problem**: Narrow down to specific component
4. **Use Debugging Tools**: Leverage available tools
5. **Document Findings**: Keep notes on issues and solutions
6. **Test Fixes**: Verify fixes work before deploying

## Next Steps

- [Common Issues](common-issues.md) - Common problems
- [Installation Problems](installation-problems.md) - Installation issues
- [Performance Issues](performance-issues.md) - Performance optimization
