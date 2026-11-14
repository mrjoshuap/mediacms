#!/bin/bash
# Compare a restored Postgres database with its source.
# Django migrate is not part of this step.
set -euo pipefail

if [ -z "${SOURCE_DATABASE_URL:-}" ] || [ -z "${DEST_DATABASE_URL:-}" ]; then
    echo "Set SOURCE_DATABASE_URL and DEST_DATABASE_URL" >&2
    exit 2
fi

count() {
    psql "$1" -Atqc "$2"
}

for table in files_media users_user files_page django_migrations; do
    source_count="$(count "$SOURCE_DATABASE_URL" "SELECT COUNT(*) FROM ${table}")"
    dest_count="$(count "$DEST_DATABASE_URL" "SELECT COUNT(*) FROM ${table}")"
    if [ "$source_count" != "$dest_count" ]; then
        echo "count mismatch ${table}: ${source_count} ${dest_count}" >&2
        exit 1
    fi
done

source_sequences="$(count "$SOURCE_DATABASE_URL" "SELECT md5(COALESCE(string_agg(schemaname || '.' || sequencename || ':' || COALESCE(last_value::text, ''), ',' ORDER BY schemaname, sequencename), '')) FROM pg_sequences")"
dest_sequences="$(count "$DEST_DATABASE_URL" "SELECT md5(COALESCE(string_agg(schemaname || '.' || sequencename || ':' || COALESCE(last_value::text, ''), ',' ORDER BY schemaname, sequencename), '')) FROM pg_sequences")"
if [ "$source_sequences" != "$dest_sequences" ]; then
    echo "sequence mismatch" >&2
    exit 1
fi

migrations_before="$(count "$DEST_DATABASE_URL" "SELECT COUNT(*) FROM django_migrations")"

for spec in files_media:id users_user:id files_page:id; do
    table="${spec%%:*}"
    column="${spec##*:}"
    query="SELECT md5(COALESCE(string_agg(${column}::text, ',' ORDER BY ${column}), '')) FROM ${table}"
    if [ "$(count "$SOURCE_DATABASE_URL" "$query")" != "$(count "$DEST_DATABASE_URL" "$query")" ]; then
        echo "key mismatch ${table}" >&2
        exit 1
    fi
done

migrations_after="$(count "$DEST_DATABASE_URL" "SELECT COUNT(*) FROM django_migrations")"
if [ "$migrations_before" != "$migrations_after" ]; then
    echo "postgres gate changed django_migrations" >&2
    exit 1
fi

echo "postgres gate ok"
