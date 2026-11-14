#!/usr/bin/env bash
# Pack source, docs, and OpenAPI assets for a GitHub Release.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TAG="${1:?usage: pack_release_assets.sh <tag> <channel>}"
CHANNEL="${2:?usage: pack_release_assets.sh <tag> <channel>}"
OUT="${ROOT}/dist/release"
PREFIX="mediacms-${TAG}"

rm -rf "${OUT}"
mkdir -p "${OUT}"

echo "Packing source archives…"
git archive --format=tar.gz --prefix="mediacms-${TAG}/" -o "${OUT}/${PREFIX}-source.tar.gz" HEAD
git archive --format=zip --prefix="mediacms-${TAG}/" -o "${OUT}/${PREFIX}-source.zip" HEAD

echo "Building documentation…"
# Stub so mkdocstrings/griffe can import cms.settings without a real local_settings.py
touch cms/local_settings.py
python scripts/prepare_docs_build.py
python -m mkdocs build --strict -d "${ROOT}/site"

echo "Packing docs…"
tar -C "${ROOT}/site" -czf "${OUT}/${PREFIX}-docs.tar.gz" .

if [[ -f docs/en/reference/openapi.yaml ]]; then
  cp docs/en/reference/openapi.yaml "${OUT}/${PREFIX}-openapi.yaml"
elif [[ -f site/reference/openapi.yaml ]]; then
  cp site/reference/openapi.yaml "${OUT}/${PREFIX}-openapi.yaml"
else
  echo "openapi.yaml missing" >&2
  exit 1
fi

OWNER="$(echo "${GITHUB_REPOSITORY_OWNER:-mrjoshuap}" | tr '[:upper:]' '[:lower:]')"
BASE_IMAGE="ghcr.io/${OWNER}/mediacms"
FULL_IMAGE="ghcr.io/${OWNER}/mediacms-full"

if [[ "${CHANNEL}" == "beta" ]]; then
  FLOAT_BASE="${BASE_IMAGE}:beta"
  FLOAT_FULL="${FULL_IMAGE}:beta"
  UPGRADE="${BASE_IMAGE}:upgrade-audit-beta"
  BRANCH_TAG="${BASE_IMAGE}:mediacms-next"
else
  FLOAT_BASE="${BASE_IMAGE}:stable"
  FLOAT_FULL="${FULL_IMAGE}:stable"
  UPGRADE="${BASE_IMAGE}:upgrade-audit"
  BRANCH_TAG=""
fi

{
  cat <<EOF
# MediaCMS ${TAG} (${CHANNEL})

## Container images (GHCR)

\`\`\`bash
docker pull ${FLOAT_BASE}
docker pull ${FLOAT_FULL}
docker pull ${BASE_IMAGE}:${TAG#v}
docker pull ${UPGRADE}
\`\`\`

Compose \`image:\` examples:

\`\`\`yaml
image: ${FLOAT_BASE}
# Whisper / full stack:
image: ${FLOAT_FULL}
# Pin this release:
image: ${BASE_IMAGE}:${TAG#v}
# Upgrade-audit drills (base image + upgrade_site scripts in the tree):
image: ${UPGRADE}
EOF
  if [[ -n "${BRANCH_TAG}" ]]; then
    echo "# Branch alias (same as :beta):"
    echo "image: ${BRANCH_TAG}"
  fi
  cat <<EOF
\`\`\`

Source and docs archives are attached to this GitHub Release.
EOF
} > "${OUT}/INSTALL-${CHANNEL}.md"

(
  cd "${OUT}"
  shopt -s nullglob
  sha256sum ./* > SHA256SUMS
)

echo "Assets written to ${OUT}"
ls -la "${OUT}"
