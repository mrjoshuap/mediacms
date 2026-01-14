# Docker Full Installation (with Whisper)

Install MediaCMS with Whisper transcription support and additional codecs.

## Overview

The full installation includes:
- All standard MediaCMS features
- Whisper automatic transcription
- Additional video codecs
- Higher resource requirements

## Prerequisites

- Docker and Docker Compose installed
- **8GB+ RAM recommended** (Whisper requires more memory)
- **4+ CPUs recommended**
- Sufficient disk space (Whisper models require additional space)

## Installation Steps

### Step 1: Clone MediaCMS

```bash
git clone https://github.com/mediacms-io/mediacms
cd mediacms
```

### Step 2: Start with Whisper Support

Using Makefile (recommended):

```bash
make up-full
```

Or using docker compose directly:

```bash
docker compose -f docker-compose.yaml -f docker-compose.full.yaml up -d
```

The `docker-compose.full.yaml` file is an override that:
- Uses the `worker-full` build target for `celery_long`
- Includes Whisper and additional codecs
- Configures necessary dependencies

### Step 3: Enable Whisper Transcription

Edit `custom/local_settings.py`:

```python
USE_WHISPER_TRANSCRIBE = True
```

Restart services:

```bash
make restart-full
```

Or:

```bash
docker compose -f docker-compose.yaml -f docker-compose.full.yaml restart
```

### Step 4: Get Admin Credentials

Same as standard installation - check migration logs:

```bash
docker compose logs migrations | grep "Created admin user"
```

## Whisper Configuration

### Default Model

Whisper uses the base model by default. To change:

Edit `custom/local_settings.py`:

```python
WHISPER_MODEL = 'base'  # Options: tiny, base, small, medium, large
```

Available models (larger = better quality, slower):
- `tiny` - Fastest, lowest quality
- `base` - Default, good balance
- `small` - Better quality
- `medium` - High quality
- `large` - Best quality, slowest

### User Permissions

By default, all users can request transcription. To restrict:

```python
USER_CAN_TRANSCRIBE_VIDEO = False
```

## Service Differences

The full installation uses:
- **celery_long (worker-full)**: Includes Whisper and additional codecs
- Larger Docker images
- More memory usage

All other services remain the same as standard installation.

## Managing Full Installation

### Check Status

```bash
make ps-full
```

Or:

```bash
docker compose -f docker-compose.yaml -f docker-compose.full.yaml ps
```

### View Logs

```bash
make logs-full
```

Or:

```bash
docker compose -f docker-compose.yaml -f docker-compose.full.yaml logs
```

### Restart Services

```bash
make restart-full
```

### Stop Services

```bash
make down-full
```

### Start Services

```bash
make up-full
```

## Resource Usage

### Memory

- Standard: ~2-4GB
- Full: ~4-8GB+ (depending on Whisper model)

### CPU

- Standard: 2-4 CPUs sufficient
- Full: 4+ CPUs recommended for transcription

### Disk Space

- Whisper models: ~1-3GB per model
- Additional codecs: Minimal

## Updating

Same process as standard installation:

```bash
cd /path/to/mediacms
git pull
make pull-full
make down-full
make up-full
```

## Troubleshooting

### Transcription Not Working

1. Verify Whisper is enabled:

```bash
docker compose exec api python manage.py shell
>>> from django.conf import settings
>>> settings.USE_WHISPER_TRANSCRIBE
True
```

2. Check worker logs:

```bash
make logs-full celery_long | grep -i whisper
```

3. Verify model is downloaded (check worker-full container)

### High Memory Usage

- Use smaller Whisper model (`tiny` or `base`)
- Reduce concurrent transcription tasks
- Increase available RAM

### Slow Transcription

- Normal for large videos
- Use smaller model for faster processing
- Increase CPU resources
- Check worker queue length

## Switching Between Modes

### From Standard to Full

```bash
make down
make up-full
```

Then enable Whisper in `custom/local_settings.py`.

### From Full to Standard

```bash
make down-full
make up
```

Disable Whisper in `custom/local_settings.py`:

```python
USE_WHISPER_TRANSCRIBE = False
```

## Next Steps

1. [Configuration Guide](../../configuration/README.md) - Configure your installation
2. [Architecture Guide](architecture.md) - Understand the system architecture
3. [User Guide](../../../user-guide/subtitles-captions.md) - Learn about transcription features
