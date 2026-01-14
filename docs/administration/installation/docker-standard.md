# Docker Standard Installation

Install MediaCMS using Docker Compose - the recommended method for most deployments.

## Prerequisites

- Docker installed ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed ([Install Docker Compose](https://docs.docker.com/compose/install/))
- At least 4GB RAM and 2-4 CPUs
- Sufficient disk space

## Installation Steps

### Step 1: Install Docker and Docker Compose

For Ubuntu systems:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

Verify installation:

```bash
docker --version
docker compose version
```

### Step 2: Clone MediaCMS

```bash
git clone https://github.com/mediacms-io/mediacms
cd mediacms
```

### Step 3: Start MediaCMS

Using Makefile (recommended):

```bash
make up
```

Or using docker compose directly:

```bash
docker compose up -d
```

This will:
- Download all required Docker images
- Start all containers
- Run database migrations
- Create admin user

### Step 4: Get Admin Credentials

Check the migration logs for your admin password:

```bash
docker compose logs migrations | grep "Created admin user"
```

You should see output like:

```
migrations | Created admin user with password: gwg1clfkwf
```

**Note**: You can set a custom password by adding `ADMIN_PASSWORD` to `docker-compose.yaml` before starting.

### Step 5: Access MediaCMS

Open your browser and navigate to:
- `http://localhost` (if running locally)
- `http://your-server-ip` (if running on a server)

Log in with:
- Username: `admin`
- Password: (from Step 4)

## Service Overview

The standard Docker installation includes:

- **migrations**: Runs database migrations (runs once on startup)
- **api**: Django application server (Gunicorn, port 8000)
- **nginx**: Web server and reverse proxy (port 80)
- **celery_beat**: Celery scheduler for periodic tasks
- **celery_short**: Worker for short-duration tasks
- **celery_long**: Worker for long-duration tasks (video encoding)
- **db**: PostgreSQL database
- **redis**: Cache and message broker

## Managing Services

### Check Status

```bash
make ps
```

Or:

```bash
docker compose ps
```

### View Logs

```bash
# All services
make logs

# Specific service
make logs api
make logs celery_long
```

### Restart Services

```bash
make restart
```

Or restart specific service:

```bash
make restart api
```

### Stop Services

```bash
make down
```

### Start Services

```bash
make up
```

## Updating MediaCMS

### Update Process

1. Pull latest code:

```bash
cd /path/to/mediacms
git pull
```

2. Pull latest images:

```bash
make pull
```

3. Restart services:

```bash
make down
make up
```

### Update from Version 2 to Version 3

Version 3 uses Python 3.11 and PostgreSQL 15. If updating from PostgreSQL 13:

**Option 1**: Use PostgreSQL 13 (temporary)

Edit `docker-compose.yaml` to use `postgres:13` image.

**Option 2**: Migrate to PostgreSQL 15

Perform database migration. See [GitHub PR #749](https://github.com/mediacms-io/mediacms/pull/749) for details.

## Volumes

MediaCMS uses Docker volumes for persistent data:

- `postgres_data` - PostgreSQL database files
- `media_files` - Uploaded media files and encoded versions
- `static_files` - Static files (CSS, JS, etc.)
- `logs` - Application logs
- `celerybeat_data` - Celery beat schedule data

### View Volumes

```bash
docker volume ls
```

### Backup Volumes

See [Backup Guide](../../maintenance/backups.md) for backup procedures.

## Configuration

Configuration is done via `custom/local_settings.py`. See [Configuration Guide](../../configuration/README.md) for details.

After making configuration changes, restart services:

```bash
make restart api celery_short celery_long celery_beat
```

## Troubleshooting

### Services Not Starting

- Check Docker is running: `docker ps`
- Check logs: `make logs`
- Verify ports aren't in use: `netstat -tulpn | grep :80`

### Can't Access MediaCMS

- Verify services are running: `make ps`
- Check nginx logs: `make logs nginx`
- Verify firewall settings

### Database Issues

- Check database logs: `make logs db`
- Verify database volume exists: `docker volume ls`
- Check database connections

See [Troubleshooting Guide](../../../troubleshooting/installation-problems.md) for more help.

## Next Steps

1. [Configuration Guide](../../configuration/README.md) - Configure your installation
2. [Architecture Guide](architecture.md) - Understand the system architecture
3. [Maintenance Guide](../../maintenance/README.md) - Learn about updates and backups
