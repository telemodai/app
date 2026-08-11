#!/usr/bin/env bash
# Cloud agent environment lifecycle: install | start | dev
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DATABASE_URL="${DATABASE_URL:-postgresql://tgmoderator:tgmoderator@localhost:5432/tgmoderator}"

wait_postgres() {
  export PGPASSWORD="${PGPASSWORD:-tgmoderator}"
  local host="localhost"
  local port="5432"
  local user="tgmoderator"
  local db="tgmoderator"
  local max_attempts="${WAIT_POSTGRES_ATTEMPTS:-90}"
  local attempt=0

  echo "cloud: waiting for ${user}@${host}:${port}/${db} (max ${max_attempts}s)..."

  while (( attempt < max_attempts )); do
    if psql -h "$host" -p "$port" -U "$user" -d "$db" -v ON_ERROR_STOP=1 -qc "SELECT 1" >/dev/null 2>&1; then
      echo "cloud: postgres ready"
      return 0
    fi
    attempt=$((attempt + 1))
    sleep 1
  done

  echo "cloud: postgres wait timed out after ${max_attempts}s" >&2
  return 1
}

cmd_install() {
  cd "$ROOT"

  if ! dpkg -s postgresql-17 >/dev/null 2>&1; then
    sudo apt-get update -qq
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq curl ca-certificates gnupg unzip
    sudo install -d /usr/share/postgresql-common/pgdg
    sudo curl -fsSL -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc \
      https://www.postgresql.org/media/keys/ACCC4CF8.asc
    echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt noble-pgdg main" \
      | sudo tee /etc/apt/sources.list.d/pgdg.list >/dev/null
    sudo apt-get update -qq
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql-17
  fi

  if dpkg -s postgresql-17 >/dev/null 2>&1; then
    sudo tee /etc/postgresql/17/main/pg_hba.conf >/dev/null <<'EOF'
local   all   postgres                              peer
local   all   all                                   scram-sha-256
host    all   all   127.0.0.1/32                    scram-sha-256
host    all   all   ::1/128                         scram-sha-256
EOF
    grep -q "listen_addresses = 'localhost'" /etc/postgresql/17/main/postgresql.conf || \
      echo "listen_addresses = 'localhost'" | sudo tee -a /etc/postgresql/17/main/postgresql.conf >/dev/null
    sudo pg_ctlcluster 17 main reload || sudo pg_ctlcluster 17 main start
  fi

  if ! command -v bun >/dev/null 2>&1; then
    curl -fsSL https://bun.sh/install | bash
    sudo ln -sf "$HOME/.bun/bin/bun" /usr/local/bin/bun
    sudo ln -sf "$HOME/.bun/bin/bunx" /usr/local/bin/bunx
  fi

  bun install

  # Cloud dev terminals have no TTY — Nuxt would block on the telemetry consent prompt.
  bunx nuxt-telemetry disable

  cmd_start
}

cmd_start() {
  cd "$ROOT"
  export DATABASE_URL

  if ! sudo pg_isready -q; then
    sudo pg_ctlcluster 17 main start
  fi
  until sudo pg_isready -q; do sleep 1; done

  sudo -u postgres psql -v ON_ERROR_STOP=0 -qc "CREATE USER tgmoderator WITH PASSWORD 'tgmoderator';" || true
  sudo -u postgres psql -v ON_ERROR_STOP=0 -qc "CREATE DATABASE tgmoderator OWNER tgmoderator;" || true

  echo "cloud: postgres bootstrapped (migrations run by dev)"
}

cmd_dev() {
  cd "$ROOT"
  export DATABASE_URL
  wait_postgres
  exec bun run dev
}

usage() {
  echo "usage: cloud.sh install|start|dev" >&2
  exit 1
}

case "${1:-}" in
  install) cmd_install ;;
  start) cmd_start ;;
  dev) cmd_dev ;;
  *) usage ;;
esac
