# Transcoding Management

Manage video transcoding queue and processes.

## Queue Management

### Check Queue Status

**Django Admin**:

1. Log in to `/admin/`
2. Navigate to `Files > Encode`
3. Filter by status:
   - `pending`: Waiting to be processed
   - `running`: Currently processing
   - `success`: Completed successfully
   - `error`: Failed

### Queue Length

Monitor queue length:

```python
# Django shell
from files.models import Encode
pending = Encode.objects.filter(status='pending').count()
running = Encode.objects.filter(status='running').count()
```

### Worker Status

**Docker Installation**:

```bash
make ps | grep celery
```

**Check Worker Logs**:

```bash
make logs celery_long
```

## Managing Tasks

### Retry Failed Tasks

**Django Admin**:

1. Navigate to `Files > Encode`
2. Filter by `status = error`
3. Select failed encodes
4. Manually retry or delete

**Django Shell**:

```python
from files.models import Encode
from files.tasks import encode_video

# Retry failed encode
encode = Encode.objects.get(id=encode_id, status='error')
encode.status = 'pending'
encode.save()
```

### Cancel Tasks

Tasks in queue can be cancelled:

```python
# Django shell
from files.models import Encode

# Cancel pending tasks
Encode.objects.filter(status='pending').update(status='cancelled')
```

### Prioritize Tasks

Configure task routing for priorities:

```python
CELERY_TASK_ROUTES = {
    'files.tasks.encode_video': {'queue': 'long'},
    'files.tasks.produce_thumbnail': {'queue': 'short'},
}
```

## Worker Management

### Scale Workers

**Add More Workers**:

```bash
# Docker
docker compose up -d --scale celery_long=3

# Single Server
Deploy additional worker servers
```

### Worker Configuration

**Concurrency**:

Configure worker concurrency:

```python
# In celery command or configuration
-c 1  # 1 worker process
-c 4  # 4 worker processes
```

**Prefetch**:

```python
--prefetch-multiplier=1  # Don't prefetch tasks
```

### Worker Monitoring

Monitor worker health:

```bash
# Check worker status
docker compose exec celery_long celery -A cms inspect active

# Check worker stats
docker compose exec celery_long celery -A cms inspect stats
```

## Performance Optimization

### Preset Selection

Choose appropriate FFmpeg preset:

```python
FFMPEG_DEFAULT_PRESET = "veryfast"  # Faster encoding
```

### Resolution Management

Disable unnecessary resolutions:
- Reduces processing time
- Saves storage space
- Faster queue processing

### Chunking Configuration

Optimize chunking for your videos:

```python
CHUNKIZE_VIDEO_DURATION = 60 * 5  # Chunk videos > 5 minutes
VIDEO_CHUNKS_DURATION = 60 * 4    # 4 minute chunks
```

## Troubleshooting

### Stuck Tasks

Tasks stuck in "running" state:

1. Check worker logs
2. Verify workers are running
3. Check for resource issues
4. Manually reset status if needed

### Slow Processing

- Add more workers
- Use faster FFmpeg preset
- Check system resources
- Review queue length

### Failed Tasks

- Check error messages in logs
- Verify file formats
- Check disk space
- Review FFmpeg errors

See [Transcoding Issues](../../troubleshooting/transcoding-issues.md) for detailed troubleshooting.

## Next Steps

- [Transcoding Guide](../../development/transcoding/README.md) - Transcoding system overview
- [Performance Tuning](performance-tuning.md) - Optimize performance
- [Troubleshooting](../../troubleshooting/transcoding-issues.md) - Problem solving
