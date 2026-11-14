"""Minimal settings for exporting the OpenAPI schema without PostgreSQL."""

from cms.settings import *  # noqa: F401,F403

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

CELERY_TASK_ALWAYS_EAGER = True
ALLOWED_HOSTS = ["*"]
DEBUG = False
