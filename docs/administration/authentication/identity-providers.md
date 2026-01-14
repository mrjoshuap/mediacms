# Identity Providers

Configure external identity providers for MediaCMS authentication.

## Overview

The Identity Providers system allows you to:
- Add identity providers through Django admin
- Configure role and group mappings
- Manage login options
- Log SAML responses for troubleshooting

## Enabling Identity Providers

Edit `custom/local_settings.py`:

```python
USE_IDENTITY_PROVIDERS = True
```

Restart services:

```bash
make restart api celery_short celery_long celery_beat
```

## Identity Provider Features

### Provider Management

- Add identity providers through admin interface
- Configure SAML settings
- Set up attribute mappings
- Manage role and group mappings

### Role Mapping

Map identity provider roles to MediaCMS roles:
- **advancedUser**: Advanced user role
- **editor**: MediaCMS Editor
- **manager**: MediaCMS Manager
- **admin**: Administrator

### Group Mapping

Map identity provider groups to MediaCMS RBAC groups:
- Associate SAML groups with MediaCMS groups
- Automatically add users to groups on login
- Remove users from groups if removed from identity provider

### Category Mapping

Map identity provider groups to MediaCMS categories:
- Automatically associate users with categories
- Control media access by category

### Login Options

Configure available login methods:
- System login (local authentication)
- Identity provider login (SAML)
- Custom login URLs
- Display order

## SAML Response Logging

Enable SAML response logging for troubleshooting:

1. Edit identity provider configuration
2. Enable **Save SAML Response Log**
3. View logs in Django admin under **Identity Providers → SAML Response Logs**

**Note**: Disable logging in production for security.

## Supported Providers

### Out of the Box

- **SAML 2.0**: Full SAML support

### Extensible

Any identity provider supported by django-allauth can be added with minimal effort.

## Configuration Workflow

1. **Enable Identity Providers**: Set `USE_IDENTITY_PROVIDERS = True`
2. **Add Identity Provider**: Configure in Django admin
3. **Set Up Mappings**: Configure role, group, and category mappings
4. **Add Login Option**: Make login method available to users
5. **Test**: Verify authentication works correctly

## Best Practices

1. **Test First**: Test in development before production
2. **Document Mappings**: Keep notes on role and group mappings
3. **Monitor Logs**: Review authentication logs regularly
4. **Secure Certificates**: Keep certificates secure
5. **Regular Reviews**: Review mappings periodically

## Troubleshooting

See [SAML Setup](saml-setup.md) for SAML-specific issues.

Common issues:
- Mappings not applying
- Users not added to groups
- Roles not assigned correctly

See [Authentication Problems](../../../troubleshooting/authentication-problems.md) for help.

## Next Steps

- [SAML Setup](saml-setup.md) - SAML configuration
- [RBAC](rbac.md) - Role-Based Access Control
- [Troubleshooting](../../../troubleshooting/authentication-problems.md) - Authentication issues
