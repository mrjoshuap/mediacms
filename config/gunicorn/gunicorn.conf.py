"""Gunicorn configuration file for MediaCMS."""
import multiprocessing
import os

# Server socket
# Can be overridden via GUNICORN_BIND environment variable
bind = os.environ.get("GUNICORN_BIND", "0.0.0.0:8000")
backlog = 2048

# Worker processes
workers = int(os.environ.get("GUNICORN_WORKERS", multiprocessing.cpu_count() * 2 + 1))
worker_class = "sync"
worker_connections = 1000

# Timeouts for large file uploads and long-running requests
# timeout: Workers silent for more than this many seconds are killed and restarted
timeout = int(os.environ.get("GUNICORN_TIMEOUT", 7200))  # 2 hours default for large uploads
# graceful_timeout: Timeout for graceful workers restart
graceful_timeout = int(os.environ.get("GUNICORN_GRACEFUL_TIMEOUT", 300))  # 5 minutes
keepalive = 5

# Request limits
limit_request_line = 8190  # Maximum size of HTTP request line
limit_request_fields = 32768  # Maximum number of request header fields
limit_request_field_size = 8190  # Maximum allowed size for a single request header field

# Logging
accesslog = "-"
errorlog = "-"
loglevel = os.environ.get("GUNICORN_LOG_LEVEL", "info")
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "mediacms"

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# SSL (if needed)
keyfile = None
certfile = None

# Graceful timeout
graceful_timeout = 30
