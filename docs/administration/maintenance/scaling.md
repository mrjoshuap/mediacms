# Scaling MediaCMS

Scale your MediaCMS deployment to handle increased load.

## Scaling Strategies

### Horizontal Scaling

Add more instances of services:
- API servers
- Celery workers
- Load balancers

### Vertical Scaling

Increase resources on existing servers:
- More CPU
- More RAM
- Faster storage

## Scaling API Servers

### Docker Installation

1. **Scale API service**:

```bash
docker compose up -d --scale api=3
```

2. **Configure load balancer**:

Update nginx configuration or use external load balancer.

3. **Session storage**:

Ensure sessions stored in Redis (default) for shared sessions.

### Single Server Installation

1. **Deploy multiple servers**
2. **Configure load balancer**
3. **Share session storage** (Redis)
4. **Shared media storage** (NFS, object storage)

## Scaling Workers

### Add More Workers

**Docker Installation**:

```bash
# Scale short workers
docker compose up -d --scale celery_short=3

# Scale long workers
docker compose up -d --scale celery_long=3
```

**Single Server Installation**:

1. Deploy additional worker servers
2. Configure Redis connection
3. Share media storage (NFS, object storage)

### Worker Priorities

Configure task routing for different worker types:

```python
CELERY_TASK_ROUTES = {
    'files.tasks.produce_thumbnail': {'queue': 'short'},
    'files.tasks.encode_video': {'queue': 'long'},
}
```

## Database Scaling

### Read Replicas

Set up PostgreSQL read replicas:

1. Configure replication
2. Use read replicas for reads
3. Keep writes on primary

### Connection Pooling

Use connection pooling:

```python
DATABASES = {
    'default': {
        # ... settings ...
        'CONN_MAX_AGE': 600,
    }
}
```

Or use PgBouncer for connection pooling.

### Managed Databases

Consider managed database services:
- AWS RDS
- Google Cloud SQL
- Azure Database

## Storage Scaling

### Network Storage

Use network storage for shared access:
- **NFS**: Network File System
- **EFS**: AWS Elastic File System
- **GlusterFS**: Distributed file system

### Object Storage

For large deployments, use object storage:
- **AWS S3**: Amazon S3
- **Google Cloud Storage**
- **Azure Blob Storage**

Configure in `local_settings.py`:

```python
# Example S3 configuration
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
AWS_STORAGE_BUCKET_NAME = 'your-bucket'
AWS_S3_REGION_NAME = 'us-east-1'
```

### CDN Integration

Use CDN for media delivery:
- CloudFlare
- AWS CloudFront
- Fastly

## Redis Scaling

### Redis Cluster

For high availability:
- Redis Sentinel
- Redis Cluster
- Managed Redis (AWS ElastiCache, etc.)

### Memory Management

Monitor Redis memory:

```bash
redis-cli INFO memory
```

Configure eviction policy:

```bash
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## Load Balancing

### Nginx Load Balancing

Configure upstream servers:

```nginx
upstream mediacms_api {
    server api1:8000;
    server api2:8000;
    server api3:8000;
}

server {
    location / {
        proxy_pass http://mediacms_api;
    }
}
```

### External Load Balancers

- AWS ALB/NLB
- Google Cloud Load Balancer
- Azure Load Balancer
- HAProxy

## Monitoring Scaling

### Key Metrics

- Request rate
- Response times
- Queue lengths
- Resource usage
- Error rates

### Scaling Triggers

Set up auto-scaling based on:
- CPU usage
- Memory usage
- Queue length
- Request rate

## Best Practices

1. **Start small**: Scale gradually
2. **Monitor**: Watch metrics closely
3. **Test**: Test scaling in staging
4. **Document**: Document your scaling setup
5. **Plan**: Plan for peak loads

## Cost Considerations

- **Compute**: More instances = more cost
- **Storage**: Network storage may cost more
- **Bandwidth**: CDN and load balancer costs
- **Database**: Managed databases cost more

## Next Steps

- [Performance Tuning](../../operations/performance-tuning.md) - Optimize performance
- [Monitoring](monitoring.md) - Monitor your system
- [Architecture](../installation/architecture.md) - Understand architecture
