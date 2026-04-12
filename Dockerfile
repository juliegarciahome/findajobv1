# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS builder
WORKDIR /app
COPY . .
# Client bundle embeds NEXT_PUBLIC_* at build time
ARG NEXT_PUBLIC_APP_URL=http://localhost:3005
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
# next build evaluates server modules; env schema requires these at build time (no DB connection)
ENV DATABASE_URL=postgresql://postgres:postgres@postgres:5432/career_portal
ENV REDIS_URL=redis://redis:6379
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3005
ENV HOSTNAME=0.0.0.0
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
RUN npx prisma generate
# Playwright needs Chromium for job URL scraping (ingest-processor).
RUN npx playwright install chromium --with-deps
COPY scripts/docker-entrypoint.sh /docker-entrypoint.sh
# Strip CRLF when the repo is checked out on Windows (fixes "no such file or directory" on shebang)
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh
EXPOSE 3005
ENTRYPOINT ["/docker-entrypoint.sh"]
