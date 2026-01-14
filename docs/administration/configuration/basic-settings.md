# Basic Settings

Essential configuration options for MediaCMS.

## Portal Name

Set the global portal title:

```python
PORTAL_NAME = 'My Awesome Portal'
```

## Email Configuration

Configure email settings for notifications and user verification:

```python
DEFAULT_FROM_EMAIL = 'info@mediacms.io'
EMAIL_HOST = 'smtp.example.com'
EMAIL_PORT = 587
EMAIL_HOST_USER = 'info@mediacms.io'
EMAIL_HOST_PASSWORD = 'your-password'
EMAIL_USE_TLS = True
SERVER_EMAIL = DEFAULT_FROM_EMAIL
ADMIN_EMAIL_LIST = ['admin@mediacms.io']
```

### Common Email Providers

**Gmail**:
```python
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
```

**Outlook/Office365**:
```python
EMAIL_HOST = 'smtp.office365.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
```

**SendGrid**:
```python
EMAIL_HOST = 'smtp.sendgrid.net'
EMAIL_PORT = 587
EMAIL_HOST_USER = 'apikey'
EMAIL_HOST_PASSWORD = 'your-sendgrid-api-key'
EMAIL_USE_TLS = True
```

See [Troubleshooting Email Issues](../../../troubleshooting/common-issues.md#email-issues) if you have problems.

## Portal Workflow

Control default visibility of newly uploaded media:

```python
PORTAL_WORKFLOW = 'public'  # Options: 'public', 'private', 'unlisted'
```

- **public**: Media appears in listings (default)
- **private**: Only owner and authorized users can see
- **unlisted**: Accessible via direct link, not in listings

## Login and Registration

### Show/Hide Login Button

```python
LOGIN_ALLOWED = True  # Show login button
LOGIN_ALLOWED = False  # Hide login button
```

### Show/Hide Register Button

```python
REGISTER_ALLOWED = True  # Allow registration
REGISTER_ALLOWED = False  # Disable registration
```

### Disable Self-Registration

```python
USERS_CAN_SELF_REGISTER = False
```

### Require Email Verification

```python
ACCOUNT_EMAIL_VERIFICATION = 'mandatory'  # Require email verification
ACCOUNT_EMAIL_VERIFICATION = 'optional'   # Optional (default)
```

### Require User Approval

```python
USERS_NEEDS_TO_BE_APPROVED = True
```

Users must be approved by an administrator before they can log in.

## Domain Restrictions

### Restrict Registration Domains

Block specific domains:

```python
RESTRICTED_DOMAINS_FOR_USER_REGISTRATION = [
    'example.com',
    'spam.com'
]
```

### Allow Only Specific Domains

Allow only permitted domains (useful for private deployments):

```python
ALLOWED_DOMAINS_FOR_USER_REGISTRATION = [
    "company.com",
    "subdomain.company.com"
]
```

## Global Login Requirement

Require login to view any content:

```python
GLOBAL_LOGIN_REQUIRED = True
```

Combined with `PORTAL_WORKFLOW = 'public'`, this creates a members-only portal.

## Rate Limiting

### Login Attempt Limits

```python
ACCOUNT_LOGIN_ATTEMPTS_LIMIT = 20  # Max attempts
ACCOUNT_LOGIN_ATTEMPTS_TIMEOUT = 5  # Timeout in seconds
```

## Sitemap

Enable sitemap generation:

```python
GENERATE_SITEMAP = True  # Enable sitemap at /sitemap.xml
```

## Notifications

### User Notifications

```python
USERS_NOTIFICATIONS = {
    'MEDIA_ADDED': True,  # Notify when media is added
}
```

### Admin Notifications

```python
ADMINS_NOTIFICATIONS = {
    'NEW_USER': True,        # New user registered
    'MEDIA_ADDED': True,     # New media uploaded
    'MEDIA_REPORTED': True,  # Media reported
}
```

## Next Steps

- [Portal Customization](portal-customization.md) - Customize appearance
- [User Management](user-management.md) - Configure user permissions
- [Media Settings](media-settings.md) - Configure media uploads
