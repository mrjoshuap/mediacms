# Getting Started - Operators

This guide introduces you to day-to-day operations and monitoring of MediaCMS.

## Understanding the System

MediaCMS consists of several services that work together:

- **API**: Django application server (handles web requests)
- **Nginx**: Web server and reverse proxy
- **PostgreSQL**: Database
- **Redis**: Cache and message broker
- **Celery Workers**: Process video transcoding and other background tasks
- **Celery Beat**: Scheduler for periodic tasks

## Key Monitoring Points

### Service Health

Check service status:

```bash
make ps
```

Or using docker compose:

```bash
docker compose ps
```

All services should be running. Check for:
- Services stuck in "restarting" state
- Services showing as "unhealthy"
- High resource usage

### System Resources

Monitor CPU, memory, and disk usage:

```bash
# CPU and memory
docker stats

# Disk usage
docker system df
df -h
```

### Database Health

Check database connections and size:

```bash
make db-shell
```

Then in PostgreSQL:

```sql
SELECT pg_database_size('mediacms');
SELECT count(*) FROM files_media;
```

### Transcoding Queue

Monitor transcoding tasks:

1. Log in to MediaCMS admin
2. Navigate to Django admin (`/admin/`)
3. Check `Encode` objects for stuck or failed tasks

## Common Daily Tasks

### 1. Check System Health

```bash
# Service status
make ps

# Recent logs
make logs --tail=100

# Resource usage
docker stats --no-stream
```

### 2. Monitor Transcoding

- Check for stuck transcoding tasks
- Monitor queue length
- Verify completed encodings

### 3. Review Logs

Check for errors:

```bash
# All services
make logs | grep -i error

# Specific service
make logs api | grep -i error
```

### 4. Check Disk Space

```bash
# Docker volumes
docker system df

# Host filesystem
df -h
```

## Health Checks

### Quick Health Check Script

```bash
#!/bin/bash
echo "=== Service Status ==="
make ps

echo -e "\n=== Resource Usage ==="
docker stats --no-stream

echo -e "\n=== Disk Usage ==="
docker system df
df -h
```

### Automated Monitoring

Consider setting up monitoring for:
- Service availability
- Disk space usage
- Transcoding queue length
- Error rates in logs
- Response times

## Log Locations

### Docker Installation

Logs are accessible via:

```bash
# All logs
make logs

# Specific service
make logs api
make logs celery_short
make logs celery_long
```

### Log Files

Logs are stored in Docker volumes:
- Application logs: `logs` volume
- Database logs: `postgres_data` volume

## Performance Indicators

### Good Health Indicators

- All services running
- Transcoding queue processing normally
- Disk usage below 80%
- Response times < 2 seconds
- No recurring errors in logs

### Warning Signs

- Services restarting frequently
- Transcoding queue backing up
- Disk usage > 80%
- High CPU/memory usage
- Recurring errors

## Next Steps

1. **[Monitoring Guide](../operations/monitoring.md)** - Detailed monitoring procedures
2. **[Logging Guide](../operations/logging.md)** - Log analysis and management
3. **[Performance Tuning](../operations/performance-tuning.md)** - Optimize system performance
4. **[Transcoding Management](../operations/transcoding-management.md)** - Manage video processing

## Troubleshooting

If you encounter issues:

- Check [Common Issues](../troubleshooting/common-issues.md)
- Review [Performance Issues](../troubleshooting/performance-issues.md)
- See [Debugging Guide](../troubleshooting/debugging-guide.md)

## Need Help?

- Review the [Operations Guide](../operations/README.md)
- Check the [Troubleshooting Guide](../troubleshooting/README.md)
- Contact your system administrator
