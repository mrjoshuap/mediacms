# Single Server Installation

Install MediaCMS on a Linux server using the automated installation script.

## Prerequisites

- Ubuntu 22.04 or 24.04 (recommended)
- Root or sudo access
- Git installed
- Clean system (script will configure services)
- 4GB RAM minimum
- 2-4 CPUs minimum

## Important Notes

⚠️ **Warning**: The installation script will:
- Install and configure PostgreSQL, Redis, Nginx, Celery
- Override any existing configurations for these services
- Install system packages
- Configure systemd services

**Only run on a clean system or a system where you're okay with these changes.**

## Installation Steps

### Step 1: Prepare System

Ensure you have root access and git installed:

```bash
sudo apt update
sudo apt install -y git
```

### Step 2: Clone and Install

```bash
mkdir /home/mediacms.io && cd /home/mediacms.io/
git clone https://github.com/mediacms-io/mediacms
cd /home/mediacms.io/mediacms/ && bash ./install.sh
```

### Step 3: Follow Installation Prompts

The script will:
1. Ask for a URL (or use localhost)
2. Install all dependencies
3. Configure services
4. Set up SSL certificate (if URL provided)

If you provide a URL, the script will use Let's Encrypt to install a valid SSL certificate.

### Step 4: Access MediaCMS

After installation completes:
- Navigate to your URL (or localhost)
- Log in with the admin credentials created during installation

## Service Management

MediaCMS uses several systemd services that are managed through the `mediacms.target` target. You can manage all services together using the target, or manage individual services.

### Using the Target (Recommended)

The `mediacms.target` manages all MediaCMS services together:

```bash
# Start all services
sudo systemctl start mediacms.target

# Stop all services
sudo systemctl stop mediacms.target

# Restart all services
sudo systemctl restart mediacms.target

# Check status of all services
sudo systemctl status mediacms.target

# Enable services to start on boot
sudo systemctl enable mediacms.target
```

### Individual Service Management

You can also manage services individually:

**Start Services:**
```bash
sudo systemctl start mediacms-api mediacms-celery-long mediacms-celery-short mediacms-celery-beat
```

**Stop Services:**
```bash
sudo systemctl stop mediacms-api mediacms-celery-long mediacms-celery-short mediacms-celery-beat
```

**Restart Services:**
```bash
sudo systemctl restart mediacms-api mediacms-celery-long mediacms-celery-short mediacms-celery-beat
```

**Check Status:**
```bash
sudo systemctl status mediacms-api
sudo systemctl status mediacms-celery-long
sudo systemctl status mediacms-celery-short
sudo systemctl status mediacms-celery-beat
```

### Available Services

- **mediacms-api.service** - Django API server (Gunicorn)
- **mediacms-celery-long.service** - Celery worker for long-duration tasks (video encoding)
- **mediacms-celery-short.service** - Celery worker for short-duration tasks (thumbnails, sprites)
- **mediacms-celery-beat.service** - Celery beat scheduler for periodic tasks
- **mediacms-migrations.service** - Database migrations (runs automatically on startup)

## Updating MediaCMS

### Standard Update

```bash
cd /home/mediacms.io/mediacms
source /home/mediacms.io/bin/activate  # Activate virtualenv
git pull                                 # Update code
pip install -r requirements.txt -U      # Update dependencies
python manage.py migrate                 # Run migrations
sudo systemctl restart mediacms.target   # Restart all services
```

### Update from Version 2 to Version 3

Version 3 requires:
- Python 3.8+ (Version 2 could use Python 3.6)
- Django 4
- Celery 5

**Before updating:**

1. Update Python if needed
2. Update Celery systemd files:

```bash
sudo cp config/systemd/mediacms-celery-long.service /etc/systemd/system/
sudo cp config/systemd/mediacms-celery-short.service /etc/systemd/system/
sudo cp config/systemd/mediacms-celery-beat.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl start mediacms-celery-long mediacms-celery-short mediacms-celery-beat
```

3. Then follow standard update process

## Configuration

Configuration files:
- `custom/local_settings.py` - Main configuration file
- `cms/settings.py` - Default settings (don't edit directly)

After making changes, restart services:

```bash
sudo systemctl restart mediacms.target
```

See [Configuration Guide](../../configuration/README.md) for details.

## File Locations

- **Application**: `/home/mediacms.io/mediacms/`
- **Media Files**: `/home/mediacms.io/mediacms/media_files/`
- **Static Files**: `/home/mediacms.io/mediacms/static/`
- **Logs**: Check systemd journal: `sudo journalctl -u mediacms-api` or `sudo journalctl -u mediacms.target`
- **Database**: PostgreSQL data directory (managed by PostgreSQL)

## Backups

### Database Backup

```bash
source /home/mediacms.io/bin/activate
pg_dump mediacms > backup_$(date +%Y%m%d).sql
```

### Media Files Backup

```bash
tar -czf media_backup_$(date +%Y%m%d).tar.gz /home/mediacms.io/mediacms/media_files/
```

See [Backup Guide](../../maintenance/backups.md) for detailed procedures.

## Troubleshooting

### Services Not Starting

Check logs:

```bash
# Check all services
sudo journalctl -u mediacms.target -n 50

# Check individual services
sudo journalctl -u mediacms-api -n 50
sudo journalctl -u mediacms-celery-long -n 50
sudo journalctl -u mediacms-celery-short -n 50
sudo journalctl -u mediacms-celery-beat -n 50
```

### Database Connection Issues

Verify PostgreSQL is running:

```bash
sudo systemctl status postgresql
```

### Permission Issues

Ensure proper ownership:

```bash
sudo chown -R mediacms:mediacms /home/mediacms.io/mediacms/
```

### Port Conflicts

Check if ports are in use:

```bash
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :8000
```

See [Troubleshooting Guide](../../../troubleshooting/installation-problems.md) for more help.

## Next Steps

1. [Configuration Guide](../../configuration/README.md) - Configure your installation
2. [Maintenance Guide](../../maintenance/README.md) - Learn about updates and backups
3. [Architecture Guide](architecture.md) - Understand the system architecture
