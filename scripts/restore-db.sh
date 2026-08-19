#!/usr/bin/env bash
set -Eeuo pipefail

BACKUP="${1:-}"
if [[ -z "$BACKUP" || ! -f "$BACKUP" ]]; then
  echo "Usage : $0 backups/database/daily/backup_YYYY-MM-DD_HHMM.sql.gz" >&2
  exit 1
fi
gzip -t "$BACKUP"
if [[ -f .env ]]; then set -a; source .env; set +a; fi
: "${DATABASE_URL:?DATABASE_URL est obligatoire}"
read -r -p "Cette opération remplace les données PostgreSQL. Continuer ? [y/N] " answer
[[ "$answer" =~ ^[yY]$ ]] || exit 1
gunzip -c -- "$BACKUP" | psql -v ON_ERROR_STOP=1 "$DATABASE_URL"
echo "Restauration PostgreSQL terminée."
