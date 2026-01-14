# Custom Directory

This directory is for user customizations that will be mounted into MediaCMS containers (Docker) or used directly (single-server installations). All customizations are preserved during updates and upgrades.

## Directory Structure

```
custom/
├── README.md                    # This file
├── local_settings.py.example    # Template for Django settings
├── local_settings.py            # Your Django settings (gitignored)
├── templates/                   # Template overrides (gitignored)
│   ├── root.html                # Override root template
│   ├── components/
│   │   └── header.html          # Override header component
│   └── tracking.html            # Google Analytics template
├── static/
│   ├── css/                     # Custom CSS files (gitignored)
│   │   └── custom.css
│   ├── js/                      # Custom JavaScript files (gitignored)
│   │   └── custom.js
│   └── images/                  # Custom logos and images (gitignored)
│       ├── logo_dark.png
│       └── logo_light.png
└── examples/                    # Example files and guides
    ├── google-analytics-gtag.md
    ├── cookie-consent.md
    └── template-override.md
```

## Quick Start

1. **Copy the example settings file:**
   ```bash
   cp custom/local_settings.py.example custom/local_settings.py
   ```

2. **Edit `custom/local_settings.py`** with your customizations

3. **Restart MediaCMS:**
   - **Docker**: `docker compose restart api`
   - **Single-server**: `sudo systemctl restart mediacms-api`

## Customization Types

### 1. Custom Settings

Edit `custom/local_settings.py` to override any Django setting from `cms/settings.py`.

**Example:**
```python
PORTAL_NAME = "My Custom Portal"
PORTAL_DESCRIPTION = "A custom video platform"
ALLOWED_HOSTS = ['media.example.com']
```

**Restart required:** Yes (API container/service)

### 2. Custom CSS

Add custom CSS files to override or extend MediaCMS styles.

**Steps:**
1. Create `custom/static/css/custom.css`
2. Add to `custom/local_settings.py`:
   ```python
   EXTRA_CSS_PATHS = ["/custom/static/css/custom.css"]
   ```
3. Restart API container/service

**Restart required:** Yes (API container/service)

**Example CSS:**
```css
/* Custom portal styling */
.portal-header {
    background-color: #your-color;
}

/* Override default styles */
.item-thumb {
    border-radius: 8px;
}
```

### 3. Custom JavaScript

Add custom JavaScript files for additional functionality.

**Steps:**
1. Create `custom/static/js/custom.js`
2. Add to `custom/local_settings.py`:
   ```python
   EXTRA_JS_PATHS = ["/custom/static/js/custom.js"]
   ```
3. Restart API container/service

**Restart required:** Yes (API container/service)

**Example JavaScript:**
```javascript
// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Your custom JavaScript code here
    console.log('Custom JavaScript loaded');
});
```

### 4. Template Overrides

Override any template by placing it in `custom/templates/` with the same directory structure as `templates/`.

**How it works:**
- Templates in `custom/templates/` take precedence over `templates/`
- Directory structure must match (e.g., `custom/templates/root.html` overrides `templates/root.html`)
- You can override entire templates or use `{% extends %}` to extend them

**Steps:**
1. Copy the template you want to override from `templates/` to `custom/templates/`
2. Maintain the same directory structure
3. Make your modifications
4. Restart API container/service

**Restart required:** Yes (API container/service)

**Example:**
```bash
# Override root template
cp templates/root.html custom/templates/root.html
# Edit custom/templates/root.html
```

**Common template overrides:**
- `root.html` - Main page template
- `components/header.html` - Header component
- `components/footer.html` - Footer component
- `tracking.html` - For Google Analytics (create new)

### 5. Custom Logos

Replace MediaCMS logos with your own branding.

**Steps:**
1. Place logo files in `custom/static/images/`:
   - `logo_dark.png` or `logo_dark.svg` (for dark theme)
   - `logo_light.png` or `logo_light.svg` (for light theme)
2. Add to `custom/local_settings.py`:
   ```python
   PORTAL_LOGO_DARK_PNG = "/custom/static/images/logo_dark.png"
   PORTAL_LOGO_LIGHT_PNG = "/custom/static/images/logo_light.png"
   ```
   Or for SVG:
   ```python
   PORTAL_LOGO_DARK_SVG = "/custom/static/images/logo_dark.svg"
   PORTAL_LOGO_LIGHT_SVG = "/custom/static/images/logo_light.svg"
   ```
3. Restart API container/service

**Note:** SVG files take priority over PNG if both are set.

**Restart required:** Yes (API container/service)

### 6. Google Analytics

Add Google Analytics tracking to your MediaCMS installation.

**Recommended Method (Template Override):**

1. Create `custom/templates/tracking.html`:
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
   Replace `GA_MEASUREMENT_ID` with your Google Analytics ID.

2. Create `custom/templates/root.html` that includes the tracking:
   ```django
   {% extends "root.html" %}
   {% load static %}
   
   {% block head %}
       {{ block.super }}
       {% include "tracking.html" %}
   {% endblock %}
   ```

3. Restart API container/service

**See:** `custom/examples/google-analytics-gtag.md` for detailed instructions.

**Restart required:** Yes (API container/service)

### 7. Cookie Consent

Add a cookie consent banner to comply with privacy regulations.

**Steps:**
1. Override `custom/templates/components/header.html`
2. Add your cookie consent code (see `custom/examples/cookie-consent.md`)
3. Restart API container/service

**See:** `custom/examples/cookie-consent.md` for examples.

**Restart required:** Yes (API container/service)

## Deployment-Specific Instructions

### Docker Installation

**File Locations:**
- Settings: `custom/local_settings.py`
- Templates: `custom/templates/`
- Static files: `custom/static/` (served at `/custom/static/`)

**Volume Mounting:**
The `custom/` directory is mounted as read-only into containers:
- API container: `./custom:/home/mediacms.io/mediacms/custom:ro`
- Nginx container: `./custom/static:/var/www/custom:ro`

**Restart Commands:**
```bash
# Restart API (for settings, templates, CSS, JS changes)
docker compose restart api

# Restart Nginx (usually not needed, but if static files don't update)
docker compose restart nginx
```

**Path Prefixes:**
- Use `/custom/static/` prefix for static file paths in settings
- Example: `/custom/static/css/custom.css`

### Single-Server Installation

**File Locations:**
- Settings: `custom/local_settings.py`
- Templates: `custom/templates/`
- Static files: `custom/static/` (served at `/custom/static/`)

**Nginx Configuration:**
Nginx is already configured to serve files from `/custom/static/` at `/custom/static/` URL path.

**Restart Commands:**
```bash
# Restart API service (for settings, templates, CSS, JS changes)
sudo systemctl restart mediacms-api

# Restart all MediaCMS services
sudo systemctl restart mediacms.target
```

**Path Prefixes:**
- Use `/custom/static/` prefix for static file paths in settings
- Example: `/custom/static/css/custom.css`

## Best Practices

1. **Never edit files in `templates/` or `static/` directly** - Use `custom/` directory instead
2. **Keep customizations in `custom/`** - This ensures they persist through updates
3. **Use example files** - Copy `.example` files and customize them
4. **Test after changes** - Always test customizations after restarting services
5. **Backup before major changes** - Backup `custom/` directory before significant modifications
6. **Version control** - Consider version controlling your `custom/` directory (excluding `local_settings.py` if it contains secrets)

## Troubleshooting

### Changes Not Appearing

1. **Check file paths** - Ensure paths in `local_settings.py` are correct
2. **Restart services** - Most changes require restarting the API service
3. **Check file permissions** - Ensure files are readable
4. **Clear browser cache** - Static files may be cached
5. **Check logs** - Review API logs for errors:
   - Docker: `docker compose logs api`
   - Single-server: `sudo journalctl -u mediacms-api -f`

### Template Override Not Working

1. **Check directory structure** - Must match `templates/` structure exactly
2. **Verify file location** - Template must be in `custom/templates/` with correct path
3. **Check template syntax** - Ensure Django template syntax is correct
4. **Restart API** - Template changes require API restart

### Static Files Not Loading

1. **Check nginx configuration** - Ensure `/custom/static/` location is configured
2. **Verify file paths** - Use `/custom/static/` prefix in settings
3. **Check file permissions** - Files must be readable
4. **Restart nginx** - May need to restart nginx service

## Example Files

See the `custom/examples/` directory for detailed guides:
- `google-analytics-gtag.md` - Google Analytics setup
- `cookie-consent.md` - Cookie consent implementation
- `template-override.md` - Template override examples

## Additional Resources

- [Configuration Guide](../../docs/administration/configuration/customizations.md) - Comprehensive customization documentation
- [Portal Customization](../../docs/administration/configuration/portal-customization.md) - Portal-specific customizations
- [Settings Reference](../../docs/reference/configuration-reference.md) - All available settings

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the example files in `custom/examples/`
3. Consult the comprehensive documentation in `docs/administration/configuration/`
4. Check MediaCMS GitHub issues and discussions
