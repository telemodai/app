#!/usr/bin/env bash
# Cloud Agent START script.
#
# Runs on every VM boot. Brings up runtime services (Docker daemon + Postgres)
# and applies DB migrations. Must be idempotent and must RETURN — long-running
# foreground processes (dev server, tunnel) live in `terminals`, not here.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Local dev DB connection — NOT a secret. Matches docker-compose.yml credentials.
export DATABASE_URL="postgresql://tgmoderator:tgmoderator@localhost:5432/tgmoderator"

# --- 1. Start the Docker daemon. ---
# The VM has no systemd (PID 1 is tini), so launch dockerd directly and detach it.
if ! sudo test -S /var/run/docker.sock; then
  sudo nohup dockerd >/tmp/dockerd.log 2>&1 &
fi
# Wait for the daemon socket to appear.
for _ in $(seq 1 30); do sudo test -S /var/run/docker.sock && break; sleep 1; done

# --- 2. Start Postgres from docker-compose.yml (image/version pinned there). ---
sudo docker compose up -d

# --- 3. Wait for Postgres to accept connections, then migrate (idempotent). ---
for _ in $(seq 1 60); do
  sudo docker exec tg-moderator-postgres pg_isready -U tgmoderator -d tgmoderator >/dev/null 2>&1 && break
  sleep 1
done
bun run db:migrate
