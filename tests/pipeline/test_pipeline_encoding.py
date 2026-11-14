import contextlib
import json
import os
import time
from datetime import timedelta
from unittest import mock

import m3u8
import pytest
from celery.exceptions import Retry
from django.conf import settings
from django.core.cache import cache
from django.core.files.base import ContentFile
from django.db import transaction
from django.db.models.signals import post_save
from django.test import TestCase, override_settings
from django.utils import timezone

from files import helpers, tasks
from files.models import (
    EncodeProfile,
    Encoding,
    Media,
    VideoChapterData,
    VideoTrimRequest,
)
from files.tests import create_account, create_media
from files.tests.media_utils import IMAGE, SMALL_VIDEO
from tests._support.bento import mp4hls_is_usable

FIXTURES = ["fixtures/categories.json", "fixtures/encoding_profiles.json"]


def profile(name):
    return EncodeProfile.objects.get(name=name, extension="mp4")


def attach_file(encoding, content=b"x" * 2048, name="rendition.mp4"):
    encoding.media_file.save(name, ContentFile(content), save=False)
    return encoding


class PreviewPositionsTest(TestCase):
    def test_a_long_video_gets_clips_spread_across_its_length(self):
        self.assertEqual(tasks.preview_positions(100), [8.0, 23.0, 38.0, 53.0, 68.0, 83.0])

    def test_a_video_too_short_for_distinct_clips_gets_one_from_the_start(self):
        self.assertEqual(tasks.preview_positions(5), [0])

    def test_a_video_of_unknown_duration_gets_one_clip_from_the_start(self):
        self.assertEqual(tasks.preview_positions(0), [0])
        self.assertEqual(tasks.preview_positions(None), [0])


class MediaEncodeDecisionTest(TestCase):
    fixtures = FIXTURES

    @classmethod
    def setUpTestData(cls):
        cls.user = create_account()
        cls.video = create_media(cls.user, SMALL_VIDEO)

    def test_a_short_video_gets_one_encoding_per_fitting_profile(self):
        with mock.patch.object(tasks.encode_media, "apply_async") as apply_async, mock.patch.object(tasks.chunkize_media, "delay") as chunkize:
            self.video.encode()

        chunkize.assert_not_called()
        names = sorted(self.video.encodings.values_list("profile__name", flat=True))
        self.assertEqual(names, ["h264-144", "h264-240", "preview"])
        self.assertTrue(all(encoding.status == "pending" for encoding in self.video.encodings.all()))
        queued = {call.kwargs["args"][2]: call.kwargs["priority"] for call in apply_async.call_args_list}
        self.assertEqual(set(queued), set(self.video.encodings.values_list("id", flat=True)))
        self.assertEqual(queued[self.video.encodings.get(profile__name="h264-144").id], 9)
        self.assertEqual(queued[self.video.encodings.get(profile__name="preview").id], 0)

    def test_minimum_resolutions_are_encoded_even_above_the_source_height(self):
        Media.objects.filter(pk=self.video.pk).update(video_height=100)
        self.video.refresh_from_db()

        with mock.patch.object(tasks.encode_media, "apply_async"):
            self.video.encode(profiles=EncodeProfile.objects.filter(name__in=["h264-144", "h264-240", "h264-360"]))

        self.assertEqual(sorted(self.video.encodings.values_list("profile__name", flat=True)), ["h264-144", "h264-240"])

    @override_settings(CHUNKIZE_VIDEO_DURATION=10)
    def test_a_long_video_is_sent_to_chunkize_while_the_preview_encodes_whole(self):
        with mock.patch.object(tasks.encode_media, "apply_async") as apply_async, mock.patch.object(tasks.chunkize_media, "delay") as chunkize:
            self.video.encode()

        preview = self.video.encodings.get()
        self.assertEqual(preview.profile.name, "preview")
        self.assertEqual(apply_async.call_args.kwargs["args"], [self.video.friendly_token, preview.profile.id, preview.id])

        chunkize.assert_called_once()
        token, profile_ids = chunkize.call_args.args
        self.assertEqual(token, self.video.friendly_token)
        expected = set(EncodeProfile.objects.filter(active=True).exclude(name="preview").values_list("id", flat=True))
        self.assertEqual(set(profile_ids), expected)

    @override_settings(CHUNKIZE_VIDEO_DURATION=10)
    def test_chunkize_false_encodes_a_long_video_whole(self):
        with mock.patch.object(tasks.encode_media, "apply_async"), mock.patch.object(tasks.chunkize_media, "delay") as chunkize:
            self.video.encode(profiles=[profile("h264-144")], chunkize=False)

        chunkize.assert_not_called()
        self.assertEqual(list(self.video.encodings.values_list("profile__name", flat=True)), ["h264-144"])

    def test_chunkize_falls_back_to_whole_file_encodes_when_segmenting_fails(self):
        ids = [profile("h264-144").id, profile("h264-720").id]

        with mock.patch.object(tasks, "run_command", return_value={"error": "segmenting failed"}), mock.patch.object(tasks.encode_media, "delay") as delay:
            result = tasks.chunkize_media(self.video.friendly_token, ids)

        self.assertFalse(result)
        encoding = self.video.encodings.get()
        self.assertEqual(encoding.profile.name, "h264-144")
        self.assertFalse(encoding.chunk)
        delay.assert_called_once_with(self.video.friendly_token, encoding.profile.id, encoding.id, force=True)


class EncodingStatusTest(TestCase):
    fixtures = FIXTURES

    @classmethod
    def setUpTestData(cls):
        cls.user = create_account()
        cls.video = create_media(cls.user, SMALL_VIDEO)

    def add_encoding(self, name, status, with_file=True):
        encoding = Encoding(media=self.video, profile=profile(name), status=status)
        if with_file:
            attach_file(encoding)
        encoding.save()
        return encoding

    def test_media_without_renditions_is_pending(self):
        self.video.set_encoding_status()

        self.assertEqual(self.video.encoding_status, "pending")

    def test_one_successful_rendition_is_enough_for_success(self):
        self.add_encoding("h264-144", "fail")
        self.add_encoding("h264-240", "success")
        self.video.refresh_from_db()

        self.assertEqual(self.video.encoding_status, "success")

    def test_running_wins_over_fail_but_not_over_success(self):
        self.add_encoding("h264-144", "fail", with_file=False)
        self.add_encoding("h264-240", "running", with_file=False)

        self.video.set_encoding_status()

        self.assertEqual(self.video.encoding_status, "running")

    def test_only_failed_renditions_mean_fail_and_the_media_leaves_listings(self):
        self.add_encoding("h264-144", "fail", with_file=False)
        self.video.refresh_from_db()

        self.assertEqual(self.video.encoding_status, "fail")
        self.assertFalse(self.video.listable)

    def test_a_successful_preview_alone_does_not_count_as_encoded(self):
        self.add_encoding("preview", "success")
        self.video.refresh_from_db()

        self.assertEqual(self.video.encoding_status, "pending")
        self.assertTrue(self.video.preview_file_path)

    def test_deleting_the_preview_encoding_clears_the_preview_path(self):
        preview = self.add_encoding("preview", "success")

        preview.delete()
        self.video.refresh_from_db()

        self.assertEqual(self.video.preview_file_path, "")
        self.assertFalse(os.path.exists(preview.media_file.path))

    def test_deleting_the_only_rendition_removes_its_file_and_resets_status(self):
        encoding = self.add_encoding("h264-240", "success")
        path = encoding.media_file.path
        self.assertTrue(os.path.exists(path))

        encoding.delete()
        self.video.refresh_from_db()

        self.assertFalse(os.path.exists(path))
        self.assertEqual(self.video.encoding_status, "pending")

    def test_encodings_info_shows_the_original_while_still_encoding(self):
        Media.objects.filter(pk=self.video.pk).update(encoding_status="running")
        self.video.refresh_from_db()

        info = self.video.encodings_info

        self.assertEqual(info["0-original"]["h264"]["url"], helpers.url_from_path(self.video.media_file.path))

    def test_full_encoding_info_carries_logs_and_timing(self):
        encoding = self.add_encoding("h264-240", "success")
        Encoding.objects.filter(pk=encoding.pk).update(logs="pipeline log", commands="ffmpeg ...", total_run_time=3)
        encoding.refresh_from_db()

        info = self.video.get_encoding_info(encoding, full=True)

        self.assertEqual(info["logs"], "pipeline log")
        self.assertEqual(info["total_run_time"], 3)
        self.assertEqual(info["commands"], "ffmpeg ...")
        self.assertIn("time_started", info)


class EncodingModelTest(TestCase):
    fixtures = FIXTURES

    @classmethod
    def setUpTestData(cls):
        cls.user = create_account()
        cls.video = create_media(cls.user, SMALL_VIDEO, title="pipeline model video")

    def test_saving_with_a_file_records_its_size(self):
        encoding = attach_file(Encoding(media=self.video, profile=profile("h264-240"), status="running"), content=b"x" * 2_500_000)
        encoding.save()

        self.assertEqual(encoding.size, "2.5MB")
        self.assertEqual(encoding.media_encoding_url, helpers.url_from_path(encoding.media_file.path))

    def test_an_encoding_without_a_file_has_no_urls(self):
        encoding = Encoding.objects.create(media=self.video, profile=profile("h264-240"))

        self.assertIsNone(encoding.media_encoding_url)
        self.assertIsNone(encoding.media_chunk_url)
        self.assertEqual(encoding.size, "")

    def test_a_chunk_records_the_md5sum_of_its_source(self):
        chunk_path = self.video.media_file.path
        encoding = Encoding.objects.create(media=self.video, profile=profile("h264-240"), chunk=True, chunk_file_path=chunk_path)

        self.assertEqual(encoding.md5sum, self.video.md5sum)
        self.assertEqual(encoding.media_chunk_url, helpers.url_from_path(chunk_path))

    def test_set_progress_stores_values_between_0_and_100(self):
        encoding = Encoding.objects.create(media=self.video, profile=profile("h264-240"))

        self.assertTrue(encoding.set_progress(42))
        encoding.refresh_from_db()
        self.assertEqual(encoding.progress, 42)

    def test_set_progress_rejects_out_of_range_and_non_integer_values(self):
        encoding = Encoding.objects.create(media=self.video, profile=profile("h264-240"))

        for value in (101, -1, "50", 12.5):
            self.assertFalse(encoding.set_progress(value))
        encoding.refresh_from_db()
        self.assertEqual(encoding.progress, 0)

    def test_update_encoding_size_refreshes_a_stale_size(self):
        encoding = attach_file(Encoding(media=self.video, profile=profile("h264-240"), status="running"), content=b"x" * 1_000_000)
        encoding.save()
        with open(encoding.media_file.path, "wb") as handle:
            handle.write(b"x" * 3_000_000)

        self.assertTrue(tasks.update_encoding_size(encoding.id))

        encoding.refresh_from_db()
        self.assertEqual(encoding.size, "3.0MB")

    def test_update_encoding_size_skips_missing_encodings_and_files(self):
        without_file = Encoding.objects.create(media=self.video, profile=profile("h264-240"))

        self.assertFalse(without_file.update_size_without_save())
        self.assertTrue(tasks.update_encoding_size(without_file.id))
        without_file.refresh_from_db()
        self.assertEqual(without_file.size, "")
        self.assertFalse(tasks.update_encoding_size(without_file.id + 100000))

    def test_a_successful_chunk_with_unreadable_chunk_info_is_discarded(self):
        encoding = attach_file(Encoding(media=self.video, profile=profile("h264-240"), chunk=True, chunk_file_path=self.video.media_file.path, chunks_info="not json"))
        encoding.status = "success"
        encoding.save()

        self.assertFalse(Encoding.objects.filter(pk=encoding.pk).exists())

    def test_string_representations(self):
        encoding = Encoding.objects.create(media=self.video, profile=profile("h264-240"))

        self.assertEqual(str(encoding), "h264-240-pipeline model video")
        self.assertEqual(str(profile("h264-240")), "h264-240")
        trim = VideoTrimRequest.objects.create(media=self.video, video_action="replace", timestamps=[])
        self.assertEqual(str(trim), "Trim request for pipeline model video (initial)")


class VideoChapterDataTest(TestCase):
    fixtures = FIXTURES

    @classmethod
    def setUpTestData(cls):
        cls.media = create_media(create_account(), IMAGE)

    def test_chapter_data_keeps_only_well_formed_chapters(self):
        chapters = VideoChapterData.objects.create(
            media=self.media,
            data=[
                {"startTime": 0, "endTime": 5, "chapterTitle": "Intro"},
                {"startTime": "00:00:05", "endTime": "00:00:09", "chapterTitle": "Middle", "extra": "dropped"},
                {"startTime": 9, "endTime": 12},
                {"startTime": None, "endTime": 12, "chapterTitle": "No start"},
                {"startTime": [1], "endTime": 12, "chapterTitle": "Bad type"},
                "not a dict",
            ],
        )

        self.assertEqual(
            chapters.chapter_data,
            [
                {"startTime": 0, "endTime": 5, "chapterTitle": "Intro"},
                {"startTime": "00:00:05", "endTime": "00:00:09", "chapterTitle": "Middle"},
            ],
        )
        self.assertEqual(self.media.chapter_data, chapters.chapter_data)

    def test_non_list_chapter_data_reads_as_empty(self):
        chapters = VideoChapterData.objects.create(media=self.media, data={"startTime": 0})

        self.assertEqual(chapters.chapter_data, [])

    def test_media_without_chapters_has_empty_chapter_data(self):
        self.assertEqual(self.media.chapter_data, [])


class EncodingChunkFailCleanupTest(TestCase):
    fixtures = FIXTURES

    @classmethod
    def setUpTestData(cls):
        cls.user = create_account()

    def setUp(self):
        self.video = create_media(self.user, SMALL_VIDEO)
        self.profile = profile("h264-144")
        self.other_profile = profile("h264-240")
        source_dir = os.path.dirname(self.video.media_file.path)
        self.chunk_paths = []
        for index in range(2):
            path = os.path.join(source_dir, f"{index:02d}_tokenseg_pipeline.mkv")
            with open(path, "wb") as handle:
                handle.write(b"chunk-bytes")
            self.chunk_paths.append(path)
        self.chunks_info = json.dumps({path: f"md5{index}" for index, path in enumerate(self.chunk_paths)})

    def tearDown(self):
        for path in self.chunk_paths:
            if os.path.exists(path):
                os.remove(path)

    def _create_chunk_encoding(self, profile_obj, chunk_path, status="pending", logs=""):
        return Encoding.objects.create(
            media=self.video,
            profile=profile_obj,
            chunk=True,
            chunk_file_path=chunk_path,
            chunks_info=self.chunks_info,
            status=status,
            logs=logs,
            worker="localhost",
        )

    def test_a_failed_chunk_collapses_to_one_fail_encoding_and_removes_source_segments(self):
        first = self._create_chunk_encoding(self.profile, self.chunk_paths[0], status="running", logs="chunk0 ok-ish")
        second = self._create_chunk_encoding(self.profile, self.chunk_paths[1], status="running", logs="about to fail")

        second.status = "fail"
        second.logs = "ffmpeg killed"
        second.save()

        self.assertFalse(Encoding.objects.filter(media=self.video, profile=self.profile, chunk=True).exists())
        final = Encoding.objects.get(media=self.video, profile=self.profile, chunk=False)
        self.assertEqual(final.status, "fail")
        self.assertIn("ffmpeg killed", final.logs)
        self.assertFalse(Encoding.objects.filter(pk=first.pk).exists())
        for path in self.chunk_paths:
            self.assertFalse(os.path.exists(path))

    def test_source_segments_are_kept_while_another_profile_still_references_them(self):
        failing = self._create_chunk_encoding(self.profile, self.chunk_paths[0], status="running", logs="boom")
        self._create_chunk_encoding(self.profile, self.chunk_paths[1], status="pending")
        self._create_chunk_encoding(self.other_profile, self.chunk_paths[0], status="pending")
        self._create_chunk_encoding(self.other_profile, self.chunk_paths[1], status="pending")

        failing.status = "fail"
        failing.logs = "ffmpeg killed"
        failing.save()

        self.assertFalse(Encoding.objects.filter(media=self.video, profile=self.profile, chunk=True).exists())
        self.assertEqual(Encoding.objects.filter(media=self.video, profile=self.other_profile, chunk=True).count(), 2)
        for path in self.chunk_paths:
            self.assertTrue(os.path.exists(path))

    @override_settings(ENCODING_CHUNKS_RETENTION_HOURS=0)
    def test_cleanup_task_removes_leftover_chunk_rows_beside_a_terminal_encoding(self):
        Encoding.objects.create(media=self.video, profile=self.profile, status="fail", progress=100)
        leftover = self._create_chunk_encoding(self.profile, self.chunk_paths[0], status="pending", logs="stale")
        other = self._create_chunk_encoding(self.profile, self.chunk_paths[1], status="pending", logs="stale2")
        # Bypass post_save so we simulate historical leftovers next to a terminal row
        Encoding.objects.filter(pk__in=[leftover.pk, other.pk]).update(status="fail")
        old = time.time() - 60
        for path in self.chunk_paths:
            os.utime(path, (old, old))

        self.assertTrue(tasks.cleanup_encoding_chunks())

        self.assertFalse(Encoding.objects.filter(pk=leftover.pk).exists())
        self.assertFalse(Encoding.objects.filter(media=self.video, profile=self.profile, chunk=True).exists())
        for path in self.chunk_paths:
            self.assertFalse(os.path.exists(path))

    @override_settings(ENCODING_CHUNKS_RETENTION_HOURS=24)
    def test_cleanup_task_leaves_in_use_segments_alone(self):
        self._create_chunk_encoding(self.profile, self.chunk_paths[0], status="running")
        self._create_chunk_encoding(self.profile, self.chunk_paths[1], status="pending")
        old = time.time() - 60 * 60 * 48
        for path in self.chunk_paths:
            os.utime(path, (old, old))

        self.assertTrue(tasks.cleanup_encoding_chunks())

        self.assertEqual(Encoding.objects.filter(media=self.video, profile=self.profile, chunk=True).count(), 2)
        for path in self.chunk_paths:
            self.assertTrue(os.path.exists(path))

    @override_settings(ENCODING_CHUNKS_RETENTION_HOURS=0)
    def test_cleanup_task_collapses_aged_failed_chunk_groups_without_a_terminal_row(self):
        first = self._create_chunk_encoding(self.profile, self.chunk_paths[0], status="pending", logs="fail0")
        second = self._create_chunk_encoding(self.profile, self.chunk_paths[1], status="pending", logs="fail1")
        aged = timezone.now() - timedelta(hours=48)
        Encoding.objects.filter(pk__in=[first.pk, second.pk]).update(status="fail", update_date=aged)
        old = time.time() - 60
        for path in self.chunk_paths:
            os.utime(path, (old, old))

        self.assertTrue(tasks.cleanup_encoding_chunks())

        self.assertFalse(Encoding.objects.filter(media=self.video, profile=self.profile, chunk=True).exists())
        final = Encoding.objects.get(media=self.video, profile=self.profile, chunk=False)
        self.assertEqual(final.status, "fail")
        self.assertIn("fail0", final.logs)
        for path in self.chunk_paths:
            self.assertFalse(os.path.exists(path))


class EncodeMediaGuardsTest(TestCase):
    fixtures = FIXTURES

    @classmethod
    def setUpTestData(cls):
        cls.video = create_media(create_account(), SMALL_VIDEO)

    def test_an_unknown_encoding_id_exits_without_work(self):
        self.assertFalse(tasks.encode_media(self.video.friendly_token, profile("h264-144").id, 999999))
        self.assertFalse(self.video.encodings.exists())

    def test_an_unknown_media_drops_the_encoding_row(self):
        encoding = Encoding.objects.create(media=self.video, profile=profile("h264-144"))

        self.assertFalse(tasks.encode_media("nosuchtoken", profile("h264-144").id, encoding.id))
        self.assertFalse(Encoding.objects.filter(pk=encoding.pk).exists())

    def test_without_force_a_duplicate_encoding_is_dropped(self):
        first = Encoding.objects.create(media=self.video, profile=profile("h264-144"))
        second = Encoding.objects.create(media=self.video, profile=profile("h264-144"))

        self.assertFalse(tasks.encode_media(self.video.friendly_token, profile("h264-144").id, second.id, force=False))
        self.assertEqual(list(self.video.encodings.values_list("id", flat=True)), [first.id])

    def test_without_force_a_duplicate_chunk_encoding_is_dropped(self):
        path = self.video.media_file.path
        Encoding.objects.create(media=self.video, profile=profile("h264-144"), chunk=True, chunk_file_path=path)
        second = Encoding.objects.create(media=self.video, profile=profile("h264-144"), chunk=True, chunk_file_path=path)

        self.assertFalse(tasks.encode_media(self.video.friendly_token, profile("h264-144").id, second.id, force=False, chunk=True, chunk_file_path=path))
        self.assertFalse(Encoding.objects.filter(pk=second.pk).exists())

    def test_no_ffmpeg_commands_for_the_profile_marks_the_encoding_failed(self):
        encoding = Encoding.objects.create(media=self.video, profile=profile("h264-144"))

        with mock.patch.object(tasks, "produce_ffmpeg_commands", return_value=[]):
            self.assertFalse(tasks.encode_media(self.video.friendly_token, profile("h264-144").id, encoding.id))

        encoding.refresh_from_db()
        self.assertEqual(encoding.status, "fail")

    def test_ffmpeg_producing_no_output_file_marks_the_encoding_failed(self):
        encoding = Encoding.objects.create(media=self.video, profile=profile("h264-144"))

        with mock.patch.object(tasks.FFmpegBackend, "encode", return_value=iter(["done"])):
            self.assertFalse(tasks.encode_media(self.video.friendly_token, profile("h264-144").id, encoding.id))

        encoding.refresh_from_db()
        self.assertEqual(encoding.status, "fail")
        self.assertEqual(encoding.progress, 100)
        self.assertFalse(encoding.media_file)

    def test_a_known_ffmpeg_error_fails_the_encoding_without_retrying(self):
        encoding = Encoding.objects.create(media=self.video, profile=profile("h264-144"))
        error = tasks.VideoEncodingError("Invalid data found when processing input")

        with mock.patch.object(tasks.FFmpegBackend, "encode", side_effect=error) as encode:
            tasks.encode_media(self.video.friendly_token, profile("h264-144").id, encoding.id)

        encoding.refresh_from_db()
        self.assertEqual(encoding.status, "fail")
        self.assertIn("Invalid data found", encoding.logs)
        self.assertEqual(encode.call_count, 1)
        self.video.refresh_from_db()
        self.assertEqual(self.video.encoding_status, "fail")

    def test_an_unexpected_ffmpeg_error_is_retried_then_left_failed(self):
        encoding = Encoding.objects.create(media=self.video, profile=profile("h264-144"))

        with mock.patch.object(tasks.FFmpegBackend, "encode", side_effect=tasks.VideoEncodingError("worker lost")) as encode:
            result = tasks.encode_media.apply(args=[self.video.friendly_token, profile("h264-144").id, encoding.id])

        self.assertTrue(result.failed())
        self.assertEqual(encode.call_count, 2)
        encoding.refresh_from_db()
        self.assertEqual(encoding.status, "fail")
        self.assertEqual(encoding.logs, "worker lost")


@pytest.mark.slow
class EncodeMediaSingleProfileTest(TestCase):
    fixtures = FIXTURES

    @classmethod
    def setUpTestData(cls):
        cls.user = create_account()

    def setUp(self):
        self.video = create_media(self.user, SMALL_VIDEO)
        self.profile = profile("h264-144")

    def test_encode_media_produces_a_playable_rendition_and_walks_the_statuses(self):
        encoding = Encoding.objects.create(media=self.video, profile=self.profile)
        statuses = []

        def record(sender, instance, **kwargs):
            if instance.pk == encoding.pk:
                statuses.append(instance.status)

        post_save.connect(record, sender=Encoding)
        try:
            self.assertTrue(tasks.encode_media(self.video.friendly_token, self.profile.id, encoding.id))
        finally:
            post_save.disconnect(record, sender=Encoding)

        self.assertEqual(statuses[0], "running")
        self.assertEqual(statuses[-1], "success")
        encoding.refresh_from_db()
        self.assertEqual(encoding.progress, 100)
        self.assertEqual(encoding.worker, "localhost")
        self.assertTrue(encoding.size.endswith("MB"))
        info = helpers.media_file_info(encoding.media_file.path)
        self.assertTrue(info["is_video"])
        self.assertEqual(info["video_height"], 144)
        self.assertAlmostEqual(float(info["video_duration"]), 27.2, delta=0.5)
        self.video.refresh_from_db()
        self.assertEqual(self.video.encoding_status, "success")
        if mp4hls_is_usable(self.video.media_file.path):
            self.assertTrue(os.path.exists(self.video.hls_file))
        else:
            self.assertFalse(self.video.hls_file)

    def test_a_corrupt_source_fails_the_encoding_with_ffmpegs_error(self):
        with open(self.video.media_file.path, "wb") as handle:
            handle.write(os.urandom(4096))
        encoding = Encoding.objects.create(media=self.video, profile=self.profile)

        self.assertFalse(tasks.encode_media(self.video.friendly_token, self.profile.id, encoding.id))

        encoding.refresh_from_db()
        self.assertEqual(encoding.status, "fail")
        self.assertFalse(encoding.media_file)
        self.video.refresh_from_db()
        self.assertEqual(self.video.encoding_status, "fail")
        self.assertFalse(self.video.listable)

    @override_settings(VIDEO_CHUNKS_DURATION=10)
    def test_chunkize_media_encodes_segments_and_joins_them_into_one_rendition(self):
        with mock.patch.object(transaction, "mark_for_rollback_on_error", lambda using=None: contextlib.nullcontext()):
            self.assertTrue(tasks.chunkize_media(self.video.friendly_token, [self.profile.id]))

        self.assertFalse(Encoding.objects.filter(media=self.video, chunk=True).exists())
        final = Encoding.objects.get(media=self.video, profile=self.profile)
        self.assertEqual(final.status, "success")
        self.assertIn("workers", json.loads(final.worker))
        info = helpers.media_file_info(final.media_file.path)
        self.assertTrue(info["is_video"])
        self.assertAlmostEqual(float(info["video_duration"]), 27.2, delta=1.5)
        source_dir = os.path.dirname(self.video.media_file.path)
        self.assertEqual([name for name in os.listdir(source_dir) if name.endswith(".mkv")], [])

    def test_the_preview_profile_builds_a_short_clip(self):
        preview = EncodeProfile.objects.get(name="preview", extension="mp4")
        encoding = Encoding.objects.create(media=self.video, profile=preview)

        self.assertTrue(tasks.encode_media(self.video.friendly_token, preview.id, encoding.id))

        encoding.refresh_from_db()
        info = helpers.media_file_info(encoding.media_file.path)
        self.assertTrue(info["is_video"])
        self.assertAlmostEqual(float(info["video_duration"]), 6, delta=1)
        self.assertEqual(int(info["video_width"]), 320)
        self.video.refresh_from_db()
        self.assertEqual(self.video.preview_file_path, encoding.media_file.path)


class MediaInitTest(TestCase):
    fixtures = FIXTURES

    @classmethod
    def setUpTestData(cls):
        cls.user = create_account()

    @override_settings(ALLOWED_MEDIA_UPLOAD_TYPES=["image"])
    def test_a_disallowed_type_is_removed_and_unlisted(self):
        video = create_media(self.user, SMALL_VIDEO)

        self.assertFalse(os.path.exists(video.media_file.path))
        self.assertEqual(video.state, "unlisted")
        self.assertFalse(video.encodings.exists())

    @override_settings(DO_NOT_TRANSCODE_VIDEO=True)
    def test_do_not_transcode_marks_a_video_ready_and_serves_the_original(self):
        video = create_media(self.user, SMALL_VIDEO, transcode=True)

        self.assertEqual(video.encoding_status, "success")
        self.assertFalse(video.encodings.exists())
        self.assertEqual(video.encodings_info["0-original"]["h264"]["url"], helpers.url_from_path(video.media_file.path))

    def test_a_video_upload_queues_sprites_after_commit(self):
        with self.captureOnCommitCallbacks(execute=False) as callbacks:
            video = create_media(self.user, SMALL_VIDEO)

        self.assertEqual(len(callbacks), 1)
        with mock.patch.object(tasks.produce_sprite_from_video, "delay") as delay:
            callbacks[0]()
        delay.assert_called_once_with(video.friendly_token)

    def test_produce_sprite_from_video_writes_a_vertical_sprite_sheet(self):
        video = create_media(self.user, SMALL_VIDEO)

        self.assertTrue(tasks.produce_sprite_from_video(video.friendly_token))

        video.refresh_from_db()
        self.assertTrue(video.sprites.name.endswith("sprites.jpg"))
        self.assertTrue(os.path.getsize(video.sprites.path) > 0)

    def test_task_wrappers_tolerate_unknown_media(self):
        self.assertFalse(tasks.media_init("nosuchtoken"))
        self.assertFalse(tasks.produce_sprite_from_video("nosuchtoken"))
        self.assertFalse(tasks.update_search_vector("nosuchtoken"))
        self.assertFalse(tasks.create_hls("nosuchtoken"))

    def test_media_init_task_rereads_the_file(self):
        image = create_media(self.user, IMAGE)
        Media.objects.filter(pk=image.pk).update(media_type="video")

        self.assertTrue(tasks.media_init(image.friendly_token))

        image.refresh_from_db()
        self.assertEqual(image.media_type, "image")

    def test_thumbnail_time_picks_the_frame_for_a_video_thumbnail(self):
        video = create_media(self.user, SMALL_VIDEO)
        old_thumbnail = video.thumbnail.name

        video.thumbnail_time = 3.14
        video.save()
        video.refresh_from_db()

        self.assertEqual(video.thumbnail_time, 3.1)
        self.assertNotEqual(video.thumbnail.name, old_thumbnail)
        self.assertTrue(os.path.exists(video.thumbnail.path))

    def test_produce_thumbnails_from_video_ignores_other_media_types(self):
        image = create_media(self.user, IMAGE)

        self.assertFalse(image.produce_thumbnails_from_video())


def write_fake_bento_tree(output_dir, resolution, bandwidth=500000, marker=None):
    """Minimal Bento-like tree so create_hls can install/merge without the binary."""
    os.makedirs(os.path.join(output_dir, "media-1"), exist_ok=True)
    with open(os.path.join(output_dir, "media-1", "stream.m3u8"), "w", encoding="utf-8") as handle:
        handle.write("#EXTM3U\n#EXT-X-TARGETDURATION:4\n#EXT-X-ENDLIST\n")
    with open(os.path.join(output_dir, "media-1", "iframes.m3u8"), "w", encoding="utf-8") as handle:
        handle.write("#EXTM3U\n#EXT-X-TARGETDURATION:4\n#EXT-X-ENDLIST\n")
    if marker is not None:
        with open(os.path.join(output_dir, "media-1", "marker.txt"), "w", encoding="utf-8") as handle:
            handle.write(marker)
    width = max(resolution * 16 // 9, 1)
    with open(os.path.join(output_dir, "master.m3u8"), "w", encoding="utf-8") as handle:
        handle.write(
            "#EXTM3U\n"
            f"#EXT-X-STREAM-INF:BANDWIDTH={bandwidth},RESOLUTION={width}x{resolution}\n"
            "media-1/stream.m3u8\n"
            f'#EXT-X-I-FRAME-STREAM-INF:BANDWIDTH={bandwidth // 10},CODECS="avc1.42E01E",'
            f'RESOLUTION={width}x{resolution},URI="media-1/iframes.m3u8"\n'
        )


class CreateHlsTest(TestCase):
    fixtures = FIXTURES

    def setUp(self):
        # Fresh media per test so encodings/HLS trees do not leak across cases.
        self.video = create_media(create_account(), SMALL_VIDEO)

    def add_success_encoding(self, profile_name, filename, *, chunk=False, status="success"):
        with open(self.video.media_file.path, "rb") as handle:
            encoding = Encoding(media=self.video, profile=profile(profile_name), status=status, chunk=False)
            encoding.media_file.save(filename, ContentFile(handle.read()), save=False)
        with mock.patch.object(tasks.create_hls, "delay"):
            encoding.save()
        if chunk:
            # Avoid the chunk-finalize signal (empty chunks_info deletes the row).
            Encoding.objects.filter(pk=encoding.pk).update(chunk=True)
            encoding.refresh_from_db()
        return encoding

    def test_without_the_bento4_binary_no_hls_is_made(self):
        with override_settings(MP4HLS_COMMAND="/nonexistent/mp4hls"):
            self.assertFalse(tasks.create_hls(self.video.friendly_token))

    def test_without_an_h264_rendition_there_is_nothing_to_package(self):
        self.assertTrue(tasks.create_hls(self.video.friendly_token))

        self.video.refresh_from_db()
        self.assertEqual(self.video.hls_file, "")
        self.assertEqual(self.video.hls_info, {})

    def test_unknown_encoding_id_is_rejected(self):
        self.assertFalse(tasks.create_hls(self.video.friendly_token, 999999))

    def test_chunk_encoding_is_not_packaged_incrementally(self):
        encoding = self.add_success_encoding("h264-240", "chunk_240.mp4", chunk=True)
        with mock.patch.object(tasks, "_run_mp4hls") as run_mp4hls:
            self.assertFalse(tasks.create_hls(self.video.friendly_token, encoding.id))
        run_mp4hls.assert_not_called()

    def test_bento_failure_does_not_install_hls(self):
        encoding = self.add_success_encoding("h264-240", "fail_240.mp4")
        with mock.patch.object(tasks, "_run_mp4hls", return_value=False):
            self.assertFalse(tasks.create_hls(self.video.friendly_token, encoding.id))
        self.video.refresh_from_db()
        self.assertEqual(self.video.hls_file, "")
        self.assertFalse(os.path.isdir(os.path.join(settings.HLS_DIR, self.video.uid.hex)))

    def test_hls_is_rebuilt_in_place_when_it_already_exists(self):
        encoding = self.add_success_encoding("h264-240", "pipeline_240.mp4")

        def fake_run(media_files, output_dir):
            write_fake_bento_tree(output_dir, resolution=240)
            return True

        with mock.patch.object(tasks, "_run_mp4hls", side_effect=fake_run):
            self.assertTrue(tasks.create_hls(self.video.friendly_token, encoding.id))
            self.video.refresh_from_db()
            first = self.video.hls_file
            self.assertTrue(os.path.exists(first))

            self.assertTrue(tasks.create_hls(self.video.friendly_token))

        self.video.refresh_from_db()
        self.assertEqual(self.video.hls_file, first)
        uid = self.video.uid.hex
        self.assertEqual([name for name in os.listdir(settings.HLS_DIR) if name.startswith(uid)], [uid])
        self.assertIn("240_playlist", self.video.hls_info)

    def test_incremental_hls_passes_only_the_new_encoding_to_bento(self):
        encoding = self.add_success_encoding("h264-240", "incremental_240.mp4")
        calls = []

        def fake_run(media_files, output_dir):
            calls.append(list(media_files))
            write_fake_bento_tree(output_dir, resolution=240)
            return True

        with mock.patch.object(tasks, "_run_mp4hls", side_effect=fake_run):
            self.assertTrue(tasks.create_hls(self.video.friendly_token, encoding.id))

        self.assertEqual(calls, [[encoding.media_file.path]])
        self.video.refresh_from_db()
        permanent = os.path.join(settings.HLS_DIR, self.video.uid.hex)
        self.assertEqual(self.video.hls_file, os.path.join(permanent, "master.m3u8"))
        self.assertTrue(os.path.isdir(os.path.join(permanent, "media-240")))
        self.assertIn("240_playlist", self.video.hls_info)

    def test_second_encoding_merges_without_wiping_the_first_variant(self):
        first = self.add_success_encoding("h264-240", "merge_240.mp4")
        second = self.add_success_encoding("h264-480", "merge_480.mp4")

        def fake_run(media_files, output_dir):
            path = media_files[0]
            resolution = 240 if path == first.media_file.path else 480
            write_fake_bento_tree(output_dir, resolution=resolution, bandwidth=100000 * resolution)
            return True

        with mock.patch.object(tasks, "_run_mp4hls", side_effect=fake_run):
            self.assertTrue(tasks.create_hls(self.video.friendly_token, first.id))
            self.assertTrue(tasks.create_hls(self.video.friendly_token, second.id))

        permanent = os.path.join(settings.HLS_DIR, self.video.uid.hex)
        self.assertTrue(os.path.isdir(os.path.join(permanent, "media-240")))
        self.assertTrue(os.path.isdir(os.path.join(permanent, "media-480")))
        master = m3u8.load(os.path.join(permanent, "master.m3u8"))
        self.assertEqual({playlist.uri for playlist in master.playlists}, {"media-240/stream.m3u8", "media-480/stream.m3u8"})
        self.assertEqual({playlist.uri for playlist in master.iframe_playlists}, {"media-240/iframes.m3u8", "media-480/iframes.m3u8"})
        self.video.refresh_from_db()
        self.assertIn("240_playlist", self.video.hls_info)
        self.assertIn("480_playlist", self.video.hls_info)

    def test_repackaging_the_same_profile_replaces_the_variant(self):
        encoding = self.add_success_encoding("h264-240", "replace_240.mp4")
        permanent = os.path.join(settings.HLS_DIR, self.video.uid.hex)
        marker_path = os.path.join(permanent, "media-240", "marker.txt")

        def fake_run(media_files, output_dir, marker="first", bandwidth=240000):
            write_fake_bento_tree(output_dir, resolution=240, bandwidth=bandwidth, marker=marker)
            return True

        with mock.patch.object(tasks, "_run_mp4hls", side_effect=lambda media_files, output_dir: fake_run(media_files, output_dir, "first", 240000)):
            self.assertTrue(tasks.create_hls(self.video.friendly_token, encoding.id))
        with open(marker_path, encoding="utf-8") as handle:
            self.assertEqual(handle.read(), "first")

        with mock.patch.object(tasks, "_run_mp4hls", side_effect=lambda media_files, output_dir: fake_run(media_files, output_dir, "second", 480000)):
            self.assertTrue(tasks.create_hls(self.video.friendly_token, encoding.id))

        with open(marker_path, encoding="utf-8") as handle:
            self.assertEqual(handle.read(), "second")
        master = m3u8.load(os.path.join(permanent, "master.m3u8"))
        media_240 = [playlist for playlist in master.playlists if playlist.uri.startswith("media-240/")]
        self.assertEqual(len(media_240), 1)
        self.assertEqual(media_240[0].stream_info.bandwidth, 480000)
        self.assertEqual(len([playlist for playlist in master.iframe_playlists if playlist.uri.startswith("media-240/")]), 1)

    def test_busy_hls_lock_retries_instead_of_overlapping_install(self):
        encoding = self.add_success_encoding("h264-240", "lock_240.mp4")
        lock_key = tasks._hls_lock_key(self.video.uid.hex)
        cache.set(lock_key, "1", timeout=60)

        def fake_run(media_files, output_dir):
            write_fake_bento_tree(output_dir, resolution=240)
            return True

        try:
            with mock.patch.object(tasks, "_run_mp4hls", side_effect=fake_run):
                with self.assertRaises(Retry):
                    tasks.create_hls(self.video.friendly_token, encoding.id)
        finally:
            cache.delete(lock_key)

        self.assertFalse(os.path.isdir(os.path.join(settings.HLS_DIR, self.video.uid.hex)))

    def test_full_rebuild_passes_all_successful_encodings_to_bento(self):
        first = self.add_success_encoding("h264-240", "full_240.mp4")
        second = self.add_success_encoding("h264-480", "full_480.mp4")
        calls = []

        def fake_run(media_files, output_dir):
            calls.append(list(media_files))
            # Full rebuild keeps Bento's media-1 / media-2 layout.
            os.makedirs(os.path.join(output_dir, "media-1"), exist_ok=True)
            os.makedirs(os.path.join(output_dir, "media-2"), exist_ok=True)
            for name in ("media-1", "media-2"):
                with open(os.path.join(output_dir, name, "stream.m3u8"), "w", encoding="utf-8") as handle:
                    handle.write("#EXTM3U\n#EXT-X-ENDLIST\n")
            with open(os.path.join(output_dir, "master.m3u8"), "w", encoding="utf-8") as handle:
                handle.write(
                    "#EXTM3U\n" "#EXT-X-STREAM-INF:BANDWIDTH=240000,RESOLUTION=426x240\n" "media-1/stream.m3u8\n" "#EXT-X-STREAM-INF:BANDWIDTH=480000,RESOLUTION=854x480\n" "media-2/stream.m3u8\n"
                )
            return True

        with mock.patch.object(tasks, "_run_mp4hls", side_effect=fake_run):
            self.assertTrue(tasks.create_hls(self.video.friendly_token))

        self.assertEqual(len(calls), 1)
        self.assertEqual(set(calls[0]), {first.media_file.path, second.media_file.path})
        self.video.refresh_from_db()
        self.assertTrue(self.video.hls_file.endswith("master.m3u8"))
        self.assertIn("240_playlist", self.video.hls_info)
        self.assertIn("480_playlist", self.video.hls_info)

    def test_real_bento_incremental_packages_a_rendition(self):
        if not mp4hls_is_usable(self.video.media_file.path):
            self.skipTest("usable mp4hls binary is not available")

        encoding = self.add_success_encoding("h264-240", "bento_240.mp4")
        self.assertTrue(tasks.create_hls(self.video.friendly_token, encoding.id))

        permanent = os.path.join(settings.HLS_DIR, self.video.uid.hex)
        self.video.refresh_from_db()
        self.assertEqual(self.video.hls_file, os.path.join(permanent, "master.m3u8"))
        self.assertTrue(os.path.exists(self.video.hls_file))
        self.assertTrue(os.path.isdir(os.path.join(permanent, "media-240")))
        self.assertIn("240_playlist", self.video.hls_info)
