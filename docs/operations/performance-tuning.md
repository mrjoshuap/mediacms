# Performance Tuning

Optimize MediaCMS performance for better responsiveness and throughput.

## Database Optimization

### Connection Pooling

```python
DATABASES = {
    'default': {
        'CONN_MAX_AGE': 600,  # Reuse connections for 10 minutes
    }
}
```

### Query Optimization

- Use `select_related()` for ForeignKey relationships
- Use `prefetch_related()` for ManyToMany relationships
- Add database indexes for frequently queried fields
- Review slow query log

### Read Replicas

For high-traffic deployments:
- Set up PostgreSQL read replicas
- Use for read operations
- Keep writes on primary

## Caching

### Redis Cache Configuration

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

### Cache Strategies

- Cache frequently accessed data
- Cache expensive queries
- Cache API responses where appropriate
- Use cache versioning for invalidation

## Transcoding Optimization

### Worker Scaling

Add more workers:

```bash
docker compose up -d --scale celery_long=3
```

### FFmpeg Preset

Balance speed vs. quality:

```python
FFMPEG_DEFAULT_PRESET = "veryfast"  # Faster encoding
```

**Note**: Faster presets create larger files.

### Resolution Selection

Disable unnecessary resolutions to reduce processing time.

## Static File Optimization

### CDN Integration

Use CDN for static files:

```python
STATIC_URL = 'https://cdn.example.com/static/'
```

### Compression

Enable gzip compression in nginx:
- Compress CSS, JavaScript
- Compress API responses
- Reduce bandwidth usage

## Nginx Optimization

### Caching

Configure nginx caching:
- Cache static files
- Cache media files
- Set appropriate cache headers

### Buffer Sizes

Optimize buffer sizes for your workload:

```nginx
client_max_body_size 4G;
client_body_buffer_size 128k;
proxy_buffering on;
proxy_buffer_size 4k;
proxy_buffers 8 4k;
```

## Application Optimization

### Database Queries

- Minimize database queries
- Use select_related/prefetch_related
- Avoid N+1 queries
- Use database indexes

### Code Optimization

- Profile application code
- Optimize slow functions
- Use async where appropriate
- Minimize external API calls

## Monitoring Performance

### Key Metrics

- Response times
- Request rates
- Database query times
- Cache hit rates
- Queue lengths

### Tools

- Django Debug Toolbar (development)
- Application Performance Monitoring (APM)
- Database query profiling
- Load testing tools

## Scaling Strategies

### Horizontal Scaling

- Add more API instances
- Add more workers
- Use load balancer
- Scale database with read replicas

### Vertical Scaling

- Increase CPU
- Increase RAM
- Use faster storage (SSD)
- Optimize configuration

## Best Practices

1. **Monitor First**: Understand current performance
2. **Profile Code**: Identify bottlenecks
3. **Optimize Incrementally**: Make one change at a time
4. **Test Changes**: Verify improvements
5. **Document**: Keep notes on optimizations

## Next Steps

- [Scaling Guide](../../administration/maintenance/scaling.md) - Scale your deployment
- [Monitoring](monitoring.md) - Monitor performance
- [Performance Issues](../../troubleshooting/performance-issues.md) - Troubleshoot performance
