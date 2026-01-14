# Backup and Restore

Protect your MediaCMS data with regular backups.

## What to Backup

### Critical Data

- **Database**: All application data, users, media metadata
- **Media Files**: Uploaded and transcoded media
- **Configuration**: `local_settings.py` and custom files

### Important Data

- **Static Files**: Custom CSS, logos, images
- **Logs**: Application logs (for troubleshooting)
- **Celery Beat Data**: Scheduled task data

## Docker Installation Backups

### Database Backup

**Using Makefile**:

```bash
make backup-db
```

**Manual Backup**:

```bash
docker compose exec db pg_dump -U mediacms mediacms > backup_$(date +%Y%m%d).sql
```

**With Compression**:

```bash
docker compose exec -T db pg_dump -U mediacms mediacms | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Media Files Backup

Media files are stored in Docker volumes:

```bash
# List volumes
docker volume ls

# Backup media_files volume
docker run --rm -v mediacms_media_files:/data -v $(pwd):/backup alpine tar czf /backup/media_files_$(date +%Y%m%d).tar.gz /data
```

### Configuration Backup

```bash
# Backup local_settings.py
cp custom/local_settings.py custom/local_settings.py.backup_$(date +%Y%m%d)

# Backup custom directory
tar czf custom_backup_$(date +%Y%m%d).tar.gz custom/
```

### Complete Backup Script

```bash
#!/bin/bash
BACKUP_DIR="/backups/mediacms"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database
docker compose exec -T db pg_dump -U mediacms mediacms | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Media files
docker run --rm -v mediacms_media_files:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/media_$DATE.tar.gz /data

# Configuration
tar czf $BACKUP_DIR/config_$DATE.tar.gz custom/

echo "Backup completed: $BACKUP_DIR"
```

## Single Server Installation Backups

### Database Backup

```bash
source /home/mediacms.io/bin/activate
pg_dump mediacms > backup_$(date +%Y%m%d).sql
```

**With Compression**:

```bash
pg_dump mediacms | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Media Files Backup

```bash
tar czf media_backup_$(date +%Y%m%d).tar.gz /home/mediacms.io/mediacms/media_files/
```

### Configuration Backup

```bash
cp cms/local_settings.py cms/local_settings.py.backup_$(date +%Y%m%d)
```

## Restore Procedures

### Database Restore

**Docker Installation**:

```bash
# Stop services
make down

# Restore database
docker compose up -d db
sleep 5
docker compose exec -T db psql -U mediacms mediacms < backup_YYYYMMDD.sql

# Or from compressed backup
gunzip < backup_YYYYMMDD.sql.gz | docker compose exec -T db psql -U mediacms mediacms

# Start services
make up
```

**Single Server Installation**:

```bash
source /home/mediacms.io/bin/activate
psql mediacms < backup_YYYYMMDD.sql

# Or from compressed backup
gunzip < backup_YYYYMMDD.sql.gz | psql mediacms
```

### Media Files Restore

**Docker Installation**:

```bash
# Stop services
make down

# Restore volume
docker run --rm -v mediacms_media_files:/data -v $(pwd):/backup alpine sh -c "cd /data && tar xzf /backup/media_files_YYYYMMDD.tar.gz"

# Start services
make up
```

**Single Server Installation**:

```bash
cd /home/mediacms.io/mediacms
tar xzf media_backup_YYYYMMDD.tar.gz
```

### Configuration Restore

```bash
# Restore local_settings.py
cp custom/local_settings.py.backup_YYYYMMDD custom/local_settings.py

# Restore custom directory
tar xzf custom_backup_YYYYMMDD.tar.gz
```

## Backup Schedule

### Recommended Schedule

- **Database**: Daily (automated)
- **Media Files**: Weekly (or as needed)
- **Configuration**: Before any changes

### Automated Backups

Create a cron job for automated backups:

```bash
# Edit crontab
crontab -e

# Daily database backup at 2 AM
0 2 * * * /path/to/backup-script.sh
```

## Backup Storage

### Local Storage

- Store backups on separate disk/partition
- Keep multiple backup versions
- Rotate old backups

### Remote Storage

Consider:
- Cloud storage (S3, Google Cloud Storage)
- Network storage (NFS, SMB)
- Off-site backups

### Backup Retention

- Daily backups: Keep 7-30 days
- Weekly backups: Keep 4-12 weeks
- Monthly backups: Keep 6-12 months

## Testing Backups

### Regular Testing

- Test restore procedures monthly
- Verify backup integrity
- Document restore process
- Keep restore documentation updated

### Test Restore

1. Create test environment
2. Restore from backup
3. Verify data integrity
4. Test functionality

## Disaster Recovery

### Recovery Plan

1. **Assess damage**: Determine what needs restoration
2. **Stop services**: Prevent further data loss
3. **Restore backups**: Restore in order (database, media, config)
4. **Verify**: Test functionality
5. **Document**: Record what happened and what was restored

### Recovery Time Objectives

- **RTO (Recovery Time Objective)**: Target time to restore
- **RPO (Recovery Point Objective)**: Maximum acceptable data loss

Plan backups accordingly.

## Next Steps

- [Updates](updates.md) - Update procedures
- [Monitoring](monitoring.md) - Monitor your system
- [Troubleshooting](../../../troubleshooting/README.md) - Problem solving
