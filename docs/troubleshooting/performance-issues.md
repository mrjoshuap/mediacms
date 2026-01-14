# Performance Issues

Optimize MediaCMS performance and resolve slowdowns.

## Slow Page Loads

### Symptoms

- Pages take long to load
- Timeouts
- Slow API responses

### Solutions

1. **Check Database Performance**:

```bash
# Check slow queries
# Review database logs
# Check connection count
```

2. **Enable Database Query Caching**:

```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}
```

3. **Optimize Database Queries**:

- Add database indexes
- Review query performance
- Use select_related/prefetch_related

4. **Check Static Files**:

Ensure static files are served efficiently:
- Use CDN
- Enable compression
- Verify caching

5. **Review Application Logs**:

```bash
make logs api | grep -i slow
```

## High Resource Usage

### Symptoms

- High CPU usage
- High memory usage
- System slow

### Solutions

1. **Monitor Resources**:

```bash
# Docker
docker stats

# System
top
htop
```

2. **Identify Resource Hogs**:

- Check which services use most resources
- Review worker processes
- Check database connections

3. **Scale Workers**:

Add more workers if transcoding queue is long:

```bash
docker compose up -d --scale celery_long=3
```

4. **Optimize Transcoding**:

- Use faster FFmpeg presets (larger files)
- Disable unnecessary resolutions
- Consider hardware encoding

5. **Review Configuration**:

- Reduce concurrent tasks
- Optimize cache settings
- Review connection pooling

## Database Performance

### Symptoms

- Slow queries
- High connection count
- Database locks

### Solutions

1. **Connection Pooling**:

```python
DATABASES = {
    'default': {
        'CONN_MAX_AGE': 600,  # Reuse connections
    }
}
```

Or use PgBouncer for connection pooling.

2. **Add Indexes**:

```bash
python manage.py migrate
```

3. **Optimize Queries**:

- Review slow query log
- Add missing indexes
- Optimize query patterns

4. **Read Replicas**:

For high-traffic deployments, use read replicas.

5. **Database Maintenance**:

```bash
# Vacuum database
VACUUM ANALYZE;
```

## Redis Issues

### Symptoms

- Cache misses
- High memory usage
- Slow responses

### Solutions

1. **Check Redis Memory**:

```bash
redis-cli INFO memory
```

2. **Configure Eviction**:

```bash
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

3. **Monitor Redis**:

```bash
redis-cli MONITOR
```

4. **Scale Redis**:

Consider Redis Cluster or managed Redis for high availability.

## Transcoding Performance

### Symptoms

- Long transcoding times
- Queue backing up
- Slow video processing

### Solutions

1. **Add Workers**:

```bash
docker compose up -d --scale celery_long=3
```

2. **Optimize FFmpeg**:

```python
FFMPEG_DEFAULT_PRESET = "veryfast"  # Faster encoding
```

3. **Hardware Encoding**:

Enable hardware encoding if supported (see [Advanced Configuration](../../administration/configuration/advanced-configuration.md)).

4. **Reduce Resolutions**:

Disable unnecessary encoding profiles.

5. **Prioritize Tasks**:

Configure task routing for different priorities.

## Network Performance

### Symptoms

- Slow media delivery
- High bandwidth usage
- Connection issues

### Solutions

1. **Use CDN**:

Configure CDN for media delivery:
- CloudFlare
- AWS CloudFront
- Fastly

2. **Optimize Nginx**:

- Enable compression
- Configure caching
- Optimize buffer sizes

3. **Object Storage**:

Use object storage (S3, etc.) for large deployments.

4. **Network Monitoring**:

Monitor network usage and identify bottlenecks.

## Caching Optimization

### Symptoms

- Frequent cache misses
- Slow responses
- High database load

### Solutions

1. **Configure Redis Cache**:

```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'TIMEOUT': 300,
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}
```

2. **Cache Static Content**:

Configure nginx to cache static files.

3. **Cache API Responses**:

Implement API response caching where appropriate.

4. **Monitor Cache Hit Rate**:

Track cache performance and adjust as needed.

## Scaling Recommendations

### Small Deployment

- 1 API instance
- 1-2 workers
- Single database
- Local storage

### Medium Deployment

- 2-3 API instances
- 2-4 workers
- Database with read replicas
- Network storage or object storage

### Large Deployment

- Multiple API instances with load balancer
- Multiple workers
- Managed database
- Object storage + CDN

## Monitoring Performance

### Key Metrics

- Response times
- Request rates
- Error rates
- Queue lengths
- Resource usage

### Tools

- Prometheus + Grafana
- Application Performance Monitoring (APM)
- Log aggregation (ELK)
- Database monitoring

## Next Steps

- [Scaling Guide](../../administration/maintenance/scaling.md) - Scale your deployment
- [Monitoring Guide](../../administration/maintenance/monitoring.md) - Monitor your system
- [Common Issues](common-issues.md) - Other common problems
