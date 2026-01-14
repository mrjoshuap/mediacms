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

- **Main Application**: http://localhost (port 80)
- **React Dev Server**: http://localhost:8088
- **Django API**: http://localhost:8000

**Login Credentials**:
- Username: `admin`
- Password: `admin`

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
- No nginx (Django dev server handles requests)
- Debug Toolbar enabled
- Static files loaded from `static/` folder
- CORS headers configured for all origins

**React**:
- Runs `npm start` for hot reloading
- Available on port 8088
- Changes reflect immediately

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
2. Check changes on http://localhost:8088/
3. Build frontend: `make build-frontend`
4. Restart Django: `make dev-restart api`
5. Test on http://localhost
6. Commit changes

### CORS Issues

Some pages may have CORS issues when developing:
- Use main application (port 80) for POST requests
- React dev server (port 8088) for viewing changes
- Configure `frontend/.env` if URLs differ from localhost

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

- Use main application (port 80) for API calls
- Check CORS configuration
- Verify `frontend/.env` settings

## Next Steps

- [Contributing Guide](contributing.md) - How to contribute
- [System Architecture](../architecture/system-overview.md) - Understand the system
- [API Reference](../architecture/api-reference.md) - API documentation
