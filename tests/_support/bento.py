"""Detect whether the configured mp4hls/bento4 binary can package HLS here."""

from __future__ import annotations

import os
import tempfile

from django.conf import settings

from files import helpers


def mp4hls_is_usable(sample_mp4=None):
    """True when configured mp4hls can package a real MP4 in this environment.

    Returns False when the binary is missing or unusable (for example an amd64
    ELF under broken Rosetta in Docker Desktop on Apple Silicon).
    """
    command = getattr(settings, "MP4HLS_COMMAND", None)
    if not command or not os.path.isfile(command):
        return False
    if sample_mp4 is None:
        sample_mp4 = os.path.join(settings.BASE_DIR, "fixtures", "small_video.mp4")
    if not os.path.isfile(sample_mp4):
        return False
    with tempfile.TemporaryDirectory(dir=getattr(settings, "TEMP_DIRECTORY", None)) as temp_dir:
        output_dir = os.path.join(temp_dir, "probe")
        result = helpers.run_command([command, "--segment-duration=4", f"--output-dir={output_dir}", sample_mp4])
        combined = f"{result.get('out', '')}\n{result.get('error', '')}".lower()
        if "rosetta error" in combined or "failed to open elf" in combined:
            return False
        return os.path.exists(os.path.join(output_dir, "master.m3u8"))
