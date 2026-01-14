# Authentication Problems

Issues with login and authentication.

## Login Loops

### Symptoms

- Infinite redirect between login and homepage
- Can't access site
- Redirect errors

### Solutions

1. **Set LOGIN_URL**:

If using SAML with global login required:

```python
LOGIN_URL = "/accounts/saml/<your-client-id>/login/"
```

2. **Check GLOBAL_LOGIN_REQUIRED**:

```python
GLOBAL_LOGIN_REQUIRED = True
LOGIN_ALLOWED = True
```

3. **Verify SAML Configuration**:

Check SAML URLs are correct:
- SSO URL
- ACS URL
- SLO URL

4. **Check Session Configuration**:

```python
SESSION_COOKIE_SECURE = True  # For HTTPS
CSRF_COOKIE_SECURE = True
```

5. **Clear Browser Cache**:

Clear cookies and cache, try incognito mode.

## SAML Configuration Issues

### Symptoms

- SAML login fails
- Authentication errors
- Redirect issues

### Solutions

1. **Verify SAML Settings**:

Check all SAML configuration:
- Provider ID
- SSO URL
- SLO URL
- Certificate
- Attribute mappings

2. **Check SAML Response**:

Enable SAML response logging and review responses.

3. **Verify Certificate**:

Ensure certificate is valid and correctly formatted.

4. **Check URLs**:

Verify all SAML URLs are correct and accessible.

5. **Test Metadata**:

Access SP metadata URL:
```
https://your-mediacms.com/saml/metadata/
```

Verify it's correctly formatted.

## RBAC Permission Problems

### Symptoms

- Users can't access media
- Permissions not working
- Access denied errors

### Solutions

1. **Verify RBAC Enabled**:

```python
USE_RBAC = True
```

2. **Check Group Membership**:

Verify user is in correct RBAC group.

3. **Check Category Associations**:

Ensure category is associated with user's group.

4. **Verify User Role**:

Check user role in group (Member, Contributor, Manager).

5. **Check Media Category**:

Verify media is published to correct category.

## User Role Assignment Issues

### Symptoms

- Roles not applying
- Users don't have expected permissions
- Role changes not taking effect

### Solutions

1. **Check Role Mapping**:

If using SAML, verify role mapping configuration.

2. **Verify User Status**:

Check user account is:
- Active
- Approved
- Email verified (if required)

3. **Check Role Settings**:

Verify role is set correctly in user profile.

4. **Restart Services**:

After role changes:

```bash
make restart api
```

## Password Reset Issues

### Symptoms

- Password reset emails not sent
- Reset links don't work
- Reset fails

### Solutions

1. **Check Email Configuration**:

See [Email Issues](common-issues.md#email-delivery-issues).

2. **Verify Email Settings**:

```python
EMAIL_HOST = 'smtp.example.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
```

3. **Check Reset URL**:

Verify reset URL is accessible and correct.

4. **Check Token Expiry**:

Password reset tokens expire. Request new reset if expired.

## Account Lockout

### Symptoms

- Account locked after failed attempts
- Can't log in
- Lockout messages

### Solutions

1. **Wait for Timeout**:

```python
ACCOUNT_LOGIN_ATTEMPTS_TIMEOUT = 5  # Seconds
```

2. **Reset Lockout**:

Admin can reset user account lockout in Django admin.

3. **Check Attempt Limits**:

```python
ACCOUNT_LOGIN_ATTEMPTS_LIMIT = 20
```

4. **Review Security**:

If frequent lockouts, review security settings.

## SAML Response Debugging

### View SAML Responses

1. Enable SAML response logging in identity provider config
2. Open browser developer tools (F12)
3. Go to Network tab
4. Attempt SAML login
5. Find POST to `/accounts/saml/.../acs/`
6. View SAMLResponse in Form Data
7. Decode Base64 SAML response
8. Review XML for issues

### Common SAML Issues

- **Missing Attributes**: Verify attribute mappings
- **Wrong Certificate**: Check certificate is correct
- **URL Mismatch**: Verify all URLs match configuration
- **Time Sync**: Ensure server time is synchronized

## Next Steps

- [SAML Setup](../../administration/authentication/saml-setup.md) - SAML configuration
- [RBAC Guide](../../administration/authentication/rbac.md) - RBAC setup
- [Common Issues](common-issues.md) - Other common problems
- [Debugging Guide](debugging-guide.md) - Debugging techniques
