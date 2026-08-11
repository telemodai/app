#!/usr/bin/env bash
# Per-boot: dockerd (no systemd) → Postgres → migrations. Dev server is in terminals.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
export DATABASE_URL="postgresql://tgmoderator:tgmoderator@localhost:5432/tgmoderator"

if ! sudo test -S /var/run/docker.sock; then
  sudo nohup dockerd >/tmp/dockerd.log 2>&1 &
  until sudo test -S /var/run/docker.sock; do sleep 1; done
fi

sudo docker compose up -d
until sudo docker exec tg-moderator-postgres pg_isready -U tgmoderator -d tgmoderator; do sleep 1; done
bun run db:migrate
