FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS builder
WORKDIR /app
COPY . .
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_INSTAGRAM_URL=https://www.instagram.com/lena.stam.coloringbook
ARG GOOGLE_SITE_VERIFICATION
ENV NODE_ENV=production \
    APP_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_INSTAGRAM_URL=${NEXT_PUBLIC_INSTAGRAM_URL} \
    GOOGLE_SITE_VERIFICATION=${GOOGLE_SITE_VERIFICATION} \
    AUTH_SECRET=build-only-secret-that-is-never-used-at-runtime \
    AUTH_TRUST_HOST=true \
    ADMIN_EMAIL=build@lepetitcrayon.invalid \
    ADMIN_PASSWORD=Build-only-password-123! \
    DATABASE_PATH=/tmp/build/database/site.db \
    MEDIA_ROOT=/tmp/build/media \
    BACKUP_ROOT=/tmp/build/backups \
    STORAGE_CAPACITY_BYTES=5368709120
RUN npm run build

FROM node:22-bookworm-slim AS production-dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    APP_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates gosu \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs --home-dir /app nextjs
COPY --from=production-dependencies --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/src/db/migrations ./deploy/migrations
COPY --from=builder --chown=nextjs:nodejs /app/deploy/check-env.cjs /app/deploy/runtime-init.cjs ./deploy/
COPY --chown=root:root deploy/railway-entrypoint.sh /usr/local/bin/railway-entrypoint
RUN chmod 755 /usr/local/bin/railway-entrypoint
EXPOSE 3000
ENTRYPOINT ["railway-entrypoint"]
CMD ["node", "server.js"]
