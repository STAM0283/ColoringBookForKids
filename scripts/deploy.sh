#!/usr/bin/env bash
set -Eeuo pipefail

APP_ROOT="${APP_ROOT:-/var/www/lepetitcrayon/current}"
cd "$APP_ROOT"
if [[ ! -f .env ]]; then echo "Configuration absente : $APP_ROOT/.env" >&2; exit 1; fi
set -a
source .env
set +a
export NODE_ENV=production APP_ENV=production

git pull --ff-only
npm ci --include=dev
npm run env:check
npm run db:migrate
npm run db:seed
npm run build
npm prune --omit=dev
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save
healthy=false
for _ in {1..20}; do
  if curl --fail --silent --max-time 3 http://127.0.0.1:3000/api/health >/dev/null; then healthy=true; break; fi
  sleep 2
done
if [[ "$healthy" != "true" ]]; then
  echo "L’application ne répond pas après le déploiement. Consultez pm2 logs lepetitcrayon." >&2
  exit 1
fi
echo "Déploiement terminé avec succès."
