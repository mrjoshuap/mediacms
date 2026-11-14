"""Catalog of expected product features that are stubbed or not implemented yet."""

from tests._support.unimplemented import unimplemented


@unimplemented(
    "RELATED_MEDIA_STRATEGY=calculated should return ranked related media "
    "(today show_related_media returns an empty list for that strategy)"
)
def test_calculated_related_media_strategy():
    pass


@unimplemented(
    "Selenium remote smoke against selenium_hub should visit /admin and assert the login title "
    "(tests/test_selenium_smoke.py was fully commented out; default CI has no selenium hub)"
)
def test_selenium_remote_admin_smoke():
    pass


@unimplemented(
    "API POST /api/v1/media should reject uploads larger than UPLOAD_MAX_SIZE "
    "(today only files.forms.ReplaceMediaForm enforces UPLOAD_MAX_SIZE; API and Fine Uploader do not)"
)
def test_api_upload_respects_upload_max_size():
    pass
