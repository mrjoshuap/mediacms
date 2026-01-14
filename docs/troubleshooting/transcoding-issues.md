# Transcoding Issues

Problems with video processing and transcoding.

## Failed Encodings

### Symptoms

- Videos stuck in processing
- Encoding tasks fail
- Error messages in logs

### Solutions

1. **Check Worker Logs**:

```bash
# Docker
make logs celery_long | grep -i error

# Single Server
sudo journalctl -u mediacms-celery-long | grep -i error
```

2. **Check FFmpeg**:

Verify FFmpeg is installed and working:

```bash
# Docker
docker compose exec api ffmpeg -version

# Single Server
ffmpeg -version
```

3. **Check File Format**:

Verify video format is supported. Check file with:

```bash
ffprobe input.mp4
```

4. **Check Disk Space**:

```bash
df -h
docker system df
```

5. **Check Memory**:

Transcoding requires memory. Check available memory:

```bash
free -h
docker stats
```

6. **Review Encode Objects**:

Check Django admin (`/admin/files/encode/`) for failed encodes and error messages.

## Slow Transcoding

### Symptoms

- Transcoding takes very long
- Queue backing up
- System slow

### Solutions

1. **Add More Workers**:

```bash
# Docker
docker compose up -d --scale celery_long=3

# Single Server
Deploy additional worker servers
```

2. **Optimize FFmpeg Preset**:

```python
FFMPEG_DEFAULT_PRESET = "veryfast"  # Faster encoding
```

**Note**: Faster presets create larger files.

3. **Check CPU Usage**:

```bash
top
docker stats
```

4. **Consider Hardware Encoding**:

If supported, enable hardware encoding (see [Advanced Configuration](../../administration/configuration/advanced-configuration.md)).

5. **Reduce Resolutions**:

Disable unnecessary encoding profiles in Django admin.

## Quality Issues

### Symptoms

- Poor video quality
- Artifacts
- Audio sync issues

### Solutions

1. **Adjust FFmpeg Preset**:

```python
FFMPEG_DEFAULT_PRESET = "slow"  # Better quality
```

2. **Check Source Quality**:

Verify source file quality is good.

3. **Review Encoding Profiles**:

Check bitrates and codec settings in Django admin.

4. **Test Different Codecs**:

Try different codecs (H.264, H.265, VP9).

## Sprite Generation Problems

### Symptoms

- Thumbnail previews not showing
- Sprite generation fails
- Error messages

### Solutions

1. **Check ImageMagick Limits**:

For large videos, increase ImageMagick limits:

Edit `/etc/ImageMagick-6/policy.xml`:

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

4. **Check Disk Space**:

Ensure sufficient disk space for sprite generation.

## HLS Generation Failures

### Symptoms

- HLS streaming not working
- .m3u8 files missing
- Streaming errors

### Solutions

1. **Check MP4HLS Command**:

```bash
# Verify mp4hls is installed
which mp4hls
```

2. **Check Worker Logs**:

```bash
make logs celery_long | grep -i hls
```

3. **Verify Encoding Complete**:

HLS generation requires encoding to complete first.

4. **Check File Permissions**:

Ensure workers can write HLS files.

## Chunk Encoding Issues

### Symptoms

- Long videos fail to encode
- Chunks not concatenating
- Encoding stuck

### Solutions

1. **Check Chunk Settings**:

```python
CHUNKIZE_VIDEO_DURATION = 60 * 5  # Chunk videos > 5 minutes
VIDEO_CHUNKS_DURATION = 60 * 4    # 4 minute chunks
```

2. **Check Worker Resources**:

Chunk encoding requires more resources.

3. **Monitor Chunk Progress**:

Check Django admin for chunk encoding status.

4. **Check Disk Space**:

Chunk encoding uses more disk space temporarily.

## Disable Transcoding

If transcoding causes too many issues:

```python
DO_NOT_TRANSCODE_VIDEO = True
```

**Note**: This disables:
- Multiple resolutions
- Sprite generation
- HLS streaming

Only original file will be shown.

## Next Steps

- [Common Issues](common-issues.md) - Other common problems
- [Performance Issues](performance-issues.md) - Performance optimization
- [Debugging Guide](debugging-guide.md) - Debugging techniques
