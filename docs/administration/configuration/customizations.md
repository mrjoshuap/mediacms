# Customizations Guide

This guide covers all methods for customizing MediaCMS, including templates, CSS, JavaScript, logos, tracking, and more.

## Table of Contents

- [Overview](#overview)
- [Custom Settings](#custom-settings)
- [Custom CSS](#custom-css)
- [Custom JavaScript](#custom-javascript)
- [Template Overrides](#template-overrides)
- [Custom Logos](#custom-logos)
- [Google Analytics](#google-analytics)
- [Cookie Consent](#cookie-consent)
- [Static Files](#static-files)
- [Deployment Considerations](#deployment-considerations)

## Overview

MediaCMS supports extensive customization through the `custom/` directory. All customizations are preserved during updates and upgrades.

**Key Principles:**
- Never edit files in `templates/` or `static/` directly
- Use `custom/` directory for all customizations
- Most changes require restarting the API service
- Custom templates take precedence over default templates

## Custom Settings

Override any Django setting using `custom/local_settings.py`.

### Setup

1. Copy the example file:
   ```bash
   cp custom/local_settings.py.example custom/local_settings.py
   ```

2. Edit `custom/local_settings.py` with your settings

3. Restart the API service:
   - **Docker**: `docker compose restart api`
   - **Single-server**: `sudo systemctl restart mediacms-api`

### Common Settings

```python
# Portal branding
PORTAL_NAME = "My Custom Portal"
PORTAL_DESCRIPTION = "A custom video platform"

# Security
ALLOWED_HOSTS = ['media.example.com', 'www.media.example.com']
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Email
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.example.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'noreply@example.com'
EMAIL_HOST_PASSWORD = 'your-password'
DEFAULT_FROM_EMAIL = 'MediaCMS <noreply@example.com>'

# Features
CAN_LIKE_MEDIA = True
CAN_DISLIKE_MEDIA = True
CAN_REPORT_MEDIA = True
CAN_SHARE_MEDIA = True
UPLOAD_MEDIA_ALLOWED = True
```

See [Configuration Reference](../reference/configuration-reference.md) for all available settings.

## Custom CSS

Add custom CSS to override or extend MediaCMS styles.

### Setup

1. Create your CSS file:
   ```bash
   # Docker or single-server
   mkdir -p custom/static/css
   touch custom/static/css/custom.css
   ```

2. Add CSS path to `custom/local_settings.py`:
   ```python
   EXTRA_CSS_PATHS = ["/custom/static/css/custom.css"]
   ```

3. Restart API service

### Example CSS

```css
/* Custom portal header */
.portal-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem;
}

/* Custom video thumbnails */
.item-thumb {
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
}

.item-thumb:hover {
    transform: scale(1.05);
}

/* Custom button styles */
.btn-primary {
    background-color: #your-brand-color;
    border-color: #your-brand-color;
}

/* Override default colors */
:root {
    --primary-color: #your-color;
    --secondary-color: #your-color;
}
```

### Multiple CSS Files

You can include multiple CSS files:

```python
EXTRA_CSS_PATHS = [
    "/custom/static/css/custom.css",
    "/custom/static/css/theme.css",
    "/custom/static/css/overrides.css",
]
```

Files are loaded in the order specified.

## Custom JavaScript

Add custom JavaScript for additional functionality.

### Setup

1. Create your JavaScript file:
   ```bash
   mkdir -p custom/static/js
   touch custom/static/js/custom.js
   ```

2. Add JS path to `custom/local_settings.py`:
   ```python
   EXTRA_JS_PATHS = ["/custom/static/js/custom.js"]
   ```

3. Restart API service

### Example JavaScript

```javascript
// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Custom JavaScript loaded');
    
    // Example: Add custom event listeners
    const mediaItems = document.querySelectorAll('.item-thumb');
    mediaItems.forEach(item => {
        item.addEventListener('click', function() {
            console.log('Media item clicked:', this);
        });
    });
    
    // Example: Custom analytics tracking
    function trackEvent(category, action, label) {
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                'event_category': category,
                'event_label': label
            });
        }
    }
    
    // Example: Custom functionality
    function initCustomFeatures() {
        // Your custom code here
    }
    
    initCustomFeatures();
});
```

### Multiple JavaScript Files

You can include multiple JavaScript files:

```python
EXTRA_JS_PATHS = [
    "/custom/static/js/custom.js",
    "/custom/static/js/analytics.js",
    "/custom/static/js/features.js",
]
```

Files are loaded in the order specified, after the main `_commons.js` file.

## Template Overrides

Override any template by placing it in `custom/templates/` with the same directory structure.

### How It Works

- Templates in `custom/templates/` take precedence over `templates/`
- Directory structure must match exactly
- You can override entire templates or extend them

### Setup

1. Copy the template you want to override:
   ```bash
   # Example: Override root template
   cp templates/root.html custom/templates/root.html
   ```

2. Edit the template in `custom/templates/`

3. Restart API service

### Common Template Overrides

#### Override Root Template

```bash
cp templates/root.html custom/templates/root.html
```

Edit `custom/templates/root.html` to add custom elements:

```django
{% extends "root.html" %}
{% load static %}

{% block head %}
    {{ block.super }}
    <!-- Custom head content -->
    <meta name="custom-meta" content="value">
{% endblock %}

{% block bottomimports %}
    {{ block.super }}
    <!-- Custom scripts -->
    <script>
        // Your custom code
    </script>
{% endblock %}
```

#### Override Header Component

```bash
mkdir -p custom/templates/components
cp templates/components/header.html custom/templates/components/header.html
```

Edit `custom/templates/components/header.html` to customize the header.

#### Create Tracking Template

Create `custom/templates/tracking.html` for Google Analytics:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

Then include it in `custom/templates/root.html`:

```django
{% block head %}
    {{ block.super }}
    {% include "tracking.html" %}
{% endblock %}
```

## Custom Logos

Replace MediaCMS logos with your own branding.

### Setup

1. Place logo files in `custom/static/images/`:
   - `logo_dark.png` or `logo_dark.svg` (for dark theme)
   - `logo_light.png` or `logo_light.svg` (for light theme)

2. Add to `custom/local_settings.py`:
   ```python
   # PNG logos
   PORTAL_LOGO_DARK_PNG = "/custom/static/images/logo_dark.png"
   PORTAL_LOGO_LIGHT_PNG = "/custom/static/images/logo_light.png"
   
   # Or SVG logos (takes priority over PNG)
   PORTAL_LOGO_DARK_SVG = "/custom/static/images/logo_dark.svg"
   PORTAL_LOGO_LIGHT_SVG = "/custom/static/images/logo_light.svg"
   ```

3. Restart API service

### Logo Requirements

- **PNG**: Recommended size 200x50px or larger, transparent background preferred
- **SVG**: Vector format, scalable, recommended for best quality
- **SVG takes priority**: If both SVG and PNG are set, SVG will be used

## Google Analytics

Add Google Analytics tracking to your MediaCMS installation.

### Recommended Method: Template Override

This method works for all deployment types and is the most flexible.

#### Step 1: Create Tracking Template

Create `custom/templates/tracking.html`:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

Replace `GA_MEASUREMENT_ID` with your Google Analytics Measurement ID (e.g., `G-XXXXXXXXXX`).

#### Step 2: Include in Root Template

Create `custom/templates/root.html`:

```django
{% extends "root.html" %}
{% load static %}

{% block head %}
    {{ block.super }}
    {% include "tracking.html" %}
{% endblock %}
```

#### Step 3: Restart API Service

```bash
# Docker
docker compose restart api

# Single-server
sudo systemctl restart mediacms-api
```

### Alternative: Google Analytics 4 (GA4)

For GA4, use the same method but with GA4 code:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Custom Event Tracking

Add custom event tracking in your JavaScript:

```javascript
// In custom/static/js/custom.js
function trackMediaView(mediaId, mediaTitle) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'media_view', {
            'media_id': mediaId,
            'media_title': mediaTitle
        });
    }
}
```

See `custom/examples/google-analytics-gtag.md` for detailed instructions.

## Cookie Consent

Add a cookie consent banner to comply with privacy regulations (GDPR, CCPA, etc.).

### Setup

1. Override the header component:
   ```bash
   mkdir -p custom/templates/components
   cp templates/components/header.html custom/templates/components/header.html
   ```

2. Edit `custom/templates/components/header.html` and add your cookie consent code.

### Example: Website Policies Cookie Consent

```django
<div id="app-header"></div>

<!-- Cookie Consent -->
<script src="https://cdn.websitepolicies.io/lib/cookieconsent/cookieconsent.min.js" defer></script>
<script>
    window.addEventListener("load", function () {
        window.wpcc.init({
            border: "normal",
            corners: "normal",
            colors: { 
                popup: { background: "#222222", text: "#ffffff", border: "#FF8000" }, 
                button: { background: "#FF8000", text: "#000000" } 
            },
            position: "top-right",
            content: { 
                message: "Hi there, we are using cookies on this website. We don't use tracking or analytics here, just the essentials for the Website to work.\n", 
                button: "Understood! Yum!", 
                link: "Click here to learn more." 
            },
        });
    });
</script>
```

### Example: Custom Cookie Consent

You can implement your own cookie consent solution:

```django
<div id="app-header"></div>

<!-- Custom Cookie Consent -->
<div id="cookie-consent" style="display: none;">
    <p>We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.</p>
    <button onclick="acceptCookies()">Accept</button>
    <button onclick="declineCookies()">Decline</button>
</div>

<script>
function acceptCookies() {
    localStorage.setItem('cookieConsent', 'accepted');
    document.getElementById('cookie-consent').style.display = 'none';
}

function declineCookies() {
    localStorage.setItem('cookieConsent', 'declined');
    document.getElementById('cookie-consent').style.display = 'none';
}

// Check if consent already given
if (!localStorage.getItem('cookieConsent')) {
    document.getElementById('cookie-consent').style.display = 'block';
}
</script>
```

3. Restart API service

See `custom/examples/cookie-consent.md` for more examples.

## Static Files

Serve custom static files (images, fonts, etc.) through MediaCMS.

### File Locations

- **Docker**: Place files in `custom/static/`
- **Single-server**: Place files in `custom/static/`

### URL Paths

Files in `custom/static/` are served at `/custom/static/` URL path.

**Example:**
- File: `custom/static/images/logo.png`
- URL: `https://your-domain.com/custom/static/images/logo.png`

### Usage in Settings

Use `/custom/static/` prefix in settings:

```python
PORTAL_LOGO_DARK_PNG = "/custom/static/images/logo_dark.png"
EXTRA_CSS_PATHS = ["/custom/static/css/custom.css"]
EXTRA_JS_PATHS = ["/custom/static/js/custom.js"]
```

### Usage in Templates

Use the static URL or direct path:

```django
{% load static %}
<img src="/custom/static/images/logo.png" alt="Logo">

<!-- Or using static tag -->
<img src="{% static 'custom/static/images/logo.png' %}" alt="Logo">
```

## Deployment Considerations

### Docker Installation

**Volume Mounting:**
- `./custom` is mounted as read-only into API container
- `./custom/static` is mounted into nginx container

**File Paths:**
- Always use `/custom/static/` prefix in settings
- Templates go in `custom/templates/`

**Restart Commands:**
```bash
# Settings, templates, CSS, JS changes
docker compose restart api

# If static files don't update
docker compose restart nginx
```

**File Permissions:**
- Files must be readable by the container user
- No special permissions needed for read-only mounts

### Single-Server Installation

**File Locations:**
- Settings: `custom/local_settings.py`
- Templates: `custom/templates/`
- Static files: `custom/static/`

**Nginx Configuration:**
- Already configured to serve `/custom/static/` at `/custom/static/` URL
- No additional nginx configuration needed

**Restart Commands:**
```bash
# Settings, templates, CSS, JS changes
sudo systemctl restart mediacms-api

# Restart all services
sudo systemctl restart mediacms.target
```

**File Permissions:**
- Files must be readable by the `mediacms` user
- Typically no special permissions needed

### Best Practices

1. **Backup before changes**: Always backup `custom/` directory before major modifications
2. **Test incrementally**: Make changes one at a time and test
3. **Use version control**: Consider version controlling your `custom/` directory (excluding `local_settings.py` if it contains secrets)
4. **Document customizations**: Keep notes on what you've customized and why
5. **Test after updates**: Verify customizations still work after MediaCMS updates

## Troubleshooting

### Changes Not Appearing

1. **Restart services**: Most changes require API service restart
2. **Check file paths**: Ensure paths in `local_settings.py` are correct
3. **Clear browser cache**: Static files may be cached
4. **Check file permissions**: Files must be readable
5. **Review logs**: Check API logs for errors

### Template Override Not Working

1. **Verify structure**: Directory structure must match `templates/` exactly
2. **Check location**: Template must be in `custom/templates/` with correct path
3. **Check syntax**: Ensure Django template syntax is correct
4. **Restart API**: Template changes require API restart

### Static Files Not Loading

1. **Check paths**: Use `/custom/static/` prefix in settings
2. **Verify nginx**: Ensure nginx is serving `/custom/static/` location
3. **Check permissions**: Files must be readable
4. **Restart nginx**: May need to restart nginx service

## Additional Resources

- [Custom Directory README](../../../custom/README.md) - Quick reference guide
- [Configuration Reference](../reference/configuration-reference.md) - All available settings
- [Portal Customization](portal-customization.md) - Portal-specific customizations
- [Example Files](../../../custom/examples/) - Detailed examples and guides
