# Frontend Development

Guide to frontend development in MediaCMS.

## Overview

MediaCMS frontend uses React as a library, integrated with Django templates.

## Architecture

### React as Library

MediaCMS doesn't use React as a standalone SPA:
- React components loaded by Django templates
- Templates handle routing
- React handles component rendering

### Directory Structure

- `frontend/src/` - React source code
- `templates/` - Django templates
- `static/` - Built static files

### Template Integration

- Base template: `templates/root.html`
- React entry points: Templates load React via `js/media.js`, etc.
- Component mounting: React components mount to DOM elements

## Development Workflow

### Making Changes

1. Edit `frontend/src/` files
2. Changes appear on http://localhost:8088 (hot reloading)
3. Build for production: `make build-frontend`
4. Test on http://localhost

### Building Frontend

**Using Makefile**:

```bash
make build-frontend
```

**Manual Build**:

```bash
docker compose -f docker-compose-dev.yaml exec frontend npm run dist
cp -r frontend/dist/static/* static/
```

### Development Server

React dev server runs on port 8088:
- Hot reloading enabled
- Changes reflect immediately
- Use for development

**Note**: POST requests must go through main application (port 80).

## Component Structure

### React Components

Components in `frontend/src/static/js/components/`:
- Media viewer components
- Upload components
- Playlist components
- User interface components

### Template Integration

Templates load React:
```html
<script src="{% static 'js/media.js' %}"></script>
```

React mounts to DOM elements:
```html
<div id="media-player"></div>
```

## Translations

### Adding Translations

1. Mark strings as translatable using `translateString()`
2. Add to `files/frontend-translations/en.py`
3. Run `python manage.py process_translations`
4. Translate to your language
5. Rebuild frontend

## Best Practices

1. **Component Organization**: Organize components logically
2. **State Management**: Use React hooks for state
3. **API Calls**: Use Django REST Framework API
4. **Error Handling**: Handle errors gracefully
5. **Performance**: Optimize component rendering

## Next Steps

- [Development Workflow](development-workflow.md) - Detailed workflow
- [Development Environment](../setup/development-environment.md) - Setup guide
- [System Architecture](../architecture/system-overview.md) - Architecture overview
