# Authentication Guide

Configure authentication methods for MediaCMS.

## Table of Contents

- [SAML Setup](saml-setup.md) - SAML authentication configuration
- [Identity Providers](identity-providers.md) - Identity provider setup
- [RBAC](rbac.md) - Role-Based Access Control

## Authentication Methods

MediaCMS supports:

1. **Local Authentication**: Username/password (default)
2. **SAML Authentication**: Single Sign-On via SAML 2.0
3. **Identity Providers**: Integration with external identity providers

## Quick Start

### Enable SAML

1. Edit `custom/local_settings.py`:

```python
USE_SAML = True
USE_IDENTITY_PROVIDERS = True
USE_RBAC = True
```

2. Configure SAML provider (see [SAML Setup](saml-setup.md))

3. Restart services:

```bash
make restart api celery_short celery_long celery_beat
```

## Next Steps

- [SAML Setup](saml-setup.md) - Detailed SAML configuration
- [Identity Providers](identity-providers.md) - Identity provider setup
- [RBAC](rbac.md) - Role-Based Access Control
