#!/usr/bin/env bash
set -Eeuo pipefail
umask 027
ENV_FILE=/var/www/app/site/shared/.env.production
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
exec 9>"$BACKUP_ROOT/.backup.lock"
flock -n 9 || { echo "Une sauvegarde est déjà en cours." >&2; exit 1; }
STAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p "$BACKUP_ROOT"
sqlite3 "$DATABASE_PATH" ".backup '$BACKUP_ROOT/site-$STAMP.db'"
tar -czf "$BACKUP_ROOT/media-$STAMP.tar.gz" -C "$MEDIA_ROOT" .
find "$BACKUP_ROOT" -type f -mtime +90 -delete
# Synchroniser ensuite BACKUP_ROOT vers un stockage externe chiffré (rclone/OVH Object Storage).
