# Subtitles & Captions

Add subtitles and captions to your videos to make them more accessible and reach a wider audience.

## Overview

MediaCMS supports:
- **Subtitles**: Text versions of dialogue
- **Captions**: Include sound effects and speaker identification
- **Multiple languages**: Add subtitles in different languages
- **Automatic transcription**: Generate subtitles automatically (if enabled)

## Supported Formats

MediaCMS uses the **WebVTT** (`.vtt`) format for subtitles. This is a standard web format supported by most video players.

## Adding Subtitles Manually

### Step 1: Prepare Your Subtitle File

Create a `.vtt` file. Example format:

```vtt
WEBVTT

00:00:00.000 --> 00:00:05.000
Welcome to MediaCMS

00:00:05.000 --> 00:00:10.000
This is a subtitle example
```

### Step 2: Upload Subtitles

1. Navigate to your video page
2. Click **Edit Subtitles** button

![Edit Subtitles Button](../images/Click-EDIT-SUBTITLE.png)

3. Select the language from the dropdown menu

![Language Menu](../images/Click-Subtitle-Language-Menu.png)

![Select Language](../images/Subtitles-captions1.png)

4. Click **Browse** to select your `.vtt` file

![Browse Subtitles](../images/Subtitles-captions2.png)

5. Select your subtitle file

![Select File](../images/Subtitles-captions3.png)

6. Click **Add** to upload

![Add Button](../images/Click-ADD-button.png)

### Step 3: View Subtitles

Once uploaded, subtitles will appear in the video player:

1. Play your video
2. Click the **CC** (Closed Captions) button
3. Select your language
4. Subtitles will display during playback

![CC Display](../images/CC-display.png)

## Multiple Languages

You can add subtitles in multiple languages:

1. Follow the upload process for each language
2. Select different languages from the dropdown
3. Viewers can switch between languages using the CC button

## Automatic Transcription

If enabled by your administrator, MediaCMS can automatically generate subtitles using Whisper:

1. Navigate to your video
2. Click **Transcribe** (if available)
3. Wait for processing to complete
4. Review and edit the generated subtitles

**Note**: Automatic transcription requires:
- Whisper transcription enabled by administrator
- Sufficient server resources
- Processing time (varies by video length)

## Editing Subtitles

### Download Existing Subtitles

1. Open your video
2. Click **Edit Subtitles**
3. Download the existing `.vtt` file
4. Edit in a text editor
5. Re-upload the edited file

### Online Editors

You can use online VTT editors:
- [Amara](https://amara.org/)
- [Subtitle Edit](https://nikse.dk/subtitleedit)
- Various browser-based editors

## Subtitle Best Practices

1. **Timing**: Ensure subtitles appear at the right time
2. **Readability**: Keep text concise and readable
3. **Punctuation**: Use proper punctuation
4. **Speaker identification**: Include speaker names if helpful
5. **Sound effects**: Include important sound descriptions

## Troubleshooting

### Subtitles Not Showing

- Verify `.vtt` file format is correct
- Check file was uploaded successfully
- Ensure CC button is enabled in player
- Verify language is selected

### Timing Issues

- Check timestamp format (HH:MM:SS.mmm)
- Ensure timestamps are sequential
- Verify timestamps match video duration

### Format Errors

- Validate `.vtt` file syntax
- Check for special characters
- Ensure proper line breaks
- Verify encoding (UTF-8 recommended)

## Converting Other Formats

If you have subtitles in other formats (SRT, ASS, etc.), convert them to VTT:

### Online Converters

- [Subtitle Converter](https://www.subtitleconverter.org/)
- [CloudConvert](https://cloudconvert.com/)

### Command Line (FFmpeg)

```bash
ffmpeg -i input.srt output.vtt
```

## Next Steps

- [Video Editing](video-editing.md) - Trim and edit videos
- [Managing Media](managing-media.md) - Organize your content
