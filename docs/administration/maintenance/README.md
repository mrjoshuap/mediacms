# Maintenance Guide

Procedures for maintaining and updating your MediaCMS installation.

## Table of Contents

- [Updates](updates.md) - Updating MediaCMS
- [Backups](backups.md) - Backup and restore procedures
- [Monitoring](monitoring.md) - System monitoring
- [Scaling](scaling.md) - Scaling your deployment

## Regular Maintenance Tasks

### Daily

- Check service status
- Review error logs
- Monitor disk space
- Check transcoding queue

### Weekly

- Review system performance
- Check for updates
- Verify backups
- Review user activity

### Monthly

- Apply updates
- Review and optimize configuration
- Check security updates
- Review resource usage

## Quick Health Check

```bash
# Docker
make ps
make logs --tail=50

# Single Server
sudo systemctl status mediacms celery_long celery_short celery_beat
sudo journalctl -u mediacms -n 50
```

## Getting Help

- [Troubleshooting Guide](../../../troubleshooting/README.md)
- [Common Issues](../../../troubleshooting/common-issues.md)
- [Performance Issues](../../../troubleshooting/performance-issues.md)
