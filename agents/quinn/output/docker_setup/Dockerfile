# Tokenfly Agent Team Lab — Container Image
# Quinn (Cloud Engineer) — 2026-03-29
#
# Usage (standalone):
#   docker build -t tokenfly .
#   docker run -p 3100:3100 -v $(pwd)/agents:/app/agents -v $(pwd)/public:/app/public tokenfly
#
# Usage (recommended — see docker-compose.yml):
#   docker-compose up

FROM node:20-alpine AS deps

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force


FROM node:20-alpine AS runtime

# Security: run as non-root user
RUN addgroup -S tokenfly && adduser -S tokenfly -G tokenfly

WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY server.js .
COPY index_lite.html .
COPY backend/ ./backend/

# agents/ and public/ are mounted as volumes at runtime —
# they contain agent state files, task board, and runtime config.
# Declare them as volume mount points.
VOLUME ["/app/agents", "/app/public"]

EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3100/api/health || exit 1

USER tokenfly

CMD ["node", "server.js", "--dir", "/app", "--port", "3100"]
