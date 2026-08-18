#!/usr/bin/env bash
set -Eeuo pipefail
umask 027
APP_ROOT=/var/www/app/site
ENV_FILE="$APP_ROOT/shared/.env.production"
RELEASE="${APP_ROOT}/releases/$(date +%Y%m%d-%H%M%S)"
PREVIOUS="$(readlink -f "$APP_ROOT/current" 2>/dev/null || true)"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Configuration absente : $ENV_FILE" >&2
  exit 1
fi
if [[ ! -f artifact.tar.gz || ! -f artifact.tar.gz.sha256 ]]; then
  echo "Artefact ou somme SHA-256 absent." >&2
  exit 1
fi
sha256sum --check artifact.tar.gz.sha256
chmod 600 "$ENV_FILE"

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

export NODE_ENV=production
mkdir -p "$RELEASE" "$(dirname "$DATABASE_PATH")" "$MEDIA_ROOT"/{images,pdf,videos} "$BACKUP_ROOT"
chmod 750 "$APP_ROOT/shared" "$(dirname "$DATABASE_PATH")" "$MEDIA_ROOT" "$BACKUP_ROOT"
tar -xzf artifact.tar.gz -C "$RELEASE"
cd "$RELEASE"
node check-env.cjs
node runtime-init.cjs
ln -sfn "$RELEASE" "$APP_ROOT/current.next"
mv -Tf "$APP_ROOT/current.next" "$APP_ROOT/current"
pm2 startOrReload "$RELEASE/ecosystem.config.cjs" --update-env

healthy=false
for attempt in {1..20}; do
  if curl --fail --silent --show-error --max-time 3 http://127.0.0.1:3000/api/health >/dev/null; then
    healthy=true
    break
  fi
  sleep 2
done

if [[ "$healthy" != "true" ]]; then
  echo "La nouvelle release ne répond pas. Retour à la version précédente." >&2
  if [[ -n "$PREVIOUS" && -d "$PREVIOUS" ]]; then
    ln -sfn "$PREVIOUS" "$APP_ROOT/current.next"
    mv -Tf "$APP_ROOT/current.next" "$APP_ROOT/current"
    pm2 startOrReload "$PREVIOUS/ecosystem.config.cjs" --update-env
  fi
  exit 1
fi

pm2 save
find "$APP_ROOT/releases" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -nr | tail -n +6 | cut -d' ' -f2- | xargs -r rm -rf
