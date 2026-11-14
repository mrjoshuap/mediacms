"""Primary media application states and common failure conditions on pages/API."""

from django.contrib.messages import get_messages
from django.test import Client, TestCase, override_settings
from rest_framework.test import APIClient

from files.methods import set_media_password
from files.models import Media
from files.tests import create_account, create_media
from files.tests.media_utils import SMALL_VIDEO


def message_texts(response):
    return [str(message) for message in get_messages(response.wsgi_request)]

MEDIA_LIST_URL = "/api/v1/media"


def listing_titles():
    response = APIClient().get(MEDIA_LIST_URL)
    assert response.status_code == 200
    return {item["title"] for item in response.data["results"]}


class MediaWorkflowStatePagesTest(TestCase):
    fixtures = ["fixtures/encoding_profiles.json"]

    @classmethod
    def setUpTestData(cls):
        cls.owner = create_account()
        cls.stranger = create_account()
        cls.public = create_media(cls.owner, title="workflow public", state="public", encoding_status="success")
        cls.unlisted = create_media(cls.owner, title="workflow unlisted", state="unlisted", encoding_status="success")
        cls.private = create_media(cls.owner, title="workflow private", state="private", encoding_status="success")
        cls.unreviewed = create_media(
            cls.owner,
            title="workflow unreviewed",
            state="public",
            encoding_status="success",
            is_reviewed=False,
        )
        cls.pending = create_media(
            cls.owner,
            filename=SMALL_VIDEO,
            title="workflow pending",
            state="public",
            encoding_status="pending",
        )
        cls.failed = create_media(
            cls.owner,
            filename=SMALL_VIDEO,
            title="workflow failed",
            state="public",
            encoding_status="fail",
        )
        cls.passworded = create_media(cls.owner, title="workflow password", state="unlisted", encoding_status="success")
        set_media_password(cls.passworded, "gate-key")
        cls.passworded.save(update_fields=["password"])

    def media_page(self, media, user=None):
        client = Client()
        if user is not None:
            client.force_login(user)
        return client.get(f"/view?m={media.friendly_token}")

    def test_public_listable_media_page_renders_for_anonymous(self):
        response = self.media_page(self.public)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "workflow public")

    def test_unlisted_media_page_is_reachable_by_link(self):
        response = self.media_page(self.unlisted)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "workflow unlisted")

    def test_private_media_hides_metadata_from_strangers(self):
        response = self.media_page(self.private, self.stranger)
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "workflow private")

    def test_unreviewed_and_non_public_media_are_absent_from_public_listings(self):
        titles = listing_titles()
        self.assertIn("workflow public", titles)
        self.assertNotIn("workflow unreviewed", titles)
        self.assertNotIn("workflow unlisted", titles)
        self.assertNotIn("workflow private", titles)

    def test_owner_sees_encoding_pending_status_on_media_page(self):
        response = self.media_page(self.pending, self.owner)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["media_object"].encoding_status, "pending")
        self.assertTrue(any("hasn't started yet" in text for text in message_texts(response)))

    def test_failed_encoding_is_not_listable(self):
        self.failed.refresh_from_db()
        self.assertEqual(self.failed.encoding_status, "fail")
        self.assertFalse(self.failed.listable)
        self.assertNotIn("workflow failed", listing_titles())

    def test_password_protected_detail_requires_unlock(self):
        client = APIClient()
        response = client.get(f"/api/v1/media/{self.passworded.friendly_token}")
        self.assertEqual(response.status_code, 403)
        self.assertTrue(response.data.get("password_required"))

        bad = client.post(f"/api/v1/media/{self.passworded.friendly_token}/unlock", {"password": "wrong"}, format="json")
        self.assertEqual(bad.status_code, 403)

        ok = client.post(f"/api/v1/media/{self.passworded.friendly_token}/unlock", {"password": "gate-key"}, format="json")
        self.assertEqual(ok.status_code, 200)
        unlocked = client.get(f"/api/v1/media/{self.passworded.friendly_token}")
        self.assertEqual(unlocked.status_code, 200)
        self.assertEqual(unlocked.data["title"], "workflow password")


class MediaWorkflowFailureConditionsTest(TestCase):
    def test_anonymous_cannot_upload_via_api(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        from files.tests import fixture_path

        with open(fixture_path("test_image.png"), "rb") as fp:
            payload = SimpleUploadedFile("x.png", fp.read(), content_type="image/png")
        response = APIClient().post("/api/v1/media", {"media_file": payload, "title": "nope"}, format="multipart")
        self.assertIn(response.status_code, (401, 403))

    def test_unknown_media_detail_is_rejected(self):
        response = APIClient().get("/api/v1/media/does-not-exist-token")
        self.assertIn(response.status_code, (400, 404))

    @override_settings(NUMBER_OF_MEDIA_USER_CAN_UPLOAD=0)
    def test_upload_quota_zero_blocks_regular_users(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        from files.tests import fixture_path

        user = create_account()
        client = APIClient()
        client.force_authenticate(user)
        with open(fixture_path("test_image.png"), "rb") as fp:
            payload = SimpleUploadedFile("x.png", fp.read(), content_type="image/png")
        response = client.post("/api/v1/media", {"media_file": payload, "title": "quota"}, format="multipart")
        self.assertEqual(response.status_code, 403)
