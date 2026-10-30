# ---------- Base de build ----------
FROM node:22-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@12.15.0 --activate

# Installe dépendances système si nécessaire (fonts wkhtmltopdf etc. si tu génères des PDF côté Node)
# RUN apk add --no-cache ...

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# The Prisma schema is copied only in later stages. Lifecycle scripts must not
# run while the dependency layer contains manifests only.
RUN pnpm install --frozen-lockfile --ignore-scripts

# ---------- Build ----------
FROM deps AS builder
WORKDIR /app
COPY . .

# Variables de build (si besoin)
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_TELEMETRY_DISABLED=1

# Génère le client Prisma (nécessaire au build si importé côté server)
RUN pnpm exec prisma generate

# Build Next.js en mode standalone
RUN pnpm run build

# ---------- Database migrator ----------
# Keep schema changes as an explicit, fail-fast deployment step. The lean
# standalone application image intentionally does not contain the Prisma CLI.
FROM deps AS migrator
WORKDIR /app
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN pnpm exec prisma generate
CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]

# ---------- Runner ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# PDF generation is a runtime feature. Keep Chromium and its font/runtime
# libraries in the final image rather than relying on a CI-host browser cache.
RUN apk add --no-cache \
    ca-certificates \
    chromium \
    freetype \
    harfbuzz \
    nss \
    font-freefont

# Répertoire persistant pour les documents générés
# (monté en volume via docker-compose)
RUN mkdir -p /app/storage && chown -R node:node /app/storage

# Copie l'output standalone
COPY --from=builder /app/.next/standalone ./
# Static & public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Prisma schema si standalone le requiert au runtime (utile avec edge cases)
COPY --from=builder /app/prisma ./prisma

# Minimal application entrypoint. Migrations are executed by the dedicated
# migrator target before this container starts.
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/entrypoint.sh"]
