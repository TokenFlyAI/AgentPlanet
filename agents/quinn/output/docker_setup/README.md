# Tokenfly — Docker Setup

Container packaging for the Tokenfly Agent Team Lab dashboard server.

---

## Prerequisites

- Docker 20.10+ and Docker Compose v2 (or `docker compose`)
- Run all commands from the **`aicompany/` root directory** (where `server.js` lives)

---

## Quick Start

```bash
# From aicompany/ root:
docker compose -f agents/quinn/output/docker_setup/docker-compose.yml up
```

Open `http://localhost:3100` in your browser.

To run in the background:
```bash
docker compose -f agents/quinn/output/docker_setup/docker-compose.yml up -d
```

---

## Build Only

```bash
docker build \
  -f agents/quinn/output/docker_setup/Dockerfile \
  -t tokenfly:latest \
  .
```

---

## Run Without Compose

```bash
docker run -d \
  --name tokenfly-server \
  -p 3100:3100 \
  -v "$(pwd)/agents:/app/agents" \
  -v "$(pwd)/public:/app/public" \
  tokenfly:latest
```

---

## Stop & Clean Up

```bash
# Stop
docker compose -f agents/quinn/output/docker_setup/docker-compose.yml down

# Remove image too
docker compose -f agents/quinn/output/docker_setup/docker-compose.yml down --rmi local
```

---

## Architecture

```
aicompany/
├── server.js            # Entry point — baked into image
├── backend/             # API middleware — baked into image
├── index_lite.html      # Dashboard UI — baked into image
├── agents/              # Agent state — VOLUME MOUNTED (read/write)
└── public/              # Shared config — VOLUME MOUNTED (read/write)
```

**Why volumes?**
Agent state (`agents/`) and shared config (`public/`) are written at runtime by
agent processes running on the host. Baking them into the image would freeze state
at build time. Volume mounts let the container server and host agents share the
same live filesystem.

---

## Health Check

The container exposes a health check at `GET /api/health`.
Docker will mark the container unhealthy if this endpoint doesn't respond within 5s.

```bash
curl http://localhost:3100/api/health
```

---

## Environment Variables

| Variable     | Default      | Description                        |
|--------------|--------------|------------------------------------|
| `NODE_ENV`   | `production` | Node.js environment                |
| `PORT`       | `3100`       | Set via CMD args (not env var)     |

The server reads `--port` and `--dir` from CLI args (`CMD` in Dockerfile).

---

## Notes

- Runs as non-root user `tokenfly` inside the container (security best practice).
- Node.js 20 Alpine base — minimal image size (~50 MB uncompressed).
- Only production dependencies are installed (`npm ci --omit=dev`).
- For cloud deployment (AWS ECS + EFS), see `infrastructure/` Terraform modules.
