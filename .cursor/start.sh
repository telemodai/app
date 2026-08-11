#!/usr/bin/env bash
# Per-boot: Postgres cluster + migrations. Dev server runs in terminals.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
export DATABASE_URL="postgresql://tgmoderator:tgmoderator@localhost:5432/tgmoderator"

if ! sudo pg_isready -q; then
  sudo pg_ctlcluster 17 main start
fi
until sudo pg_isready -q; do sleep 1; done

sudo -u postgres psql -v ON_ERROR_STOP=0 -qc "CREATE USER tgmoderator WITH PASSWORD 'tgmoderator';"
sudo -u postgres psql -v ON_ERROR_STOP=0 -qc "CREATE DATABASE tgmoderator OWNER tgmoderator;"

bun run db:migrate
