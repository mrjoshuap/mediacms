# Frontend Development Workflow

Detailed workflow for frontend development.

## Development Setup

### Start Development Environment

```bash
make dev-up-attach
```

This starts:
- Django development server (port 8000, proxied via port 80)
- React development server (port 8088)
- All backend services

### Access Points

- **Main Application**: http://localhost (Django + React dev server)
- **React Dev Server**: http://localhost:8088 (React only, hot reloading)

## Making Changes

### React Components

1. Edit files in `frontend/src/static/js/components/`
2. Changes appear on http://localhost:8088 immediately
3. React dev server hot-reloads automatically

### Django Templates

1. Edit templates in `templates/`
2. Django auto-reloads on template changes
3. Changes appear on http://localhost immediately

### Static Files

1. Edit CSS in `static/css/` or `frontend/src/`
2. For React CSS, edit in `frontend/src/`
3. Rebuild frontend if needed

## Building for Production

### Build Process

When ready to test production build:

```bash
make build-frontend
```

This:
1. Builds React with `npm run dist`
2. Copies static files to `static/` directory
3. Makes files available to Django

### Manual Build

```bash
# Build frontend
docker compose -f docker-compose-dev.yaml exec frontend npm run dist

# Copy static files
cp -r frontend/dist/static/* static/

# Restart Django
make dev-restart api
```

## Testing Changes

### Development Testing

1. Make changes in `frontend/src/`
2. View on http://localhost:8088
3. Test functionality
4. Fix issues

### Production Testing

1. Build frontend: `make build-frontend`
2. Test on http://localhost
3. Verify production build works
4. Check for issues

## CORS Considerations

### Development

- React dev server (port 8088) may have CORS issues
- Use main application (port 80) for POST requests
- Configure `frontend/.env` if URLs differ

### Production

- No CORS issues in production
- All requests go through same domain

## Component Development

### Creating Components

1. Create component in `frontend/src/static/js/components/`
2. Export component
3. Import in entry point
4. Mount to DOM element

### Template Integration

1. Add DOM element in template
2. Load React entry point script
3. Component mounts automatically

## Translation Workflow

### Adding Translatable Strings

1. Use `translateString()` function
2. Add string to `files/frontend-translations/en.py`
3. Run `python manage.py process_translations`
4. Translate to your language
5. Rebuild frontend

## Debugging

### Browser DevTools

- **F12**: Open developer tools
- **Console**: JavaScript errors
- **Network**: API requests
- **React DevTools**: Component inspection

### React DevTools

Install React DevTools browser extension for:
- Component tree inspection
- Props and state viewing
- Performance profiling

## Best Practices

1. **Hot Reloading**: Use React dev server for rapid development
2. **Production Build**: Always test production build before committing
3. **Error Handling**: Handle errors gracefully
4. **Performance**: Optimize component rendering
5. **Code Quality**: Follow ESLint rules

## Common Issues

### Changes Not Appearing

- Check React dev server is running
- Verify file was saved
- Check browser console for errors
- Clear browser cache

### Build Failures

- Check for syntax errors
- Verify all dependencies installed
- Check build logs
- Review error messages

### CORS Errors

- Use main application (port 80) for API calls
- Check `frontend/.env` configuration
- Verify CORS settings

## Next Steps

- [Frontend Overview](README.md) - Frontend architecture
- [Development Environment](../setup/development-environment.md) - Setup guide
- [Contributing](../setup/contributing.md) - Contribution guidelines
