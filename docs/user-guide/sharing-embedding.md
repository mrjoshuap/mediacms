# Sharing & Embedding

Learn how to share your media and embed it on other websites.

## Sharing Media

### Share Button

1. Open your media page
2. Click the **Share** button
3. Choose sharing method:
   - Copy link
   - Share on social media
   - Email link

### Share with Timestamp

To share a video starting at a specific time:

1. Play the video to the desired time
2. Click **Share**
3. Select **"Share with timestamp"**
4. Copy the generated link

The link will include a `?t=` parameter with the timestamp in seconds.

Example:
```
https://your-mediacms.com/media/abc123?t=120
```

This starts the video at 2 minutes (120 seconds).

![Share with Timestamp](../images/Demo2.png)

### Direct Link Sharing

Copy the media URL directly from your browser's address bar:

```
https://your-mediacms.com/media/your-media-id
```

## Embedding Media

### Get Embed Code

1. Open your media page
2. Click **Embed** or **Share**
3. Select **Embed Code**
4. Copy the generated HTML code

### Embed Code Format

The embed code looks like this:

```html
<iframe src="https://your-mediacms.com/embed/your-media-id" 
        width="560" 
        height="315" 
        frameborder="0" 
        allowfullscreen>
</iframe>
```

### Customize Embed

You can modify the embed code:

- **Width**: Change `width` attribute (default: 560)
- **Height**: Change `height` attribute (default: 315)
- **Autoplay**: Add `?autoplay=1` to the URL
- **Start Time**: Add `?t=120` to start at specific time

Example with autoplay and start time:

```html
<iframe src="https://your-mediacms.com/embed/your-media-id?autoplay=1&t=120" 
        width="560" 
        height="315" 
        frameborder="0" 
        allowfullscreen>
</iframe>
```

### Embedding on Different Platforms

#### WordPress

1. Copy the embed code
2. In WordPress editor, switch to HTML mode
3. Paste the embed code
4. Publish

#### Other CMS Platforms

Most CMS platforms support iframe embeds:
1. Copy the embed code
2. Paste into your page editor
3. Save and publish

## Social Media Sharing

### Share to Social Networks

1. Click **Share** on your media
2. Select social network:
   - Facebook
   - Twitter
   - LinkedIn
   - Others (if configured)

The share will include:
- Media title
- Thumbnail image
- Link to media

## Privacy Considerations

### Public Media

- Can be shared and embedded anywhere
- Appears in search results
- Visible to everyone

### Unlisted Media

- Can be shared via direct link
- Can be embedded
- Not shown in search or listings

### Private Media

- Cannot be shared publicly
- Embed codes may not work
- Only accessible to authorized users

## Best Practices

1. **Use descriptive titles**: Makes shares more engaging
2. **Add thumbnails**: Attractive thumbnails improve click-through
3. **Consider privacy**: Choose appropriate visibility settings
4. **Test embeds**: Verify embeds work on target platforms
5. **Monitor usage**: Check analytics if available

## Troubleshooting

### Embed Not Working

- Verify media is public or unlisted
- Check if embedding is allowed by administrator
- Ensure iframe support on target platform
- Verify URL is correct

### Share Links Broken

- Check media visibility settings
- Verify media hasn't been deleted
- Contact administrator if issues persist

## Next Steps

- [Managing Media](managing-media.md) - Control who can access your content
- [Using Timestamps](subtitles-captions.md) - Learn about timestamp features
