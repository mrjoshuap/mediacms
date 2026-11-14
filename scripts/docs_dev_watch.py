#!/usr/bin/env python3
"""Build MkDocs into site/ for Django /documentation/, optionally watch for changes."""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MKDOCS_SRC = ROOT / "mkdocs.yml"
MKDOCS_LOCAL = ROOT / "mkdocs.local.yml"
SITE_DIR = ROOT / "site"
WATCH_ROOTS = (
    ROOT / "docs",
    ROOT / "scripts" / "prepare_docs_build.py",
    ROOT / "scripts" / "check_doc_scenarios.py",
    ROOT / "mkdocs.yml",
    ROOT / "CHANGELOG.md",
    ROOT / "package.json",
    ROOT / "requirements-docs.txt",
)


def write_local_config() -> Path:
    """Write mkdocs.local.yml for Django /documentation/ serving.

    Default: clear site_url so the build uses relative links and works on any host
    (localhost:80 or a reverse-proxied HTTPS name). Set DOCS_SITE_URL to force
    an absolute canonical URL when needed.
    """
    text = MKDOCS_SRC.read_text(encoding="utf-8")
    site_url = os.environ.get("DOCS_SITE_URL", "").strip()
    if site_url:
        site_url = site_url.rstrip("/") + "/"
        if re.search(r"^site_url:\s*.*$", text, flags=re.MULTILINE):
            text = re.sub(r"^site_url:\s*.*$", f"site_url: {site_url}", text, count=1, flags=re.MULTILINE)
        else:
            text = f"site_url: {site_url}\n" + text
    else:
        text = re.sub(r"^site_url:\s*.*\n?", "", text, count=1, flags=re.MULTILINE)
    MKDOCS_LOCAL.write_text(text, encoding="utf-8")
    return MKDOCS_LOCAL


def tree_mtime(path: Path) -> float:
    if path.is_file():
        return path.stat().st_mtime
    newest = 0.0
    if not path.exists():
        return newest
    for root, dirnames, filenames in os.walk(path):
        dirnames[:] = [name for name in dirnames if name not in {".git", "__pycache__", "node_modules", "site"}]
        for name in filenames:
            try:
                newest = max(newest, (Path(root) / name).stat().st_mtime)
            except OSError:
                continue
    return newest


def snapshot() -> float:
    return max(tree_mtime(path) for path in WATCH_ROOTS)


def build_once() -> int:
    env = os.environ.copy()
    env.setdefault("DOCS_CHANNEL", "local")
    print("Preparing generated pages…", flush=True)
    subprocess.run([sys.executable, str(ROOT / "scripts" / "prepare_docs_build.py")], cwd=ROOT, env=env, check=True)
    config = write_local_config()
    print(f"Building docs with {config.name} → {SITE_DIR}/ …", flush=True)
    subprocess.run(
        [sys.executable, "-m", "mkdocs", "build", "--strict", "-f", str(config), "-d", str(SITE_DIR)],
        cwd=ROOT,
        env=env,
        check=True,
    )
    print("Documentation ready at /documentation/", flush=True)
    return 0


def watch(poll_seconds: float) -> int:
    build_once()
    last = snapshot()
    print(f"Watching docs (poll every {poll_seconds:.0f}s). Ctrl+C to stop.", flush=True)
    while True:
        time.sleep(poll_seconds)
        current = snapshot()
        if current > last:
            print("Change detected. Rebuilding…", flush=True)
            try:
                build_once()
                last = snapshot()
            except subprocess.CalledProcessError as exc:
                print(f"Build failed ({exc.returncode}). Waiting for the next change.", flush=True)
                last = current


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--once", action="store_true", help="Build once and exit.")
    parser.add_argument("--poll", type=float, default=2.0, help="Watch poll interval in seconds.")
    args = parser.parse_args()
    if args.once:
        return build_once()
    try:
        return watch(args.poll)
    except KeyboardInterrupt:
        print("Stopped.", flush=True)
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
