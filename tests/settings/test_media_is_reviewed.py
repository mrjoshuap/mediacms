"""End-to-end MEDIA_IS_REVIEWED=False portal review gate."""

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from files.models import Media
from files.tests import create_account, create_media

MEDIA_LIST_URL = "/api/v1/media"


@override_settings(MEDIA_IS_REVIEWED=False)
class MediaIsReviewedGateTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.owner = create_account()
        cls.editor = create_account(is_editor=True)
        cls.stranger = create_account()

    def detail_url(self, media):
        return f"/api/v1/media/{media.friendly_token}"

    def test_new_public_media_is_unreviewed_and_not_listable(self):
        media = create_media(self.owner, title="pending review gate", state="public")
        self.assertFalse(media.is_reviewed)
        self.assertFalse(media.listable)

        listing = APIClient().get(MEDIA_LIST_URL)
        self.assertEqual(listing.status_code, 200)
        titles = [item["title"] for item in listing.data["results"]]
        self.assertNotIn("pending review gate", titles)

    def test_editor_review_makes_media_listable_for_anonymous(self):
        media = create_media(self.owner, title="awaiting editor", state="public", encoding_status="success")
        self.assertFalse(media.listable)

        editor = APIClient()
        editor.force_authenticate(self.editor)
        response = editor.post(self.detail_url(media), {"type": "review", "result": "true"}, format="multipart")
        self.assertEqual(response.status_code, 201)

        media.refresh_from_db()
        self.assertTrue(media.is_reviewed)
        self.assertTrue(media.listable)

        listing = APIClient().get(MEDIA_LIST_URL)
        self.assertIn("awaiting editor", [item["title"] for item in listing.data["results"]])

    def test_multipart_false_unreviews_and_removes_from_listings(self):
        media = create_media(
            self.owner,
            title="was public reviewed",
            state="public",
            encoding_status="success",
            is_reviewed=True,
        )
        self.assertTrue(media.listable)

        editor = APIClient()
        editor.force_authenticate(self.editor)
        response = editor.post(self.detail_url(media), {"type": "review", "result": "false"}, format="multipart")
        self.assertEqual(response.status_code, 201)

        media.refresh_from_db()
        self.assertFalse(media.is_reviewed)
        self.assertFalse(media.listable)
        self.assertNotIn("was public reviewed", [item["title"] for item in APIClient().get(MEDIA_LIST_URL).data["results"]])

    def test_owner_cannot_self_review_when_not_an_editor(self):
        media = create_media(self.owner, title="owner cannot review", state="public", is_reviewed=False)
        client = APIClient()
        client.force_authenticate(self.owner)
        response = client.post(self.detail_url(media), {"type": "review", "result": "true"}, format="multipart")
        self.assertEqual(response.status_code, 400)
        media.refresh_from_db()
        self.assertFalse(media.is_reviewed)
        self.assertFalse(Media.objects.get(pk=media.pk).listable)
