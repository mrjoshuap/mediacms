# Updating MediaCMS

Keep your MediaCMS installation up to date with the latest features and security fixes.

## Docker Installation Updates

### Standard Update Process

1. **Pull latest code**:

```bash
cd /path/to/mediacms
git pull
```

2. **Pull latest Docker images**:

```bash
make pull
```

3. **Stop services**:

```bash
make down
```

4. **Start services**:

```bash
make up
```

Or combine steps:

```bash
cd /path/to/mediacms
git pull
make pull
make down
make up
```

### Full Installation Updates

For installations with Whisper:

```bash
cd /path/to/mediacms
git pull
make pull-full
make down-full
make up-full
```

### Update Specific Services

Update only certain services:

```bash
docker compose pull api
docker compose up -d api
```

## Single Server Installation Updates

### Standard Update Process

1. **Activate virtual environment**:

```bash
cd /home/mediacms.io/mediacms
source /home/mediacms.io/bin/activate
```

2. **Pull latest code**:

```bash
git pull
```

3. **Update dependencies**:

```bash
pip install -r requirements.txt -U
```

4. **Run migrations**:

```bash
python manage.py migrate
```

5. **Restart services**:

```bash
sudo systemctl restart mediacms.target
```

## Major Version Updates

### Version 2 to Version 3

**Docker Installation**:

Version 3 uses PostgreSQL 15. If upgrading from PostgreSQL 13:

**Option 1**: Use PostgreSQL 13 temporarily

Edit `docker-compose.yaml` to use `postgres:13` image.

**Option 2**: Migrate to PostgreSQL 15

See [GitHub PR #749](https://github.com/mediacms-io/mediacms/pull/749) for migration steps.

**Single Server Installation**:

1. **Update Python** (requires Python 3.8+):

```bash
python3 --version  # Verify Python 3.8+
```

2. **Update Celery systemd files**:

```bash
sudo cp config/systemd/mediacms-celery-long.service /etc/systemd/system/
sudo cp config/systemd/mediacms-celery-short.service /etc/systemd/system/
sudo cp config/systemd/mediacms-celery-beat.service /etc/systemd/system/
sudo systemctl daemon-reload
```

3. **Follow standard update process**

## Before Updating

### Backup

Always backup before updating:

```bash
# Database backup
make backup-db

# Or manually
docker compose exec db pg_dump -U mediacms mediacms > backup.sql
```

See [Backup Guide](backups.md) for complete backup procedures.

### Check Release Notes

Review release notes for:
- Breaking changes
- New requirements
- Migration steps
- Configuration changes

### Test in Development

If possible, test updates in a development environment first.

## After Updating

### Verify Services

```bash
# Docker
make ps

# Single Server
sudo systemctl status mediacms.target
```

### Check Logs

```bash
# Docker
make logs --tail=100

# Single Server
sudo journalctl -u mediacms.target -n 100
```

### Test Functionality

- Log in to admin panel
- Upload a test file
- Verify transcoding works
- Check API endpoints

## Troubleshooting Updates

### Services Won't Start

- Check logs: `make logs` or `sudo journalctl -u mediacms.target`
- Verify configuration: Check `local_settings.py` for errors
- Check dependencies: Ensure all requirements are installed

### Database Migration Errors

- Check database logs
- Verify database version compatibility
- Review migration files
- Consider restoring from backup

### Configuration Errors

- Verify `local_settings.py` syntax
- Check for deprecated settings
- Review release notes for changes

See [Troubleshooting Guide](../../../troubleshooting/installation-problems.md) for more help.

## Automatic Updates

**Not Recommended** for production. Consider:

- Manual updates with testing
- Staged rollouts
- Monitoring after updates

## Next Steps

- [Backups](backups.md) - Backup procedures
- [Monitoring](monitoring.md) - Monitor your system
- [Troubleshooting](../../../troubleshooting/README.md) - Problem solving
