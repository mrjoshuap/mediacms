#!/bin/bash
set -euo pipefail

# Forward nginx logs to stdout/stderr for Kubernetes log collection (only if nginx is enabled)
# This ensures logs are captured by kubectl logs and log aggregation systems
if [ "${ENABLE_NGINX:-no}" = "yes" ]; then
    # Ensure nginx log directory exists before creating symlinks
    mkdir -p /var/log/nginx
    ln -sf /dev/stdout /var/log/nginx/access.log
    ln -sf /dev/stderr /var/log/nginx/error.log
    ln -sf /dev/stdout /var/log/nginx/mediacms.io.access.log
    ln -sf /dev/stderr /var/log/nginx/mediacms.io.error.log
fi

# local_settings.py must be provided via ConfigMap volume mount in OpenShift deployments
if [ ! -f /home/mediacms.io/mediacms/cms/local_settings.py ]; then
    echo "ERROR: Required ConfigMap file missing: /home/mediacms.io/mediacms/cms/local_settings.py" >&2
    echo "  Resolution: Ensure 'mediacms-config' ConfigMap is mounted with 'local_settings.py'" >&2
    echo "  Check your deployment manifest has volumeMount for local-settings ConfigMap" >&2
    echo "" >&2
    echo "Example volumeMount configuration:" >&2
    echo "  volumeMounts:" >&2
    echo "  - name: local-settings" >&2
    echo "    mountPath: /home/mediacms.io/mediacms/cms/local_settings.py" >&2
    echo "    subPath: local_settings.py" >&2
    echo "    readOnly: true" >&2
    echo "" >&2
    echo "Example volume configuration:" >&2
    echo "  volumes:" >&2
    echo "  - name: local-settings" >&2
    echo "    configMap:" >&2
    echo "      name: mediacms-config" >&2
    echo "" >&2
    exit 1
fi


# Get current UID/GID (assigned by OpenShift)
CURRENT_UID=$(id -u)
CURRENT_GID=$(id -g)
echo "Running as UID: $CURRENT_UID, GID: $CURRENT_GID"

# Create required directories for logs and media files
# Directories will be owned by the current user automatically
echo "Setting up application directories..."
mkdir -p /home/mediacms.io/mediacms/{logs,media_files/hls}
touch /home/mediacms.io/mediacms/logs/debug.log

# Create runtime directory for PID files (use /tmp for better compatibility)
mkdir -p /tmp/mediacms

exec "$@"
