from django.core.cache import cache
from django.core.files import File
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from files.methods import set_media_password, verify_media_password
from files.models import Media
from files.tests import create_account

MEDIA_AUTH_URL = "/api/v1/media-auth"


class MediaPasswordHelpersTest(TestCase):
    def setUp(self):
        self.owner = create_account()
        with open("fixtures/test_image.png", "rb") as fp:
            self.media = Media.objects.create(title="pw helpers", user=self.owner, media_file=File(fp), state="unlisted")

    def test_password_is_hashed_and_verified(self):
        set_media_password(self.media, "correct-horse")
        self.media.save()
        self.media.refresh_from_db()
        self.assertTrue(self.media.password)
        self.assertNotEqual(self.media.password, "correct-horse")
        self.assertTrue(verify_media_password(self.media, "correct-horse"))
        self.assertFalse(verify_media_password(self.media, "wrong"))

    def test_legacy_plaintext_password_still_verifies(self):
        self.media.password = "legacy-secret"
        self.media.save(update_fields=["password"])
        self.assertTrue(verify_media_password(self.media, "legacy-secret"))
        self.assertFalse(verify_media_password(self.media, "nope"))


class MediaPasswordApiTest(TestCase):
    def setUp(self):
        cache.clear()
        self.owner = create_account()
        self.other = create_account()
        with open("fixtures/test_image.png", "rb") as fp:
            self.media = Media.objects.create(title="locked unlisted", user=self.owner, media_file=File(fp), state="unlisted")
        set_media_password(self.media, "s3cret")
        self.media.save()
        cache.clear()

    def detail(self, client=None):
        client = client or APIClient()
        return client.get(f"/api/v1/media/{self.media.friendly_token}")

    def unlock(self, password, client=None):
        client = client or APIClient()
        return client.post(f"/api/v1/media/{self.media.friendly_token}/unlock", {"password": password}, format="json")

    def test_detail_requires_password_for_anonymous(self):
        response = self.detail()
        self.assertEqual(response.status_code, 403)
        self.assertTrue(response.data["password_required"])
        self.assertEqual(response.data["title"], "locked unlisted")
        self.assertNotIn("encodings_info", response.data)
        self.assertNotIn("hls_info", response.data)

    def test_owner_bypasses_password(self):
        client = APIClient()
        client.force_authenticate(self.owner)
        response = self.detail(client)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["title"], "locked unlisted")

    def test_unlock_then_detail_succeeds_for_same_session(self):
        client = APIClient()
        bad = self.unlock("wrong", client)
        self.assertEqual(bad.status_code, 403)

        ok = self.unlock("s3cret", client)
        self.assertEqual(ok.status_code, 200)

        response = self.detail(client)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["title"], "locked unlisted")
        self.assertNotIn("password_required", response.data)

    def test_other_session_still_locked_after_unlock(self):
        unlocked = APIClient()
        self.assertEqual(self.unlock("s3cret", unlocked).status_code, 200)
        self.assertEqual(self.detail(unlocked).status_code, 200)
        self.assertEqual(self.detail(APIClient()).status_code, 403)


class MediaPasswordAuthTest(TestCase):
    def setUp(self):
        cache.clear()
        self.owner = create_account()
        with open("fixtures/test_image.png", "rb") as fp:
            self.media = Media.objects.create(title="locked file", user=self.owner, media_file=File(fp), state="unlisted")
        set_media_password(self.media, "s3cret")
        self.media.save()
        cache.clear()

    def _auth(self, client):
        uri = f"/media/encoded/{self.media.uid.hex}/{self.media.uid.hex}.mp4"
        return client.get(MEDIA_AUTH_URL, HTTP_X_ORIGINAL_URI=uri)

    def test_file_access_denied_until_unlocked(self):
        client = APIClient()
        self.assertEqual(self._auth(client).status_code, 403)

        unlock = client.post(
            f"/api/v1/media/{self.media.friendly_token}/unlock",
            {"password": "s3cret"},
            format="json",
        )
        self.assertEqual(unlock.status_code, 200)
        self.assertEqual(self._auth(client).status_code, 204)

    def test_owner_can_fetch_files_without_unlock(self):
        client = APIClient()
        client.force_authenticate(self.owner)
        # media_auth uses request.user from the Django session/auth, so log in as well
        client.force_login(self.owner)
        self.assertEqual(self._auth(client).status_code, 204)


@override_settings(USE_X_ACCEL_REDIRECT=True, DEVELOPMENT_MODE=True)
class MediaPasswordPdfTest(TestCase):
    def setUp(self):
        cache.clear()
        self.owner = create_account()
        with open("fixtures/test_image.png", "rb") as fp:
            self.media = Media.objects.create(title="locked pdf", user=self.owner, media_file=File(fp), state="unlisted")
        set_media_password(self.media, "s3cret")
        self.media.save()
        Media.objects.filter(pk=self.media.pk).update(media_type="pdf", state="unlisted")
        self.media.refresh_from_db()
        cache.clear()
        self.url = f"/api/v1/media/{self.media.friendly_token}/pdf"

    def test_pdf_requires_unlock(self):
        client = APIClient()
        self.assertEqual(client.get(self.url).status_code, 403)
        unlock = client.post(
            f"/api/v1/media/{self.media.friendly_token}/unlock",
            {"password": "s3cret"},
            format="json",
        )
        self.assertEqual(unlock.status_code, 200)
        response = client.get(self.url)
        self.assertEqual(response.status_code, 200)
        list(response.streaming_content)
