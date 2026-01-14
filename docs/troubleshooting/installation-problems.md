# Installation Problems

Common installation and setup issues.

## Docker Issues

### Docker Not Starting

**Symptoms**: Docker containers won't start

**Solutions**:

1. **Check Docker Status**:

```bash
sudo systemctl status docker
```

2. **Start Docker**:

```bash
sudo systemctl start docker
```

3. **Check Docker Compose**:

```bash
docker compose version
```

4. **Check Port Conflicts**:

```bash
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :8000
```

### Container Exits Immediately

**Symptoms**: Containers start then exit

**Solutions**:

1. **Check Logs**:

```bash
docker compose logs [service-name]
```

2. **Check Health Status**:

```bash
docker compose ps
```

3. **Verify Configuration**:

Check `docker-compose.yaml` for errors.

4. **Check Resources**:

Ensure sufficient CPU, memory, and disk space.

### Volume Mounting Issues

**Symptoms**: Data not persisting, permission errors

**Solutions**:

1. **Check Volume Permissions**:

```bash
docker compose exec api ls -la /home/mediacms.io/mediacms/media_files/
```

2. **Verify Volume Configuration**:

Check `docker-compose.yaml` volume mounts.

3. **Check Host Permissions**:

Ensure Docker has access to mounted directories.

### Image Pull Failures

**Symptoms**: Can't download Docker images

**Solutions**:

1. **Check Internet Connection**:

```bash
ping docker.io
```

2. **Check Docker Hub Access**:

Verify Docker Hub is accessible.

3. **Use Mirror**:

Configure Docker registry mirror if needed.

4. **Manual Pull**:

```bash
docker pull mediacms/mediacms:latest
```

## Database Connection Problems

### Database Won't Start

**Symptoms**: Database container/service fails

**Solutions**:

1. **Check Logs**:

```bash
# Docker
docker compose logs db

# Single Server
sudo journalctl -u postgresql
```

2. **Check Disk Space**:

```bash
df -h
```

3. **Check Port Conflicts**:

```bash
sudo netstat -tulpn | grep :5432
```

4. **Verify Configuration**:

Check database configuration in `docker-compose.yaml` or PostgreSQL config.

### Connection Refused

**Symptoms**: Can't connect to database

**Solutions**:

1. **Verify Database Running**:

```bash
# Docker
docker compose ps db

# Single Server
sudo systemctl status postgresql
```

2. **Check Connection String**:

Verify database connection settings:
- Host
- Port
- Username
- Password
- Database name

3. **Test Connection**:

```bash
# Docker
docker compose exec db psql -U mediacms -d mediacms

# Single Server
psql -U mediacms -d mediacms
```

### Migration Errors

**Symptoms**: Database migrations fail

**Solutions**:

1. **Check Migration Logs**:

```bash
docker compose logs migrations
```

2. **Run Migrations Manually**:

```bash
# Docker
docker compose exec api python manage.py migrate

# Single Server
python manage.py migrate
```

3. **Check Database Version**:

Verify PostgreSQL version compatibility.

4. **Backup and Reset**:

If needed, backup and recreate database (development only).

## Port Conflicts

### Port Already in Use

**Symptoms**: Services can't bind to ports

**Solutions**:

1. **Find Process Using Port**:

```bash
sudo lsof -i :80
sudo lsof -i :8000
sudo lsof -i :5432
```

2. **Stop Conflicting Service**:

```bash
sudo systemctl stop [service-name]
```

3. **Change Port**:

Edit `docker-compose.yaml` to use different ports:

```yaml
ports:
  - "8080:80"  # Use port 8080 instead of 80
```

## SSL Certificate Problems

### Certificate Not Generated

**Symptoms**: HTTPS not working, certificate errors

**Solutions**:

1. **Check Let's Encrypt**:

Verify Let's Encrypt client is working.

2. **Check Domain Configuration**:

Ensure domain points to server.

3. **Check Firewall**:

Verify ports 80 and 443 are open.

4. **Manual Certificate**:

Use manual certificate installation if needed.

### Certificate Expired

**Symptoms**: SSL errors, expired certificate warnings

**Solutions**:

1. **Renew Certificate**:

```bash
# Let's Encrypt renewal
certbot renew
```

2. **Check Renewal Schedule**:

Set up automatic renewal.

3. **Verify Certificate**:

```bash
openssl x509 -in certificate.crt -text -noout
```

## Single Server Installation Issues

### Installation Script Fails

**Symptoms**: `install.sh` script errors

**Solutions**:

1. **Check Prerequisites**:

- Ubuntu 22.04 or 24.04
- Root or sudo access
- Git installed
- Clean system

2. **Check Logs**:

Review script output for errors.

3. **Manual Installation**:

Follow manual installation steps if script fails.

### Service Won't Start

**Symptoms**: systemd services fail

**Solutions**:

1. **Check Service Status**:

```bash
sudo systemctl status mediacms
```

2. **Check Logs**:

```bash
sudo journalctl -u mediacms.target -n 50
```

3. **Check Configuration**:

Verify configuration files are correct.

4. **Check Permissions**:

Ensure proper file permissions.

### Python Version Issues

**Symptoms**: Python version errors

**Solutions**:

1. **Check Python Version**:

```bash
python3 --version
```

MediaCMS requires Python 3.8+.

2. **Install Correct Version**:

```bash
sudo apt install python3.11 python3.11-venv
```

3. **Update Virtual Environment**:

Recreate virtual environment with correct Python version.

## Next Steps

- [Common Issues](common-issues.md) - Other common problems
- [Debugging Guide](debugging-guide.md) - Debugging techniques
- [Troubleshooting Index](README.md) - All troubleshooting guides
