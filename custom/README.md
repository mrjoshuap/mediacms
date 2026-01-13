# Custom Directory

This directory is for user customizations that will be mounted into the MediaCMS containers.

## Structure

```
custom/
├── README.md                  # This file
├── local_settings.py.example  # Template for Django settings
├── local_settings.py          # Your Django settings (gitignored)
└── static/
    ├── images/                # Custom logos and images (gitignored)
    │   └── logo_dark.png
    └── css/                   # Custom CSS files (gitignored)
        └── custom.css
```

## Usage

### Custom Settings

1. Copy the example file:
   ```bash
   cp custom/local_settings.py.example custom/local_settings.py
   ```

2. Edit `custom/local_settings.py` with your customizations:
   ```python
   # Example customizations
   DEBUG = False
   ALLOWED_HOSTS = ['media.example.com']
   PORTAL_NAME = "My Media Portal"
   PORTAL_LOGO_DARK_PNG = "/custom/static/images/logo_dark.png"
   EXTRA_CSS_PATHS = ["/custom/static/css/custom.css"]
   ```

3. Restart the api container:
   ```bash
   docker compose restart api
   ```

### Custom Logo

1. Place your logo in `custom/static/images/logo_dark.png`

2. Update `custom/local_settings.py`:
   ```python
   PORTAL_LOGO_DARK_PNG = "/custom/static/images/logo_dark.png"
   ```

3. Restart the api container

### Custom CSS

1. Create your CSS file: `custom/static/css/custom.css`

2. Update `custom/local_settings.py`:
   ```python
   EXTRA_CSS_PATHS = ["/custom/static/css/custom.css"]
   ```

3. Restart the api container

## Notes

- Files in `custom/` are mounted as read-only into containers
- The `custom/static/` directory is served directly by nginx at `/custom/static/`
- Changes to `local_settings.py` require a container restart to take effect
- Changes to static files (CSS/images) also require a container restart
- The `custom/` directory is gitignored by default (except this README and example files)
