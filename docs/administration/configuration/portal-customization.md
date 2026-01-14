# Portal Customization

Customize the appearance and branding of your MediaCMS portal.

> **For comprehensive customization options, see the [Customizations Guide](customizations.md)** which covers templates, CSS, JavaScript, tracking, and more.

## Logo

### SVG Logos (Recommended)

Place logo files in `static/images/` or `custom/static/images/`:

```python
PORTAL_LOGO_DARK_SVG = '/static/images/logo_dark.svg'   # Dark theme
PORTAL_LOGO_LIGHT_SVG = '/static/images/logo_light.svg'  # Light theme
```

### PNG Logos

```python
PORTAL_LOGO_DARK_PNG = '/static/images/logo_dark.png'   # Dark theme
PORTAL_LOGO_LIGHT_PNG = '/static/images/logo_light.png'  # Light theme
```

**Note**: SVG files take priority over PNG files if both are set.

### Docker Installation

For Docker installations, place logos in `custom/static/images/`:

```python
PORTAL_LOGO_DARK_PNG = '/custom/static/images/logo_dark.png'
PORTAL_LOGO_LIGHT_PNG = '/custom/static/images/logo_light.png'
```

## Custom CSS

Add custom CSS files:

```python
EXTRA_CSS_PATHS = [
    '/custom/static/css/custom.css',
]
```

For Docker installations, place CSS in `custom/static/css/`.

## Rounded Corners

Control rounded corners on videos:

```python
USE_ROUNDED_CORNERS = True   # Enable (default)
USE_ROUNDED_CORNERS = False  # Disable
```

## Custom Upload Message

Display a custom message on the upload page:

```python
PRE_UPLOAD_MEDIA_MESSAGE = 'Please ensure your content complies with our terms of service.'
```

## Show/Hide UI Elements

### Upload Media Button

```python
UPLOAD_MEDIA_ALLOWED = True   # Show upload button
UPLOAD_MEDIA_ALLOWED = False  # Hide upload button
```

### Action Buttons

```python
CAN_LIKE_MEDIA = True      # Show like button
CAN_DISLIKE_MEDIA = True    # Show dislike button
CAN_REPORT_MEDIA = True     # Show report button
CAN_SHARE_MEDIA = True      # Show share button
```

### Download Option

Edit `templates/config/installation/features.html`:

```html
download: false  # Hide download option
```

## Cookie Consent

Enable cookie consent banner:

1. Edit `templates/components/header.html`
2. Remove `{% comment %}` and `{% endcomment %}` around cookie consent code
3. Or replace with your own cookie consent implementation

## Google Analytics

Add Google Analytics tracking to your MediaCMS installation.

**Recommended Method:** Use template override (works for all deployment types)

1. Create `custom/templates/tracking.html` with your Google Analytics code
2. Include it in `custom/templates/root.html`
3. Restart API service

**For detailed instructions, see:**
- [Customizations Guide](customizations.md#google-analytics) - Comprehensive Google Analytics setup
- [Google Analytics Example](../../../custom/examples/google-analytics-gtag.md) - Step-by-step guide with examples

**Quick Example:**

Create `custom/templates/tracking.html`:
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

Create `custom/templates/root.html`:
```django
{% extends "root.html" %}
{% block head %}
    {{ block.super }}
    {% include "tracking.html" %}
{% endblock %}
```

Restart API service: `docker compose restart api` (Docker) or `sudo systemctl restart mediacms-api` (single-server)

## Static Pages

Add custom static pages to the sidebar. See [Adding Static Pages](#adding-static-pages) section.

## Translations

### Set Default Language

```python
LANGUAGE_CODE = 'en'  # Options: en, es, fr, de, etc.
```

### Limit Available Languages

Remove languages from `LANGUAGES` list in `settings.py`:

```python
LANGUAGES = [
    ('en', 'English'),
    ('es', 'Spanish'),
    # Remove languages you don't want
]
```

### Add New Language

1. Add language to `LANGUAGES` in `settings.py`
2. Copy `files/frontend-translations/en.py` to new language file
3. Translate strings in the new file

## Categories and Tags Display

### Show/Hide Media Counts

```python
INCLUDE_LISTING_NUMBERS = True   # Show counts (default)
INCLUDE_LISTING_NUMBERS = False  # Hide counts
```

## Video Sprite Settings

Change how often sprites are extracted:

1. Edit `frontend/src/static/js/components/media-viewer/VideoViewer/index.js`
2. Change `seconds: 10` to desired value
3. Set same value in `settings.py`:

```python
SPRITE_NUM_SECS = 2  # Extract sprite every 2 seconds
```

4. Rebuild frontend: `make build-frontend`

## Adding Static Pages

### Step 1: Create HTML Template

```bash
cp templates/cms/about.html templates/cms/volunteer.html
```

### Step 2: Create CSS File

```bash
touch static/css/volunteer.css
```

### Step 3: Update Template

Edit `templates/cms/volunteer.html` with your content and metadata.

### Step 4: Add View

Add to `files/views.py`:

```python
def volunteer(request):
    """Volunteer view"""
    context = {}
    return render(request, "cms/volunteer.html", context)
```

### Step 5: Add URL

Add to `files/urls.py`:

```python
urlpatterns = [
    url(r"^volunteer", views.volunteer, name="volunteer"),
]
```

### Step 6: Add to Sidebar

Add JavaScript to `frontend/src/static/js/_commons.js` to add menu item.

### Step 7: Restart

```bash
make restart api
```

## Next Steps

- [User Management](user-management.md) - Configure user permissions
- [Media Settings](media-settings.md) - Configure media uploads
- [Advanced Configuration](advanced-configuration.md) - Advanced options
