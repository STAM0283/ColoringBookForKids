#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

if [[ -f .env ]]; then set -a; source .env; set +a; fi
: "${DATABASE_URL:?DATABASE_URL est obligatoire}"
ROOT="${BACKUP_ROOT:-./backups}/database"
STAMP="$(date -u +%Y-%m-%d_%H%M)"
DAILY="$ROOT/daily/backup_${STAMP}.sql.gz"
mkdir -p "$ROOT"/{daily,weekly,monthly}

pg_dump --clean --if-exists --no-owner --no-privileges "$DATABASE_URL" | gzip -9 > "$DAILY"
gzip -t "$DAILY"

if [[ "$(date -u +%u)" == "7" ]]; then cp -- "$DAILY" "$ROOT/weekly/"; fi
if [[ "$(date -u +%d)" == "01" ]]; then cp -- "$DAILY" "$ROOT/monthly/"; fi

find "$ROOT/daily" -type f -name 'backup_*.sql.gz' -mtime +"${DAILY_RETENTION_DAYS:-7}" -delete
find "$ROOT/weekly" -type f -name 'backup_*.sql.gz' -mtime +"${WEEKLY_RETENTION_DAYS:-28}" -delete
find "$ROOT/monthly" -type f -name 'backup_*.sql.gz' -mtime +"${MONTHLY_RETENTION_DAYS:-93}" -delete
echo "Sauvegarde PostgreSQL créée : $DAILY"
