# Monitoring

Monitor your MediaCMS installation to ensure optimal performance and availability.

## Service Health

### Check Service Status

**Docker Installation**:

```bash
make ps
```

**Single Server Installation**:

```bash
# Check all services using the target
sudo systemctl status mediacms.target

# Or check individual services
sudo systemctl status mediacms-api mediacms-celery-long mediacms-celery-short mediacms-celery-beat
```

### Health Checks

**Docker Installation**:

```bash
make health
```

Checks health of all production services.

## Resource Monitoring

### CPU and Memory

**Docker Installation**:

```bash
docker stats
```

**System-wide**:

```bash
top
htop  # If installed
```

### Disk Usage

**Docker Volumes**:

```bash
docker system df
```

**Filesystem**:

```bash
df -h
```

**Media Files Directory**:

```bash
du -sh /path/to/media_files
```

## Log Monitoring

### View Logs

**Docker Installation**:

```bash
# All services
make logs

# Specific service
make logs api
make logs celery_long
make logs nginx
```

**Single Server Installation**:

```bash
# All services using the target
sudo journalctl -u mediacms.target -f

# Individual service logs
sudo journalctl -u mediacms-api -f
sudo journalctl -u mediacms-celery-long -f
sudo journalctl -u mediacms-celery-short -f
sudo journalctl -u mediacms-celery-beat -f
```

### Log Locations

**Docker Installation**:
- Logs stored in `logs` Docker volume
- Access via `docker compose logs`

**Single Server Installation**:
- Systemd journal: `journalctl -u service-name`
- Application logs: Check `local_settings.py` LOGGING configuration

## Application Monitoring

### Transcoding Queue

Monitor transcoding tasks:

1. Log in to Django admin: `/admin/`
2. Navigate to `Files > Encode profiles`
3. Check `Encode` objects for:
   - Pending tasks
   - Failed tasks
   - Processing times

### Database Monitoring

**Connection Count**:

```bash
# Docker
docker compose exec db psql -U mediacms -c "SELECT count(*) FROM pg_stat_activity;"

# Single Server
psql -U mediacms -c "SELECT count(*) FROM pg_stat_activity;"
```

**Database Size**:

```bash
# Docker
docker compose exec db psql -U mediacms -c "SELECT pg_database_size('mediacms');"

# Single Server
psql -U mediacms -c "SELECT pg_database_size('mediacms');"
```

### Redis Monitoring

**Redis CLI**:

```bash
# Docker
make redis-cli

# Or directly
docker compose exec redis redis-cli
```

**Check Memory**:

```bash
redis-cli INFO memory
```

**Monitor Commands**:

```bash
redis-cli MONITOR
```

## Performance Metrics

### Response Times

Monitor API response times:
- Check nginx access logs
- Use application monitoring tools
- Monitor database query times

### Transcoding Performance

- Monitor queue length
- Track processing times
- Identify bottlenecks
- Scale workers as needed

### User Activity

- Monitor active users
- Track upload rates
- Monitor playback statistics
- Review error rates

## Alerting

### Key Metrics to Alert On

- Service down
- High error rates
- Disk space > 80%
- High CPU/memory usage
- Transcoding queue backup
- Database connection issues

### Monitoring Tools

Consider using:
- **Prometheus + Grafana**: Metrics and visualization
- **ELK Stack**: Log aggregation
- **Nagios/Zabbix**: Infrastructure monitoring
- **Sentry**: Error tracking

## Health Check Script

Create a health check script:

```bash
#!/bin/bash

# Check services
if ! docker compose ps | grep -q "Up"; then
    echo "ERROR: Services not running"
    exit 1
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "WARNING: Disk usage at ${DISK_USAGE}%"
fi

# Check database
if ! docker compose exec -T db pg_isready -U mediacms > /dev/null; then
    echo "ERROR: Database not ready"
    exit 1
fi

echo "Health check passed"
```

## Next Steps

- [Performance Tuning](performance-tuning.md) - Optimize performance
- [Scaling](../../administration/maintenance/scaling.md) - Scale your deployment
- [Troubleshooting](../../troubleshooting/README.md) - Problem solving
