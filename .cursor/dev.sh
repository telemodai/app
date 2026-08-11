#!/usr/bin/env bash
# Cloud dev terminal: wait for Postgres, migrate, then Nuxt dev (port 3001).
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
export DATABASE_URL="${DATABASE_URL:-postgresql://tgmoderator:tgmoderator@localhost:5432/tgmoderator}"

bash .cursor/wait-postgres.sh
exec bun run dev
