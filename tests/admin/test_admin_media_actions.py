"""MediaAdmin bulk actions that lacked dedicated coverage."""

from unittest.mock import patch

from django.contrib import admin
from django.test import TestCase
from django.urls import reverse

from actions.models import MediaAction
from files.models import Media
from files.tests import create_account, create_media
from files.tests.media_utils import SMALL_VIDEO

PASSWORD = "admin-media-actions-password"


def make_user(username, **kwargs):
    return create_account(username=username, email=f"{username}@example.com", password=PASSWORD, **kwargs)


class MediaAdminMissingActionsTest(TestCase):
    fixtures = ["fixtures/encoding_profiles.json"]

    @classmethod
    def setUpTestData(cls):
        cls.superuser = make_user("media_actions_root", is_superuser=True)
        cls.regular = make_user("media_actions_user")
        cls.image = create_media(cls.superuser, title="actions image", state="public")
        cls.video = create_media(cls.superuser, filename=SMALL_VIDEO, title="actions video", state="public")

    def setUp(self):
        self.client.force_login(self.superuser)

    def post_action(self, action, *media):
        return self.client.post(
            reverse("admin:files_media_changelist"),
            {"action": action, "_selected_action": [m.pk for m in media]},
        )

    def test_mark_as_unreviewed_action(self):
        self.image.is_reviewed = True
        self.image.save(update_fields=["is_reviewed"])
        response = self.post_action("mark_as_unreviewed", self.image)
        self.assertEqual(response.status_code, 302)
        self.image.refresh_from_db()
        self.assertFalse(self.image.is_reviewed)
        self.assertTrue(MediaAction.objects.filter(media=self.image, action="media_unreviewed", user=self.superuser).exists())

    def test_enable_and_disable_comments_actions(self):
        Media.objects.filter(pk=self.image.pk).update(enable_comments=True)
        self.assertEqual(self.post_action("disable_comments", self.image).status_code, 302)
        self.image.refresh_from_db()
        self.assertFalse(self.image.enable_comments)

        self.assertEqual(self.post_action("enable_comments", self.image).status_code, 302)
        self.image.refresh_from_db()
        self.assertTrue(self.image.enable_comments)

    def test_feature_and_unfeature_actions(self):
        Media.objects.filter(pk=self.image.pk).update(featured=False)
        self.assertEqual(self.post_action("feature_selected", self.image).status_code, 302)
        self.image.refresh_from_db()
        self.assertTrue(self.image.featured)

        self.assertEqual(self.post_action("unfeature_selected", self.image).status_code, 302)
        self.image.refresh_from_db()
        self.assertFalse(self.image.featured)

    def test_regenerate_thumbnails_calls_set_thumbnail(self):
        with patch.object(Media, "set_thumbnail") as set_thumbnail:
            response = self.post_action("regenerate_thumbnails", self.image, self.video)
        self.assertEqual(response.status_code, 302)
        self.assertEqual(set_thumbnail.call_count, 2)
        for call in set_thumbnail.call_args_list:
            self.assertTrue(call.kwargs.get("force"))

    def test_regenerate_sprites_queues_only_for_video(self):
        with patch.object(Media, "produce_sprite_from_video") as produce_sprite:
            response = self.post_action("regenerate_sprites", self.image, self.video)
        self.assertEqual(response.status_code, 302)
        produce_sprite.assert_called_once()

    def test_regenerate_preview_queues_preview_encode_for_video(self):
        model_admin = admin.site._registry[Media]
        with patch.object(model_admin, "_queue_preview_encode", return_value=True) as queue_preview:
            response = self.post_action("regenerate_preview", self.image, self.video)
        self.assertEqual(response.status_code, 302)
        queue_preview.assert_called_once()
        self.assertEqual(queue_preview.call_args.args[0].pk, self.video.pk)

    def test_refresh_derivatives_refreshes_video_assets(self):
        model_admin = admin.site._registry[Media]
        with (
            patch.object(Media, "set_thumbnail") as set_thumbnail,
            patch.object(Media, "produce_sprite_from_video") as produce_sprite,
            patch.object(model_admin, "_queue_preview_encode", return_value=True) as queue_preview,
            patch("files.tasks.create_hls.delay") as create_hls,
        ):
            response = self.post_action("refresh_derivatives", self.image, self.video)
        self.assertEqual(response.status_code, 302)
        self.assertEqual(set_thumbnail.call_count, 2)
        produce_sprite.assert_called_once()
        queue_preview.assert_called_once()
        create_hls.assert_called_once_with(self.video.friendly_token)

    def test_actions_require_change_permission(self):
        model_admin = admin.site._registry[Media]
        from django.test import RequestFactory

        request = RequestFactory().get("/admin/")
        request.user = self.regular
        actions = model_admin.get_actions(request)
        for name in (
            "regenerate_thumbnails",
            "regenerate_sprites",
            "regenerate_preview",
            "refresh_derivatives",
            "mark_as_unreviewed",
            "enable_comments",
            "disable_comments",
            "feature_selected",
            "unfeature_selected",
        ):
            self.assertNotIn(name, actions)
