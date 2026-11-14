"""GET /api/v1/media/{token}/playlists — MediaPlaylistMembership for the Save popup."""

from django.test import TestCase
from rest_framework.test import APIClient

from files.models import Playlist, PlaylistMedia
from files.tests import create_account, create_media


def membership_url(media):
    return f"/api/v1/media/{media.friendly_token}/playlists"


class MediaPlaylistMembershipTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.owner = create_account()
        cls.other = create_account()
        cls.media = create_media(cls.owner, title="membership media", state="public")
        cls.other_media = create_media(cls.other, title="other media", state="public")
        cls.owner_with = Playlist.objects.create(title="owner has media", user=cls.owner)
        cls.owner_empty = Playlist.objects.create(title="owner empty", user=cls.owner)
        cls.other_playlist = Playlist.objects.create(title="other playlist", user=cls.other)
        PlaylistMedia.objects.create(playlist=cls.owner_with, media=cls.media, ordering=1)
        PlaylistMedia.objects.create(playlist=cls.other_playlist, media=cls.media, ordering=1)

    def client_for(self, user=None):
        client = APIClient()
        if user is not None:
            client.force_authenticate(user)
        return client

    def test_anonymous_is_rejected(self):
        self.assertIn(self.client_for().get(membership_url(self.media)).status_code, (401, 403))

    def test_owner_sees_only_own_playlists_that_contain_the_media(self):
        response = self.client_for(self.owner).get(membership_url(self.media))
        self.assertEqual(response.status_code, 200)
        tokens = {row["friendly_token"] for row in response.data["results"]}
        self.assertEqual(tokens, {self.owner_with.friendly_token})
        self.assertNotIn(self.owner_empty.friendly_token, tokens)
        self.assertNotIn(self.other_playlist.friendly_token, tokens)

    def test_other_user_does_not_see_owner_playlists_even_when_they_contain_the_media(self):
        response = self.client_for(self.other).get(membership_url(self.media))
        self.assertEqual(response.status_code, 200)
        tokens = {row["friendly_token"] for row in response.data["results"]}
        self.assertEqual(tokens, {self.other_playlist.friendly_token})

    def test_empty_results_when_media_is_in_no_playlists_of_the_caller(self):
        response = self.client_for(self.owner).get(membership_url(self.other_media))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"], [])

    def test_unknown_media_returns_404(self):
        self.assertEqual(self.client_for(self.owner).get("/api/v1/media/doesnotexist/playlists").status_code, 404)
