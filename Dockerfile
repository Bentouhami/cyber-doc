# ---------- Base de build ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Installe dépendances système si nécessaire (fonts wkhtmltopdf etc. si tu génères des PDF côté Node)
# RUN apk add --no-cache ...

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* .npmrc* ./
# Choisis ton gestionnaire (ex: npm ci)
RUN npm ci

# ---------- Build ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de build (si besoin)
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_TELEMETRY_DISABLED=1

# Génère le client Prisma (nécessaire au build si importé côté server)
RUN npx prisma generate

# Build Next.js en mode standalone
RUN npm run build

# ---------- Runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

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

# Script d’entrée (migrate + start)
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/entrypoint.sh"]
