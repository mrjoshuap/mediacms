# Development Environment Setup

Set up your local development environment for MediaCMS.

## Prerequisites

- Docker and Docker Compose installed
- Git installed
- Code editor (VS Code, PyCharm, etc.)
- Basic knowledge of Python/Django and React/TypeScript

## Quick Start

### Step 1: Clone Repository

```bash
git clone https://github.com/mediacms-io/mediacms
cd mediacms
```

### Step 2: Start Development Environment

Using Makefile (recommended):

```bash
make dev-up-attach
```

Or using docker compose directly:

```bash
docker compose -f docker-compose-dev.yaml up
```

### Step 3: Access Application

**Important**: Development mode has NO nginx server. There is no port 80.

- **Django Dev Server (Full Application)**: http://localhost:8000
  - Serves Django templates with React components
  - Handles all POST requests and API calls
  - Full functionality, including media uploads
  - Use for most development work
  - Login: admin/admin

- **React Dev Server (Hot Reloading)**: http://localhost:8088
  - Hot reloading for React component development
  - View React component changes instantly
  - May have CORS issues for POST requests
  - Use for frontend-only development
  - Does NOT handle uploads or POST requests

## Development Environment Overview

### What docker-compose-dev.yaml Does

The development environment builds two images:

- **Backend**: `mediacms/mediacms-dev:latest`
- **Frontend**: `frontend`

And starts all required services:
- Celery workers
- Redis
- PostgreSQL database
- Django development server
- React development server

### Differences from Production

**Django**:
- Runs in debug mode with `python manage.py runserver`
- **No nginx** - Django dev server handles requests directly on port 8000
- Debug Toolbar enabled
- Static files loaded from `static/` folder
- CORS headers configured for all origins
- Port 8000 is exposed directly (no reverse proxy)

**React**:
- Runs `npm start` for hot reloading
- Available on port 8088
- Changes reflect immediately
- Separate from Django server

## Port Usage Guide

### Port 8000: Django Dev Server (Full Application)

Use port 8000 for:
- **Backend development**: Django views, models, API endpoints
- **Django templates**: Template changes and rendering
- **Full functionality**: All features work correctly
- **POST requests**: API calls, form submissions
- **Media uploads**: File uploads work properly
- **Authentication**: Login, logout, sessions
- **Testing workflows**: Complete user flows

**Access**: http://localhost:8000

### Port 8088: React Dev Server (Hot Reloading)

Use port 8088 for:
- **React component development**: Component changes
- **Frontend styling**: CSS and styling updates
- **Rapid iteration**: See changes instantly
- **UI development**: Frontend-only work

**Limitations**:
- **CORS issues**: POST requests may fail
- **No uploads**: File uploads don't work
- **Limited functionality**: Some features may not work
- **Template changes**: Django template changes not reflected

**Access**: http://localhost:8088

### Recommended Workflow

1. **Backend/Django work**: Use http://localhost:8000
2. **React component work**: Use http://localhost:8088 for rapid iteration
3. **Testing**: Use http://localhost:8000 for full functionality
4. **Production build**: Build frontend and test on http://localhost:8000

## Backend Development

### Making Changes

1. Edit Python files in `files/`, `users/`, etc.
2. Django auto-reloads on file changes
3. Changes appear immediately

### Restarting Django

If Django breaks (e.g., syntax error), restart:

```bash
make dev-restart api
```

Or:

```bash
docker compose -f docker-compose-dev.yaml restart api
```

### Django Shell

Access Django shell:

```bash
make dev-shell
```

Then:

```python
python manage.py shell
```

### Database Migrations

Create migrations:

```bash
make dev-shell
python manage.py makemigrations
```

Apply migrations:

```bash
python manage.py migrate
```

## Frontend Development

### Making Changes

1. Edit files in `frontend/src/`
2. Changes appear on http://localhost:8088 (hot reloading)
3. React dev server reloads automatically

### Building for Production

When ready to test production build:

```bash
make build-frontend
```

This:
1. Builds frontend with `npm run dist`
2. Copies static files to `static/` directory
3. Makes files available to Django

**Manual Build**:

```bash
docker compose -f docker-compose-dev.yaml exec frontend npm run dist
cp -r frontend/dist/static/* static/
```

### Frontend Architecture

MediaCMS uses React as a library, not a standalone SPA:

- **React Components**: `frontend/src/`
- **Django Templates**: `templates/`
- **Base Template**: `templates/root.html`
- **React Entry Points**: Templates load React via `js/media.js`, etc.

### Development Workflow

1. Edit `frontend/src/` files
2. Check changes on http://localhost:8088/ (hot reloading)
3. Build frontend: `make build-frontend`
4. Restart Django: `make dev-restart api`
5. Test on http://localhost:8000 (full application)
6. Commit changes

### CORS Issues

Some pages may have CORS issues when developing:
- **Use Django dev server (port 8000) for POST requests** - Full functionality
- **React dev server (port 8088) for viewing changes** - Hot reloading only
- Configure `frontend/.env` if URLs differ from localhost
- POST requests, uploads, and API calls must use port 8000

## Testing

### Setup

1. Start development environment:

```bash
make dev-up
```

2. Install test dependencies:

```bash
docker compose -f docker-compose-dev.yaml exec api pip install -r requirements-dev.txt
```

### Run Tests

**All Tests**:

```bash
make test
```

Or:

```bash
docker compose -f docker-compose-dev.yaml exec --env TESTING=True -T api pytest
```

**Specific Test**:

```bash
docker compose -f docker-compose-dev.yaml exec --env TESTING=True -T api pytest tests/test_fixtures.py
```

**With Coverage**:

```bash
docker compose -f docker-compose-dev.yaml exec --env TESTING=True -T api pytest --cov=. --cov-report=html
```

### Test Environment

`TESTING=True` environment variable:
- Runs Celery tasks synchronously (not as background tasks)
- Disables certain features for testing
- Ensures test isolation

## Code Quality

### Pre-commit Hooks

Install pre-commit hooks:

```bash
pre-commit install
```

Run checks:

```bash
pre-commit run --all
```

Hooks check:
- Code formatting
- Linting
- Other code quality checks

### Code Formatting

- **Python**: Follow PEP 8, use Black
- **JavaScript/TypeScript**: Follow ESLint rules
- **Django**: Follow Django best practices

## Useful Commands

### Development

```bash
make dev-up              # Start development environment
make dev-down            # Stop development environment
make dev-restart         # Restart all services
make dev-restart api     # Restart API only
make dev-shell           # Open shell in API container
make dev-logs            # View development logs
make build-frontend      # Build frontend for production
```

### Database

```bash
make db-shell            # Open PostgreSQL shell
make backup-db-dev        # Backup development database
```

### Testing

```bash
make test                # Run all tests
```

## Troubleshooting

### Services Won't Start

- Check Docker is running: `docker ps`
- Check logs: `make dev-logs`
- Verify ports aren't in use

### Frontend Not Loading

- Check React dev server: http://localhost:8088
- Verify `frontend/.env` configuration
- Check browser console for errors

### Database Issues

- Check database logs: `make dev-logs db`
- Verify migrations: `python manage.py migrate`
- Check database connection

### CORS Errors

- **Use Django dev server (port 8000) for API calls** - Not port 8088
- Check CORS configuration
- Verify `frontend/.env` settings
- Remember: Port 8088 has CORS limitations for POST requests

## Next Steps

- [Contributing Guide](contributing.md) - How to contribute
- [System Architecture](../architecture/system-overview.md) - Understand the system
- [API Reference](../architecture/api-reference.md) - API documentation
