#!/usr/bin/env bash
# Cloud dev terminal: wait for Postgres, migrate, then Nuxt dev (port 3001).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$ROOT"
export DATABASE_URL="${DATABASE_URL:-postgresql://tgmoderator:tgmoderator@localhost:5432/tgmoderator}"

bash "$SCRIPT_DIR/wait-postgres.sh"
exec bun run dev
