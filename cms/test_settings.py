import os
import shutil
import tempfile

os.environ.setdefault("TESTING", "True")

from .settings import *  # noqa: E402,F401,F403
from .settings import BASE_DIR, DATABASES, MIDDLEWARE  # noqa: E402

CELERY_TASK_ALWAYS_EAGER = True

# Deployment local_settings may force HTTPS redirects, LTI, and identity-provider URLs.
# Tests keep the repository defaults so the client can call http://testserver and
# feature-flag tests start from a known-off baseline (override_settings turns flags on).
# Reset LTI side effects that settings.py applies when local_settings sets USE_LTI=True
# before test_settings can turn the flag back off.
SECURE_SSL_REDIRECT = False
USE_IDENTITY_PROVIDERS = False
USE_LTI = False
USE_RBAC = False
USE_SAML = False
RELATED_MEDIA_STRATEGY = "content"
SHOW_LMS_COURSES_IN_CATEGORIES = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = False
USERS_NEEDS_TO_BE_APPROVED = False
# local_settings may have swapped AUTHENTICATION_BACKENDS / MIDDLEWARE when
# USERS_NEEDS_TO_BE_APPROVED was True at import time; restore repository defaults.
AUTHENTICATION_BACKENDS = (
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
)
MIDDLEWARE = [mw for mw in MIDDLEWARE if mw != "cms.middleware.ApprovalMiddleware"]
PORTAL_NAME = "MediaCMS"
MEDIA_IS_REVIEWED = True

# Tests may invoke populate_fake_media helpers; allow the command under test settings.
ALLOW_POPULATE_FAKE_MEDIA = True

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache", "LOCATION": "mediacms-tests"}}

MEDIA_ROOT = tempfile.mkdtemp(prefix="mediacms-tests-") + "/"
HLS_DIR = os.path.join(MEDIA_ROOT, "hls/")
os.makedirs(HLS_DIR, exist_ok=True)
shutil.copytree(os.path.join(BASE_DIR, "media_files", "userlogos"), os.path.join(MEDIA_ROOT, "userlogos"))

DATABASES["default"].pop("OPTIONS", None)
DATABASES["default"]["TEST"] = {"NAME": "test_mediacms" + os.environ.get("TEST_DB_SUFFIX", "")}

FFMPEG_DEFAULT_PRESET = "ultrafast"
