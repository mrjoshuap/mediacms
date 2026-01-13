#!/bin/sh
set -e

echo "========================================="
echo "MediaCMS Migrations Starting..."
echo "========================================="

# Ensure virtualenv is activated
export VIRTUAL_ENV=/home/mediacms.io
export PATH="$VIRTUAL_ENV/bin:$PATH"

# Use explicit python path from virtualenv
PYTHON="$VIRTUAL_ENV/bin/python"

echo "System uname: $(uname -a)"
echo "System os-release: $(cat /etc/os-release)"
echo "System user: $(whoami)"
echo "System group: $(id -gn)"
echo "System PATH: $PATH"

echo "========================================="
echo "Virtualenv PATH: $VIRTUAL_ENV/bin"

echo "Using Python: $PYTHON"
$PYTHON --version

echo "Using gunicorn: $(which gunicorn)"
gunicorn --version

echo "========================================="
echo "Using bento4 mp4hls: $(which mp4hls)"

echo "========================================="
echo "Using ffmpeg: $(which ffmpeg)"
ffmpeg -version
ffmpeg -hide_banner -hwaccels
ffmpeg -hide_banner -devices

echo "========================================="
echo "Using ffprobe: $(which ffprobe)"
ffprobe -version

echo "========================================="
echo "Filesystem usage:"
df | head -n 1 ; df | grep mediacms

echo "========================================="
# Run migrations
echo "Running database migrations..."
$PYTHON manage.py migrate

# Check if this is a new installation
EXISTING_INSTALLATION=$(echo "from users.models import User; print(User.objects.exists())" | $PYTHON manage.py shell)

if [ "$EXISTING_INSTALLATION" = "True" ]; then
    echo "Existing installation detected, skipping initial data load"
else
    echo "New installation detected, loading initial data..."

    # Load fixtures
    $PYTHON manage.py loaddata fixtures/encoding_profiles.json
    $PYTHON manage.py loaddata fixtures/categories.json

    # Create admin user
    RANDOM_ADMIN_PASS=$($PYTHON -c "import secrets;chars = 'abcdefghijklmnopqrstuvwxyz0123456789';print(''.join(secrets.choice(chars) for i in range(10)))")
    ADMIN_PASSWORD=${ADMIN_PASSWORD:-$RANDOM_ADMIN_PASS}

    DJANGO_SUPERUSER_PASSWORD=$ADMIN_PASSWORD $PYTHON manage.py createsuperuser \
        --no-input \
        --username=${ADMIN_USER:-admin} \
        --email=${ADMIN_EMAIL:-admin@localhost} \
        --database=default || true

    echo "========================================="
    echo "Admin user created with password: $ADMIN_PASSWORD"
    echo "========================================="
fi

# Run collectstatic if static volume is empty
STATIC_DIR="/home/mediacms.io/mediacms/static"
if [ -z "$(ls -A $STATIC_DIR 2>/dev/null)" ]; then
    echo "Static files directory is empty, running collectstatic..."
    $PYTHON manage.py collectstatic --noinput
    echo "Static files collected successfully"
else
    echo "Static files directory is not empty, skipping collectstatic"
fi

# Initialize media_files directory structure if empty
MEDIA_DIR="/home/mediacms.io/mediacms/media_files"
if [ -z "$(ls -A $MEDIA_DIR 2>/dev/null)" ]; then
    echo "Media files directory is empty, initializing structure..."
    
    # Create required subdirectories
    mkdir -p "$MEDIA_DIR/original/thumbnails"
    mkdir -p "$MEDIA_DIR/original/subtitles"
    mkdir -p "$MEDIA_DIR/encoded"
    mkdir -p "$MEDIA_DIR/hls"
    mkdir -p "$MEDIA_DIR/chunks"
    mkdir -p "$MEDIA_DIR/uploads"
    mkdir -p "$MEDIA_DIR/tinymce_media"
    mkdir -p "$MEDIA_DIR/userlogos"
    
    # Copy stock media files from staging location if they exist
    STOCK_MEDIA_DIR="/home/mediacms.io/stock_media_files"
    if [ -d "$STOCK_MEDIA_DIR/userlogos" ]; then
        echo "Copying stock userlogos files..."
        cp -r "$STOCK_MEDIA_DIR/userlogos"/* "$MEDIA_DIR/userlogos/" 2>/dev/null || true
    fi
    
    # Directories created by www-data will already have correct ownership
    echo "Media files directory structure initialized successfully"
else
    echo "Media files directory is not empty, skipping initialization"
fi

echo "========================================="
echo "Migrations completed successfully!"
echo "========================================="
