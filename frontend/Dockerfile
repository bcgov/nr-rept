# ── Stage 1: Build ──────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY . .
RUN npm run build

# ── Stage 2: Serve ──────────────────────────────────────
FROM caddy:2.10-alpine AS caddy-stage

EXPOSE 2015
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/dist /srv
