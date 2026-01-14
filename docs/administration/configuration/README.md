# Configuration Guide

Configure MediaCMS to match your needs and requirements.

## Configuration Files

Edit `custom/local_settings.py` to override default settings for both Docker and single server installations.

**Important**: Never edit `cms/settings.py` directly. Always use `custom/local_settings.py` to override settings.

## Configuration Sections

- [Basic Settings](basic-settings.md) - Essential configuration options
- [Portal Customization](portal-customization.md) - Branding and appearance
- [User Management](user-management.md) - User registration and roles
- [Media Settings](media-settings.md) - Media upload and processing
- [Advanced Configuration](advanced-configuration.md) - Advanced options

## Applying Changes

After editing configuration:

**Docker Installation**:
```bash
make restart api celery_short celery_long celery_beat
```

**Single Server Installation**:
```bash
sudo systemctl restart mediacms celery_long celery_short celery_beat
```

## Configuration Reference

See [Configuration Reference](../../reference/configuration-reference.md) for a complete list of all available settings.

## Best Practices

1. **Backup before changes**: Always backup your configuration
2. **Test changes**: Test in development first
3. **Document changes**: Keep notes on customizations
4. **Version control**: Consider versioning your `local_settings.py`
5. **Validate syntax**: Check Python syntax before restarting

## Getting Help

- Check [Configuration Reference](../../reference/configuration-reference.md)
- Review [Troubleshooting Guide](../../../troubleshooting/README.md)
- See [Common Issues](../../../troubleshooting/common-issues.md)
