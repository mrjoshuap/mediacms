# Getting Started - Administrators

This guide will help you install and configure MediaCMS quickly.

## Prerequisites

Before you begin, ensure you have:

- A server with Docker and Docker Compose installed (for Docker installation)
- OR a Linux server (Ubuntu 22/24 recommended for single-server installation)
- At least 4GB RAM and 2-4 CPUs (minimum)
- Sufficient disk space (plan for 3x your expected media storage)

## Choosing Your Deployment Method

MediaCMS supports two main deployment methods:

1. **Docker Compose** (Recommended) - Easy to deploy, maintain, and scale
2. **Single Server** - Traditional installation on a Linux server

> **Recommendation**: Use Docker Compose for most deployments. It's easier to maintain and update.

## Quick Docker Installation (10 Minutes)

### Step 1: Install Docker and Docker Compose

For Ubuntu:

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

```bash
make up
```

Or using docker compose directly:

```bash
docker compose up -d
```

### Step 4: Get Admin Credentials

Check the migration logs for your admin password:

```bash
docker compose logs migrations | grep "Created admin user"
```

You should see output like:

```
migrations | Created admin user with password: gwg1clfkwf
```

### Step 5: Access MediaCMS

Open your browser and navigate to:
- `http://localhost` (if running locally)
- `http://your-server-ip` (if running on a server)

Log in with:
- Username: `admin`
- Password: (from Step 4)

## Initial Configuration

### 1. Set Admin Password

After first login, change your admin password:
1. Click on your profile
2. Go to Settings
3. Change password

### 2. Configure Basic Settings

Edit `custom/local_settings.py`:

```python
# Portal name
PORTAL_NAME = 'My Media Portal'

# Email settings (if needed)
EMAIL_HOST = 'smtp.example.com'
EMAIL_PORT = 587
EMAIL_HOST_USER = 'your-email@example.com'
EMAIL_HOST_PASSWORD = 'your-password'
EMAIL_USE_TLS = True
DEFAULT_FROM_EMAIL = 'your-email@example.com'
```

Restart the API container:

```bash
make restart api
```

### 3. Configure Portal Logo (Optional)

1. Place your logo in `custom/static/images/logo_dark.png`
2. Update `custom/local_settings.py`:

```python
PORTAL_LOGO_DARK_PNG = "/custom/static/images/logo_dark.png"
```

3. Restart the API container

## Verifying Installation

### Check Service Status

```bash
make ps
```

All services should show as "running" or "healthy".

### Check Logs

```bash
make logs
```

Look for any errors or warnings.

### Test Upload

1. Log in to MediaCMS
2. Upload a test video
3. Verify it processes correctly

## Next Steps

Now that MediaCMS is installed, explore these areas:

1. **[Installation Guide](../administration/installation/README.md)** - Detailed installation options
2. **[Configuration](../administration/configuration/README.md)** - Complete configuration guide
3. **[Maintenance](../administration/maintenance/README.md)** - Updates and backups
4. **[Architecture](../administration/installation/architecture.md)** - Understand the system architecture

## Common Next Steps

- **Enable HTTPS**: Set up SSL certificates (see [Configuration Guide](../administration/configuration/README.md))
- **Configure Email**: Set up email notifications (see [Configuration Guide](../administration/configuration/basic-settings.md))
- **Set Up Backups**: Configure backup procedures (see [Backups](../administration/maintenance/backups.md))
- **Enable SAML**: Configure SSO authentication (see [SAML Setup](../administration/authentication/saml-setup.md))

## Troubleshooting

If you encounter issues:

- Check [Installation Problems](../troubleshooting/installation-problems.md)
- Review [Common Issues](../troubleshooting/common-issues.md)
- Check service logs: `make logs [service-name]`

## Need Help?

- Review the [Administration Guide](../administration/README.md)
- Check the [Troubleshooting Guide](../troubleshooting/README.md)
- Open an issue on GitHub
