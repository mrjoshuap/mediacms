"""Stream a dated Django fixture of the database, leaving out operational rows."""

import json
import zlib

from django.apps import apps
from django.core import serializers
from django.utils import timezone

from actions.models import ENGAGEMENT_MEDIA_ACTIONS, EXPORTED_MEDIA_ACTIONS

# Job queues, sessions, and logs. Content such as finished captions stays.
EXCLUDED_MODELS = frozenset(
    {
        ("sessions", "session"),
        ("admin", "logentry"),
        ("users", "notification"),
        ("identity_providers", "identityprovideruserlog"),
        ("lti", "ltilaunchlog"),
        ("files", "videotrimrequest"),
        ("files", "transcriptionrequest"),
    }
)
NOISY_STATUS_MODELS = frozenset(
    {
        ("files", "videotrimrequest"),
        ("files", "transcriptionrequest"),
    }
)
MANIFEST_VERSION = 1


class BackupProfile:
    """Which optional rows a backup includes. The default is the quiet set."""

    def __init__(self, include_engagement=False, include_noisy_status=False):
        self.include_engagement = bool(include_engagement)
        self.include_noisy_status = bool(include_noisy_status)

    def manifest(self):
        return {
            "version": MANIFEST_VERSION,
            "include_engagement": self.include_engagement,
            "include_noisy_status": self.include_noisy_status,
        }

    def media_actions(self):
        actions = list(EXPORTED_MEDIA_ACTIONS)
        if self.include_engagement:
            actions.extend(ENGAGEMENT_MEDIA_ACTIONS)
        return tuple(actions)

    def excluded_models(self):
        excluded = set(EXCLUDED_MODELS)
        if self.include_noisy_status:
            excluded -= NOISY_STATUS_MODELS
        return frozenset(excluded)


def default_backup_profile():
    return BackupProfile()


def manifest_profile(manifest):
    """A profile from a backup manifest. Missing flags mean the quiet set."""
    if not isinstance(manifest, dict):
        raise ValueError("manifest")
    return BackupProfile(
        include_engagement=bool(manifest.get("include_engagement")),
        include_noisy_status=bool(manifest.get("include_noisy_status")),
    )


def database_backup_filename(when=None):
    """Local date and time, for example mediacms-database-backup-2026-11-13-1325.json.gz."""
    moment = timezone.localtime(when or timezone.now())
    return moment.strftime("mediacms-database-backup-%Y-%m-%d-%H%M.json.gz")


def split_backup_document(payload):
    """Return (profile, objects) for a wrapped backup or a legacy fixture list."""
    if isinstance(payload, list):
        return default_backup_profile(), payload
    if isinstance(payload, dict) and isinstance(payload.get("objects"), list) and isinstance(payload.get("manifest"), dict):
        return manifest_profile(payload["manifest"]), payload["objects"]
    raise ValueError("backup")


def _models_in_order(profile):
    excluded = profile.excluded_models()
    app_list = []
    for app_config in apps.get_app_configs():
        models = []
        for model in app_config.get_models():
            if model._meta.proxy or not model._meta.managed:
                continue
            if (model._meta.app_label, model._meta.model_name) in excluded:
                continue
            models.append(model)
        if models:
            app_list.append((app_config, models))
    return serializers.sort_dependencies(app_list)


def _queryset_for(model, profile):
    queryset = model._default_manager.order_by(model._meta.pk.name)
    label = (model._meta.app_label, model._meta.model_name)
    if label == ("actions", "mediaaction"):
        return queryset.filter(action__in=profile.media_actions())
    if label == ("files", "encoding") and not profile.include_noisy_status:
        return queryset.exclude(status="fail")
    return queryset


def _object_json(instance):
    raw = serializers.serialize("json", [instance])
    start = raw.find("{")
    end = raw.rfind("}")
    if start < 0 or end < start:
        return b""
    return raw[start : end + 1].encode("utf-8")


def _fixture_bytes(profile):
    manifest = json.dumps(profile.manifest(), separators=(",", ":")).encode("utf-8")
    yield b'{"manifest":' + manifest + b',"objects":['
    first = True
    for model in _models_in_order(profile):
        for instance in _queryset_for(model, profile).iterator(chunk_size=500):
            piece = _object_json(instance)
            if not piece:
                continue
            if first:
                first = False
                yield piece
            else:
                yield b"," + piece
    yield b"]}"


def iter_database_backup(profile=None):
    """Yield gzip chunks of a JSON document with a manifest and fixture objects."""
    profile = profile or default_backup_profile()
    compressor = zlib.compressobj(wbits=16 + zlib.MAX_WBITS)
    for chunk in _fixture_bytes(profile):
        compressed = compressor.compress(chunk)
        if compressed:
            yield compressed
    tail = compressor.flush()
    if tail:
        yield tail
