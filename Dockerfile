# Tokenfly Agent Team Lab — Dashboard Container
# Builds server.js + pm2 runtime with native better-sqlite3 support.
#
# agents/ and public/ are NOT baked in — mount them at runtime via docker-compose
# so the container sees live agent state without rebuilds.

# ── Stage 1: build native deps ───────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 2: runtime image ───────────────────────────────────────────────────
FROM node:20-alpine AS runtime

# Install pm2 globally for process management
RUN npm install -g pm2@latest --omit=dev && npm cache clean --force

WORKDIR /app

# Copy native modules compiled in builder stage
COPY --from=builder /build/node_modules ./node_modules

# Copy application source (static files only — agents/ and public/ are volume-mounted)
COPY server.js ecosystem.config.js ./
COPY backend/ ./backend/
COPY scripts/ ./scripts/
COPY package.json ./

# Runtime logs dir (writable; can be volume-mounted to expose to host)
RUN mkdir -p /tmp/aicompany_runtime_logs

# Expose dashboard port
EXPOSE 3199

ENV NODE_ENV=production \
    PORT=3199

# Use pm2-runtime (foreground-aware, no daemon) to run the dashboard process.
# Only starts the "dashboard" app from ecosystem.config.js (not healthcheck/heartbeat
# monitors which expect host filesystem paths).
CMD ["pm2-runtime", "ecosystem.config.js", "--only", "dashboard"]
