# Logging

Log management and analysis for MediaCMS.

## Log Locations

### Docker Installation

Logs are accessible via Docker Compose:

```bash
# All logs
make logs

# Specific service
make logs api
make logs celery_long
make logs nginx
```

Log files are stored in Docker volumes:
- Application logs: `logs` volume
- Database logs: Managed by PostgreSQL
- Nginx logs: `logs` volume

### Single Server Installation

**Systemd Logs**:

```bash
# Application
sudo journalctl -u mediacms -f

# Celery workers
sudo journalctl -u celery_long -f
sudo journalctl -u celery_short -f
sudo journalctl -u celery_beat -f

# All MediaCMS services
sudo journalctl -u 'mediacms*' -f
```

**Log Files**:

Check `local_settings.py` LOGGING configuration for file locations.

## Log Levels

### Django Logging

Configure log levels in `local_settings.py`:

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',  # DEBUG, INFO, WARNING, ERROR, CRITICAL
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

## Common Log Patterns

### Check for Errors

```bash
# Docker
make logs | grep -i error

# Single Server
sudo journalctl -u mediacms | grep -i error
```

### Check Recent Logs

```bash
# Docker
make logs --tail=100

# Single Server
sudo journalctl -u mediacms -n 100
```

### Follow Logs

```bash
# Docker
make logs -f

# Single Server
sudo journalctl -u mediacms -f
```

## Log Analysis

### Application Errors

Look for:
- Python tracebacks
- Django errors
- API errors
- Database errors

### Transcoding Errors

Check worker logs:

```bash
make logs celery_long | grep -i error
```

Look for:
- FFmpeg errors
- Encoding failures
- File access errors

### Authentication Errors

Check API logs:

```bash
make logs api | grep -i auth
```

Look for:
- Login failures
- SAML errors
- Permission denied

## Log Rotation

### Docker Installation

Configure log rotation in Docker or use external log management.

### Single Server Installation

Use systemd journal rotation:

```bash
# Check journal size
sudo journalctl --disk-usage

# Configure retention
sudo vim /etc/systemd/journald.conf
```

Set:
```
SystemMaxUse=500M
MaxRetentionSec=1month
```

## Centralized Logging

For production, consider:
- **ELK Stack**: Elasticsearch, Logstash, Kibana
- **Loki + Grafana**: Log aggregation
- **Cloud Logging**: AWS CloudWatch, Google Cloud Logging
- **Splunk**: Enterprise log management

## Next Steps

- [Monitoring](monitoring.md) - System monitoring
- [Debugging Guide](../../troubleshooting/debugging-guide.md) - Debugging techniques
- [Troubleshooting](../../troubleshooting/README.md) - Problem solving
