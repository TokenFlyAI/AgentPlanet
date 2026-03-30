# Tokenfly Agent Team Lab — Production Container Image
# Quinn (Cloud Engineer) — 2026-03-29
#
# Build: docker build -t tokenfly-app -f infrastructure/docker/Dockerfile .
# Run:   docker run -p 3100:3100 -v /data:/data tokenfly-app
#
# Agent state (agents/, public/ runtime data) lives on EFS at /data.
# Static templates in public/ are baked into the image for initial scaffold only.

FROM node:20-alpine AS deps

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force


FROM node:20-alpine AS runtime

# Security: run as non-root
RUN addgroup -S tokenfly && adduser -S tokenfly -G tokenfly

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY server.js .
COPY backend/ ./backend/
COPY index_lite.html .

# Copy static public templates (runtime data will overlay from EFS mount)
COPY public/ ./public/

# Runtime config
ENV PORT=3100
ENV DIR=/data
ENV NODE_ENV=production

# /data is the EFS mount point — agent state lives here
# This VOLUME declaration is documentation; actual mount is via ECS task definition
VOLUME ["/data"]

EXPOSE 3100

USER tokenfly

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3100/api/health || exit 1

CMD ["node", "server.js", "--port", "3100", "--dir", "/data"]
