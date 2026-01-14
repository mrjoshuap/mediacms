# Transcoding Technical Details

Detailed technical information about MediaCMS transcoding.

## FFmpeg Configuration

MediaCMS uses FFmpeg for video transcoding. Most settings are in `files/helpers.py`.

### FFmpeg Preset

Controls encoding speed vs. quality:

```python
FFMPEG_DEFAULT_PRESET = "medium"
```

Available presets:
- `ultrafast` - Fastest, largest files
- `superfast` - Very fast
- `veryfast` - Fast
- `faster` - Faster than default
- `fast` - Fast
- `medium` - Default, balanced
- `slow` - Slower, smaller files
- `slower` - Very slow
- `veryslow` - Slowest, smallest files

### FFmpeg Commands

Paths to FFmpeg executables:

```python
FFMPEG_COMMAND = "ffmpeg"
FFPROBE_COMMAND = "ffprobe"
MP4HLS_COMMAND = "/usr/local/bin/mp4hls"
```

## Transcoding Settings

### Chunking

For long videos:

```python
CHUNKIZE_VIDEO_DURATION = 60 * 5  # Chunk videos > 5 minutes
VIDEO_CHUNKS_DURATION = 60 * 4    # 4 minute chunks
```

**Note**: `VIDEO_CHUNKS_DURATION` must be smaller than `CHUNKIZE_VIDEO_DURATION`.

### Minimum Resolutions

Always encode these resolutions, even if upscaling:

```python
MINIMUM_RESOLUTIONS_TO_ENCODE = [144, 240]
```

### Disable Transcoding

Show only original file:

```python
DO_NOT_TRANSCODE_VIDEO = True
```

**Note**: Disables sprite generation and HLS.

## Advanced Configuration

### Video Bitrates

Configure in `files/helpers.py`:
- Bitrates for different resolutions
- Codec-specific bitrates
- Quality settings

### Audio Encoding

Configure in `files/helpers.py`:
- Audio codec
- Audio bitrate
- Audio channels

### CRF Values

Constant Rate Factor for quality:
- Lower = better quality, larger files
- Higher = lower quality, smaller files
- Configure per codec in `files/helpers.py`

### Keyframe Settings

Configure keyframe intervals:
- GOP size
- Keyframe frequency
- Scene change detection

## Codec Support

### H.264

- Most compatible
- Default codec
- Good quality/size balance

### H.265 (HEVC)

- Better compression
- Smaller files
- Less compatible

### VP9

- Open codec
- Good for web
- Requires more processing

## Hardware Encoding

MediaCMS includes jellyfin-ffmpeg with hardware acceleration support.

**Note**: Hardware encoding requires manual configuration.

See [Advanced Configuration](../../administration/configuration/advanced-configuration.md) for details.

## Transcoding Workflow

### Original File Processing

1. File uploaded
2. Stored as original
3. Metadata extracted
4. Thumbnail generated

### Encoding Process

1. Encode tasks created for each profile
2. Tasks queued in Celery
3. Workers pick up tasks
4. FFmpeg transcodes video
5. Encoded file stored
6. Status updated

### Chunked Video Processing

1. Video split into chunks
2. Each chunk encoded independently
3. Chunks concatenated when complete
4. Final file stored

### HLS Generation

1. After encoding completes
2. MP4 converted to HLS
3. Video split into .ts segments
4. .m3u8 playlist created
5. Enables adaptive streaming

## Performance Optimization

### Worker Scaling

Add more workers for faster processing:

```bash
docker compose up -d --scale celery_long=3
```

### Preset Selection

Balance speed vs. quality:
- Faster presets = faster encoding, larger files
- Slower presets = slower encoding, smaller files

### Resolution Selection

Disable unnecessary resolutions to reduce processing time.

## Troubleshooting

See [Transcoding Issues](../../../troubleshooting/transcoding-issues.md) for common problems and solutions.

## Next Steps

- [Transcoding Overview](README.md) - Transcoding system overview
- [Configuration](../../administration/configuration/media-settings.md) - Configuration options
- [Troubleshooting](../../../troubleshooting/transcoding-issues.md) - Problem solving
