# Getting Started - Developers

This guide will help you set up a development environment and start contributing to MediaCMS.

## Prerequisites

- Docker and Docker Compose installed
- Git installed
- Basic knowledge of Python/Django and React/TypeScript
- Code editor (VS Code, PyCharm, etc.)

## Setting Up Development Environment

### Step 1: Clone the Repository

```bash
git clone https://github.com/mediacms-io/mediacms
cd mediacms
```

### Step 2: Start Development Environment

```bash
make dev-up-attach
```

**Note**: The `-attach` flag runs services in the foreground and displays logs in your terminal. Use `make dev-up` to run in detached mode (background). Press `Ctrl+C` to stop attached services.

Or using docker compose:

```bash
docker compose -f docker-compose-dev.yaml up
```

This will:
- Build development images
- Start all required services
- Set up the database
- Create an admin user (admin/admin)

### Step 3: Access the Application

**Important**: Development mode has NO nginx server. Use these ports:

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

**When to use which port**:
- **Port 8000**: Backend development, Django templates, API testing, uploads, POST requests
- **Port 8088**: React component development, frontend styling, rapid iteration on UI components

## Understanding the Codebase Structure

```
mediacms/
├── cms/                    # Django project settings
├── files/                  # Main Django app (media management)
├── users/                  # User management app
├── frontend/               # React frontend application
├── frontend-tools/         # Frontend build tools
├── templates/              # Django templates
├── static/                 # Static files (CSS, JS, images)
├── custom/                 # User customizations
├── tests/                  # Test suite
└── docs/                   # Documentation
```

### Key Components

- **Backend**: Django REST Framework API
- **Frontend**: React with TypeScript
- **Database**: PostgreSQL
- **Task Queue**: Celery with Redis
- **Video Processing**: FFmpeg

## Development Workflow

### Backend Development (Django)

1. Make changes to Python files in `files/`, `users/`, etc.
2. Django auto-reloads on file changes
3. If Django breaks, restart:

```bash
make dev-restart api
```

### Frontend Development (React)

1. Edit files in `frontend/src/`
2. Changes appear on http://localhost:8088 (hot reloading)
3. Build for production:

```bash
make build-frontend
```

This builds and copies static files to `static/` directory.

### Database Changes

If you modify models:

```bash
# Create migrations
make dev-shell
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```

## Running Tests

### Setup Test Environment

```bash
# Start dev environment
make dev-up

# Install test dependencies
docker compose -f docker-compose-dev.yaml exec api pip install -r requirements-dev.txt
```

### Run Tests

```bash
make test
```

Or manually:

```bash
docker compose -f docker-compose-dev.yaml exec --env TESTING=True api pytest
```

### Run Specific Test

```bash
docker compose -f docker-compose-dev.yaml exec --env TESTING=True api pytest tests/test_fixtures.py
```

### Coverage Report

```bash
docker compose -f docker-compose-dev.yaml exec --env TESTING=True api pytest --cov=. --cov-report=html
```

## Making Your First Contribution

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Write code following existing patterns
- Add tests for new functionality
- Update documentation if needed

### 3. Format Code

Before committing, format your code:

```bash
# Install pre-commit hooks
pre-commit install

# Run checks
pre-commit run --all
```

### 4. Commit Changes

```bash
git add .
git commit -m "Description of your changes"
```

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

## Code Style

- **Python**: Follow PEP 8, use Black for formatting
- **JavaScript/TypeScript**: Follow ESLint rules
- **Django**: Follow Django best practices
- **React**: Use functional components and hooks

## Useful Commands

### Development

```bash
make dev-up              # Start development environment
make dev-down            # Stop development environment
make dev-shell           # Open shell in API container
make dev-logs            # View development logs
make build-frontend      # Build frontend for production
```

### Database

```bash
make db-shell            # Open PostgreSQL shell
make backup-db-dev       # Backup development database
```

### Testing

```bash
make test                # Run all tests
```

## Next Steps

1. **[Development Environment](../development/setup/development-environment.md)** - Detailed development setup
2. **[System Architecture](../development/architecture/system-overview.md)** - Understand the system
3. **[API Reference](../development/architecture/api-reference.md)** - API documentation
4. **[Contributing Guide](../development/setup/contributing.md)** - Contribution guidelines

## Getting Help

- Check [Development Guide](../development/README.md)
- Review existing code and tests
- Ask questions in GitHub Discussions
- Open an issue for bugs

## Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Celery Documentation](https://docs.celeryproject.org/)
