#!/bin/bash
set -euo pipefail

# Determine the base directory (assumes script is in deploy/openshift/scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
PRE_START_PATH="$BASE_DIR/deploy/openshift/scripts/prestart.sh"

# Run prestart script if it exists (handles migrations, static files, config validation)
if [ -f "$PRE_START_PATH" ]; then
    echo "Running prestart script: $PRE_START_PATH"
    /bin/bash "$PRE_START_PATH"
else
    echo "WARNING: Prestart script not found at $PRE_START_PATH" >&2
    echo "Skipping prestart tasks (migrations, static files, etc.)" >&2
fi

# Run the appropriate service based on environment variables
# Kubernetes manages the process lifecycle - we just start the service directly

if [ "${ENABLE_NGINX:-no}" = "yes" ]; then
    echo "Starting nginx..."
    # Verify config file exists and contains our temp path settings
    if ! grep -q "client_body_temp_path /tmp/nginx/body" /etc/nginx/nginx.conf; then
        echo "WARNING: nginx.conf does not contain expected temp path settings" >&2
        echo "Config file may not be updated. Current config:" >&2
        head -30 /etc/nginx/nginx.conf >&2 || true
    fi
    # Ensure temp directories exist (in case config hasn't been updated yet)
    mkdir -p /tmp/nginx/{body,proxy,fastcgi,uwsgi,scgi}
    # Test nginx configuration first
    if ! /usr/sbin/nginx -t -c /etc/nginx/nginx.conf 2>&1; then
        echo "ERROR: nginx configuration test failed" >&2
        exit 1
    fi
    # Start nginx with explicit config file path
    exec /usr/sbin/nginx -c /etc/nginx/nginx.conf -g 'daemon off;'
elif [ "${ENABLE_UWSGI:-no}" = "yes" ]; then
    echo "Starting uwsgi..."
    exec /home/mediacms.io/bin/uwsgi --ini /etc/uwsgi/uwsgi.ini
elif [ "${ENABLE_CELERY_BEAT:-no}" = "yes" ]; then
    echo "Starting celery beat..."
    cd /home/mediacms.io/mediacms
    exec /home/mediacms.io/bin/celery beat \
        --pidfile=/tmp/mediacms/beat.pid \
        --schedule=/tmp/mediacms/celerybeat-schedule \
        --loglevel="${CELERY_LOG_LEVEL:-INFO}"
elif [ "${ENABLE_CELERY_SHORT:-no}" = "yes" ]; then
    echo "Starting celery short worker..."
    cd /home/mediacms.io/mediacms
    # Use celery worker directly (Kubernetes handles scaling via replicas)
    # Each container runs one worker; scale deployment for multiple workers
    exec /home/mediacms.io/bin/celery worker \
        --pidfile=/tmp/mediacms/worker.pid \
        --loglevel="${CELERY_LOG_LEVEL:-INFO}" \
        --soft-time-limit="${CELERY_SHORT_SOFT_TIME_LIMIT:-300}" \
        --time-limit="${CELERY_SHORT_HARD_TIME_LIMIT:-360}" \
        --prefetch-multiplier="${CELERY_SHORT_PREFETCH_MULTIPLIER:-4}" \
        --max-tasks-per-child="${CELERY_SHORT_MAX_TASKS_PER_CHILD:-100}" \
        -c "${CELERY_SHORT_CONCURRENCY:-4}" \
        -Q "short_tasks" \
        -n "short@%h"
elif [ "${ENABLE_CELERY_LONG:-no}" = "yes" ]; then
    echo "Starting celery long worker..."
    cd /home/mediacms.io/mediacms
    # Use celery worker directly (Kubernetes handles scaling via replicas)
    exec /home/mediacms.io/bin/celery worker \
        --pidfile=/tmp/mediacms/worker.pid \
        --loglevel="${CELERY_LOG_LEVEL:-INFO}" \
        -Ofair \
        --prefetch-multiplier="${CELERY_LONG_PREFETCH_MULTIPLIER:-1}" \
        --max-tasks-per-child="${CELERY_LONG_MAX_TASKS_PER_CHILD:-20}" \
        --soft-time-limit="${CELERY_LONG_SOFT_TIME_LIMIT:-3600}" \
        --time-limit="${CELERY_LONG_HARD_TIME_LIMIT:-5400}" \
        -c "${CELERY_LONG_CONCURRENCY:-1}" \
        -Q "long_tasks" \
        -n "long@%h"
else
    echo "ERROR: No service enabled. Set one of ENABLE_NGINX, ENABLE_UWSGI, ENABLE_CELERY_BEAT, ENABLE_CELERY_SHORT, or ENABLE_CELERY_LONG to 'yes'" >&2
    exit 1
fi
