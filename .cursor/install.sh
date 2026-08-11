#!/usr/bin/env bash
# Cloud Agent INSTALL script.
#
# Runs once when a Build is created. Its result (installed tools, pulled Docker
# images, migrated DB volume) is baked into the Build's disk snapshot, so future
# agents boot from a ready-to-use machine and do NOT re-run this.
#
# Must be idempotent: it may re-run on already-prepared disk state.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# --- 1. Bun: the JS runtime + package manager this project uses (not npm/yarn). ---
if ! command -v bun >/dev/null 2>&1; then
  curl -fsSL https://bun.sh/install | bash
fi
# Exported env vars do NOT survive a reboot, but /usr/local/bin does. Symlink so
# `bun` is on PATH for the per-boot `start` script and the `terminals`.
sudo ln -sf "$HOME/.bun/bin/bun" /usr/local/bin/bun
sudo ln -sf "$HOME/.bun/bin/bunx" /usr/local/bin/bunx

# --- 2. Docker: Postgres runs in a container (version pinned in docker-compose.yml). ---
# Docker runs *nested* inside the Cloud Agent VM, so the default overlay2 storage
# driver fails. fuse-overlayfs + legacy iptables are the documented fix.
if ! command -v docker >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    docker.io docker-compose-v2 fuse-overlayfs iptables uidmap
fi
sudo mkdir -p /etc/docker
echo '{ "storage-driver": "fuse-overlayfs" }' | sudo tee /etc/docker/daemon.json >/dev/null
sudo update-alternatives --set iptables /usr/sbin/iptables-legacy || true
sudo update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy || true
sudo groupadd -f docker
sudo usermod -aG docker "$USER"

# --- 3. Project dependencies (postinstall also runs `nuxt prepare`). ---
bun install

# --- 4. Bake the Postgres image + migrated schema into the Build. ---
# Reuse the per-boot script so the first agent boot is fast: the image is already
# pulled and the schema is already applied. Safe to run here and on every boot.
bash "$REPO_ROOT/.cursor/start.sh"
