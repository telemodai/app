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

INSTALL_MARKER="/tmp/cursor/install-complete"
DAEMON_JSON=/etc/docker/daemon.json

fuse_overlayfs_ready() {
  dpkg -s fuse-overlayfs 2>/dev/null | grep -q 'Status: install ok installed'
}

docker_uses_fuse_overlayfs() {
  sudo docker info 2>/dev/null | grep -Fq 'Storage Driver: fuse-overlayfs'
}

# Platform may run `start` in parallel with `install`. Wait until install has
# written daemon.json and configured fuse-overlayfs, or until install finishes.
for _ in $(seq 1 120); do
  if [[ -f "$INSTALL_MARKER" ]]; then
    break
  fi
  if sudo test -f "$DAEMON_JSON" && fuse_overlayfs_ready; then
    break
  fi
  sleep 1
done

# --- 1. Start the Docker daemon with fuse-overlayfs. ---
# The VM has no systemd (PID 1 is tini), so launch dockerd directly and detach it.
# If dockerd already started with overlay2 (race with install), restart it.
need_docker_restart=false
if sudo test -S /var/run/docker.sock; then
  if ! docker_uses_fuse_overlayfs; then
    need_docker_restart=true
  fi
else
  need_docker_restart=true
fi

if $need_docker_restart; then
  sudo pkill -x dockerd 2>/dev/null || true
  sleep 1
  sudo rm -f /var/run/docker.sock
  sudo nohup dockerd >/tmp/dockerd.log 2>&1 &
fi

for _ in $(seq 1 60); do
  sudo test -S /var/run/docker.sock && docker_uses_fuse_overlayfs && break
  sleep 1
done

if ! docker_uses_fuse_overlayfs; then
  echo "Docker did not start with fuse-overlayfs storage driver — see /tmp/dockerd.log" >&2
  exit 1
fi

# --- 2. Start Postgres from docker-compose.yml (image/version pinned there). ---
sudo docker compose up -d

# --- 3. Wait for Postgres to accept connections, then migrate (idempotent). ---
for _ in $(seq 1 60); do
  sudo docker exec tg-moderator-postgres pg_isready -U tgmoderator -d tgmoderator >/dev/null 2>&1 && break
  sleep 1
done
bun run db:migrate
