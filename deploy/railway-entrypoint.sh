#!/bin/sh
set -eu

: "${DATABASE_PATH:=/data/database/site.db}"
: "${MEDIA_ROOT:=/data/media}"
: "${BACKUP_ROOT:=/data/backups}"
export DATABASE_PATH MEDIA_ROOT BACKUP_ROOT

mkdir -p "$(dirname "$DATABASE_PATH")" "$MEDIA_ROOT/images" "$MEDIA_ROOT/videos" "$MEDIA_ROOT/pdf" "$BACKUP_ROOT"
if [ ! -f /data/.permissions-initialized ]; then
  chown -R nextjs:nodejs /data
  touch /data/.permissions-initialized
  chown nextjs:nodejs /data/.permissions-initialized
else
  chown nextjs:nodejs /data "$(dirname "$DATABASE_PATH")" "$MEDIA_ROOT" "$MEDIA_ROOT/images" "$MEDIA_ROOT/videos" "$MEDIA_ROOT/pdf" "$BACKUP_ROOT"
fi

gosu nextjs node /app/deploy/check-env.cjs
gosu nextjs node /app/deploy/runtime-init.cjs
exec gosu nextjs "$@"
