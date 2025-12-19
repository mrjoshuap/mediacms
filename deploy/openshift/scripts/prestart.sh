#!/bin/bash
set -euo pipefail

# Generate random admin password if not provided
RANDOM_ADMIN_PASS=$(python -c "import secrets;chars = 'abcdefghijklmnopqrstuvwxyz0123456789';print(''.join(secrets.choice(chars) for i in range(10)))")
ADMIN_PASSWORD=${ADMIN_PASSWORD:-$RANDOM_ADMIN_PASS}

if [ "${ENABLE_MIGRATIONS:-no}" = "yes" ]; then
    echo "Running database migrations..."
    python manage.py migrate
    
    EXISTING_INSTALLATION=$(echo "from users.models import User; print(User.objects.exists())" | python manage.py shell)
    if [ "$EXISTING_INSTALLATION" = "True" ]; then
        echo "Database already initialized - skipping loaddata and user creation"
    else
        echo "Initializing database with fixtures and creating admin user..."
        # Validate required environment variables for superuser creation
        if [ -z "${ADMIN_USER:-}" ] || [ -z "${ADMIN_EMAIL:-}" ]; then
            echo "ERROR: ADMIN_USER and ADMIN_EMAIL must be set to create superuser" >&2
            exit 1
        fi
        python manage.py loaddata fixtures/encoding_profiles.json
        # post_save, needs redis to succeed (ie. migrate depends on redis)
        
        python manage.py loaddata fixtures/categories.json

        if DJANGO_SUPERUSER_PASSWORD="$ADMIN_PASSWORD" python manage.py createsuperuser \
            --no-input \
            --username="$ADMIN_USER" \
            --email="$ADMIN_EMAIL" \
            --database=default 2>/dev/null; then
            echo "Admin user '$ADMIN_USER' created successfully" >&2
        else
            echo "WARNING: Failed to create admin user (may already exist)" >&2
        fi

    fi
    
    echo "Collecting static files..."
    python manage.py collectstatic --noinput
    echo "Copying contents of /home/mediacms.io/mediacms/static-vanilla to /home/mediacms.io/mediacms/static"
    cp -r /home/mediacms.io/mediacms/static-vanilla/* /home/mediacms.io/mediacms/static/
    echo "Static files collected successfully"

    echo "Collecting base media files..."
    echo "Copying contents of /home/mediacms.io/mediacms/media_files-vanilla to /home/mediacms.io/mediacms/media_files"
    cp -r /home/mediacms.io/mediacms/media_files-vanilla/* /home/mediacms.io/mediacms/media_files/
    echo "Base media files collected successfully"

    # echo "Updating hostname ..."
    # TODO: Get the FRONTEND_HOST from cms/local_settings.py
    # echo "from django.contrib.sites.models import Site; Site.objects.update(name='$FRONTEND_HOST', domain='$FRONTEND_HOST')" | python manage.py shell
fi

# Validate required configuration files for enabled services
# Configuration files must be provided via ConfigMap volume mounts in OpenShift deployments.

ERRORS=0

# Check nginx configurations (required if ENABLE_NGINX=yes)
if [ "${ENABLE_NGINX:-no}" = "yes" ]; then
    echo "Enabling nginx as uwsgi app proxy and media server"
    
    if [ ! -f /etc/nginx/nginx.conf ]; then
        echo "ERROR: Required ConfigMap file missing: /etc/nginx/nginx.conf" >&2
        echo "  Resolution: Ensure 'web-config' ConfigMap is mounted with 'nginx.conf'" >&2
        echo "  Check your deployment manifest has volumeMount for web-config ConfigMap" >&2
        ERRORS=$((ERRORS + 1))
    fi
    
    if [ ! -f /etc/nginx/sites-enabled/uwsgi_params ]; then
        echo "ERROR: Required ConfigMap file missing: /etc/nginx/sites-enabled/uwsgi_params" >&2
        echo "  Resolution: Ensure 'web-config' ConfigMap is mounted with 'uwsgi_params'" >&2
        echo "  Check your deployment manifest has volumeMount for nginx-uwsgi-params ConfigMap" >&2
        ERRORS=$((ERRORS + 1))
    fi
fi

# Check uwsgi configuration (required if ENABLE_UWSGI=yes)
if [ "${ENABLE_UWSGI:-no}" = "yes" ]; then
    echo "Enabling uwsgi app server"
    
    if [ ! -f /etc/uwsgi/uwsgi.ini ]; then
        echo "ERROR: Required ConfigMap file missing: /etc/uwsgi/uwsgi.ini" >&2
        echo "  Resolution: Ensure 'uwsgi-config' ConfigMap is mounted with 'uwsgi.ini'" >&2
        echo "  Check your deployment manifest has volumeMount for uwsgi-config ConfigMap" >&2
        ERRORS=$((ERRORS + 1))
    fi
fi

# Exit with error if any required files are missing
if [ $ERRORS -gt 0 ]; then
    echo "" >&2
    echo "==================================================================================" >&2
    echo "CONFIGURATION ERROR: $ERRORS required ConfigMap file(s) are missing" >&2
    echo "==================================================================================" >&2
    echo "All configuration files must be provided via ConfigMap volume mounts." >&2
    echo "" >&2
    echo "Required ConfigMaps (depending on enabled services):" >&2
    echo "  - web-config (for nginx configurations, if ENABLE_NGINX=yes)" >&2
    echo "  - uwsgi-config (for uwsgi configuration, if ENABLE_UWSGI=yes)" >&2
    echo "  - imagemagick-policy (for ImageMagick policy)" >&2
    echo "" >&2
    echo "Ensure your deployment manifest includes volumeMounts for these ConfigMaps." >&2
    echo "See deploy/openshift/components/*-deployment.yaml for examples." >&2
    echo "==================================================================================" >&2
    exit 1
fi
