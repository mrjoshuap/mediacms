# Make Commands Reference

Quick reference for all MediaCMS make commands.

## Understanding Make Commands

The MediaCMS project includes a `Makefile` that provides convenient shortcuts for Docker Compose operations. All commands can also be run directly with `docker compose`.

### Attached vs Detached Mode

- **Regular commands** (e.g., `make up`, `make dev-up`): Run services in **detached mode** (background). You get your terminal back immediately.
- **Attach commands** (e.g., `make up-attach`, `make dev-up-attach`): Run services in **attached mode** (foreground). Logs are displayed in your terminal. Press `Ctrl+C` to stop.

**When to use each**:
- Use `-attach` when you want to see logs immediately or are debugging
- Use regular commands when you want services running in the background

## Production Commands

### Starting Services

- `make up` - Start production services (detached)
- `make up-attach` - Start production services (attached, shows logs)
- `make up-full` - Start with Whisper transcription support (detached)
- `make up-full-attach` - Start with Whisper transcription (attached, shows logs)

### Stopping Services

- `make down` - Stop and remove containers
- `make down-volumes` - Stop and remove containers and volumes
- `make stop` - Stop containers (keep them)
- `make start` - Start existing containers
- `make restart` - Restart containers
- `make restart [service]` - Restart specific service (e.g., `make restart api`)

### Building Images

- `make build` - Build all production images
- `make build-no-cache` - Build without using cache
- `make build-full` - Build with Whisper transcription support
- `make build-full-no-cache` - Build with Whisper support (no cache)
- `make build-api` - Build only API image
- `make build-worker` - Build worker images (celery_beat, celery_short, celery_long)
- `make build-worker-full` - Build worker image with Whisper transcription support
- `make build-nginx` - Build nginx image
- `make build-base` - Build base image
- `make build-all` - Build all images (production and dev)

### Managing Services

- `make ps` - Show service status
- `make logs` - Show all logs (follow mode)
- `make logs [service]` - Show logs for specific service (e.g., `make logs api`)
- `make pull` - Pull latest production images

### Production (Full/Whisper Mode)

- `make up-full` - Start production services with Whisper transcription (detached)
- `make up-full-attach` - Start production services with Whisper transcription (attached)
- `make down-full` - Stop and remove containers (full mode)
- `make down-full-volumes` - Stop and remove containers and volumes (full mode)
- `make start-full` - Start existing containers (full mode)
- `make stop-full` - Stop containers (full mode)
- `make restart-full` - Restart containers (full mode)
- `make ps-full` - Show service status (full mode)
- `make logs-full` - Show all logs (full mode)
- `make logs-full [service]` - Show logs for specific service (full mode)
- `make build-full` - Build all production images with Whisper transcription support
- `make build-full-no-cache` - Build with Whisper support (no cache)
- `make pull-full` - Pull latest production images (full mode)

## Development Commands

### Starting Services

- `make dev-up` - Start development services (detached)
- `make dev-up-attach` - Start development services (attached, shows logs)

### Stopping Services

- `make dev-down` - Stop and remove development containers
- `make dev-down-volumes` - Stop and remove development containers and volumes
- `make dev-start` - Start existing development containers
- `make dev-stop` - Stop development containers
- `make dev-restart` - Restart all development containers
- `make dev-restart [service]` - Restart specific service (e.g., `make dev-restart api`)

### Building Images

- `make dev-build` - Build all development images
- `make dev-build-no-cache` - Build development images (no cache)

### Managing Services

- `make dev-ps` - Show development service status
- `make dev-logs` - Show all development logs (follow mode)
- `make dev-logs [service]` - Show logs for specific service (e.g., `make dev-logs api`)

## Build Commands Quick Reference

### Frontend Development

- `make build-frontend` - Build React frontend and copy to static files
  - Builds the frontend with `npm run dist`
  - Copies static files to `static/` directory
  - Restarts API container to serve new files

### Production Images

- `make build` - Build all production images
- `make build-full` - Build with Whisper support
- `make build-api` - Build API only
- `make build-worker` - Build workers only
- `make build-worker-full` - Build workers with Whisper support
- `make build-nginx` - Build nginx only
- `make build-base` - Build base image only
- `make build-all` - Build all images (production and dev)

See [Frontend Development](../development/frontend/README.md) for more details on frontend builds.

## Health Checks

- `make health` - Check health of all production services
- `make health-dev` - Check health of all development services
- `make health-api` - Check API service health (production)
- `make health-db` - Check database health (production)
- `make health-redis` - Check Redis health (production)

## Utility Commands

### Shell Access

- `make shell` - Open shell in production API container
- `make dev-shell` - Open shell in development API container
- `make admin-shell` - Alias for shell (production API container)
- `make db-shell` - Open PostgreSQL shell in database container
- `make redis-cli` - Open Redis CLI in Redis container

### Backups

- `make backup-db` - Create production database backup
- `make backup-db-dev` - Create development database backup

### Testing

- `make test` - Run tests in development environment

### Cleanup

- `make clean` - Remove stopped containers, unused networks, and dangling images
- `make clean-all` - Remove ALL containers, networks, and volumes (WARNING: destructive)

## Examples

### Starting Development Environment

```bash
# Start with logs visible (recommended for first-time setup)
make dev-up-attach

# Or start in background
make dev-up
```

### Building Frontend

```bash
# Build frontend and copy to static files
make build-frontend
```

### Checking Service Status

```bash
# Check production services
make ps

# Check development services
make dev-ps

# Check health
make health
```

### Viewing Logs

```bash
# All logs
make logs

# Specific service
make logs api
make logs celery_long

# Development logs
make dev-logs api
```

### Restarting Services

```bash
# Restart all services
make restart

# Restart specific service
make restart api
make dev-restart api
```

## Getting Help

Run `make help` in the project root to see all available commands with descriptions.

## Related Documentation

- [Development Environment Setup](../development/setup/development-environment.md) - Detailed development setup
- [Frontend Development](../development/frontend/README.md) - Frontend development guide
- [Administration Installation](../administration/installation/docker-standard.md) - Production installation
- [Operations Monitoring](../operations/monitoring.md) - Monitoring and health checks
