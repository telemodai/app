#!/usr/bin/env bash
# Wait until Postgres accepts queries as tgmoderator (cluster up + user/db from start.sh).
set -euo pipefail

DATABASE_URL="${DATABASE_URL:-postgresql://tgmoderator:tgmoderator@localhost:5432/tgmoderator}"
export PGPASSWORD="${PGPASSWORD:-tgmoderator}"

host="localhost"
port="5432"
user="tgmoderator"
db="tgmoderator"
max_attempts="${WAIT_POSTGRES_ATTEMPTS:-90}"
attempt=0

echo "wait-postgres: waiting for ${user}@${host}:${port}/${db} (max ${max_attempts}s)..."

while (( attempt < max_attempts )); do
  if psql -h "$host" -p "$port" -U "$user" -d "$db" -v ON_ERROR_STOP=1 -qc "SELECT 1" >/dev/null 2>&1; then
    echo "wait-postgres: ready"
    exit 0
  fi
  attempt=$((attempt + 1))
  sleep 1
done

echo "wait-postgres: timed out after ${max_attempts}s" >&2
exit 1
