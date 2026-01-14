# Media Settings

Configure media upload, processing, and display options.

## Upload Limits

### Maximum File Size

Set the maximum size for uploaded files:

```python
UPLOAD_MAX_SIZE = 4 * 1024 * 1024 * 1024  # Default: 4GB
```

Example for 1GB limit:

```python
UPLOAD_MAX_SIZE = 1024 * 1024 * 1024  # 1GB
```

### Maximum Files Per Upload

Limit how many files can be uploaded at once:

```python
UPLOAD_MAX_FILES_NUMBER = 100  # Default: 100 files
```

### User Upload Limit

Limit total media items per user:

```python
NUMBER_OF_MEDIA_USER_CAN_UPLOAD = 100  # Default: 100 items
```

## Allowed File Types

Control which file types can be uploaded:

```python
ALLOWED_MEDIA_UPLOAD_TYPES = ["video", "audio", "image", "pdf"]  # Default
```

To allow all file types:

```python
ALLOWED_MEDIA_UPLOAD_TYPES = ["all"]
```

## Custom URLs

Enable custom URLs for media:

```python
ALLOW_CUSTOM_MEDIA_URLS = True
```

When enabled:
- Users can edit media URLs
- URLs must be unique
- Useful for SEO-friendly URLs

## Transcoding

### Disable Transcoding

Show only original files without transcoding:

```python
DO_NOT_TRANSCODE_VIDEO = True
```

**Note**: This disables:
- Multiple resolution encoding
- Sprite generation (thumbnail previews)
- HLS streaming

### Transcoding Profiles

Manage transcoding profiles via Django admin:

1. Navigate to `/admin/files/encodeprofile/`
2. Enable/disable profiles
3. Modify resolutions and codecs

## Playlist Limits

Set maximum media items per playlist:

```python
MAX_MEDIA_PER_PLAYLIST = 100  # Default: 100 items
```

## Comment Limits

Set maximum characters per comment:

```python
MAX_CHARS_FOR_COMMENT = 10000  # Default: 10,000 characters
```

## Download Settings

Control download availability:

Edit `templates/config/installation/features.html`:

```html
download: false  # Disable downloads
download: true   # Enable downloads (default)
```

Users can enable downloads per media item in the media edit page.

## Video Sprites

Configure sprite generation for video thumbnails:

```python
SPRITE_NUM_SECS = 10  # Extract sprite every 10 seconds (default)
```

To change:
1. Edit `frontend/src/static/js/components/media-viewer/VideoViewer/index.js`
2. Change `seconds: 10` to desired value
3. Set same value in `SPRITE_NUM_SECS`
4. Rebuild frontend: `make build-frontend`

## Transcoding Settings

### FFmpeg Preset

Control encoding speed vs. quality:

```python
FFMPEG_DEFAULT_PRESET = "medium"  # Options: ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow
```

Faster presets = larger files, slower encoding
Slower presets = smaller files, slower encoding

### Video Chunking

For long videos, configure chunking:

```python
CHUNKIZE_VIDEO_DURATION = 60 * 5  # Chunk videos longer than 5 minutes
VIDEO_CHUNKS_DURATION = 60 * 4    # Each chunk is 4 minutes
```

### Minimum Resolutions

Always encode these resolutions, even if upscaling:

```python
MINIMUM_RESOLUTIONS_TO_ENCODE = [144, 240]
```

## Whisper Transcription

### Enable Transcription

```python
USE_WHISPER_TRANSCRIBE = True
```

**Note**: Requires Docker full installation with Whisper support.

### Transcription Model

```python
WHISPER_MODEL = 'base'  # Options: tiny, base, small, medium, large
```

### User Permissions

Control who can request transcription:

```python
USER_CAN_TRANSCRIBE_VIDEO = True   # All users (default)
USER_CAN_TRANSCRIBE_VIDEO = False  # Disabled
```

## Next Steps

- [Transcoding Guide](../../../development/transcoding/README.md) - Detailed transcoding information
- [Advanced Configuration](advanced-configuration.md) - Advanced options
- [Troubleshooting](../../../troubleshooting/transcoding-issues.md) - Transcoding problems
