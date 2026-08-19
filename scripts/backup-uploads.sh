#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

if [[ -f .env ]]; then set -a; source .env; set +a; fi
: "${MEDIA_ROOT:?MEDIA_ROOT est obligatoire}"
ROOT="${BACKUP_ROOT:-./backups}/uploads"
STAMP="$(date -u +%Y-%m-%d_%H%M)"
DESTINATION="$ROOT/uploads_${STAMP}.tar.gz"
mkdir -p "$ROOT"
tar -czf "$DESTINATION" -C "$MEDIA_ROOT" .
tar -tzf "$DESTINATION" >/dev/null
find "$ROOT" -type f -name 'uploads_*.tar.gz' -mtime +"${UPLOADS_RETENTION_DAYS:-7}" -delete
echo "Sauvegarde des uploads créée : $DESTINATION"
