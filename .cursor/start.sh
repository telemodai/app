#!/usr/bin/env bash
# Per-boot: Postgres cluster + app user/db. Migrations run in dev terminal (dev.sh).
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
export DATABASE_URL="postgresql://tgmoderator:tgmoderator@localhost:5432/tgmoderator"

if ! sudo pg_isready -q; then
  sudo pg_ctlcluster 17 main start
fi
until sudo pg_isready -q; do sleep 1; done

sudo -u postgres psql -v ON_ERROR_STOP=0 -qc "CREATE USER tgmoderator WITH PASSWORD 'tgmoderator';" || true
sudo -u postgres psql -v ON_ERROR_STOP=0 -qc "CREATE DATABASE tgmoderator OWNER tgmoderator;" || true

echo "start.sh: Postgres ready (user/db ensured; migrations run by dev terminal)"
