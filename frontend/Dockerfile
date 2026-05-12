# ── Stage 1: Build ──────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY . .
RUN npm run build

# ── Stage 2: Serve ──────────────────────────────────────
FROM caddy:2.10-alpine AS caddy-stage

# Strip cap_net_bind_service. The Caddy image sets this so it can bind <1024,
# but OpenShift's restricted-v2 SCC sets no_new_privs (allowPrivilegeEscalation: false),
# which makes the kernel refuse to exec a file-capable binary as non-root.
# We bind to 2015, not 80/443, so the capability is unused weight anyway.
RUN apk add --no-cache libcap && setcap -r /usr/bin/caddy && apk del libcap

EXPOSE 2015
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/dist /srv
