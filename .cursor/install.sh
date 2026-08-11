#!/usr/bin/env bash
# Build snapshot: Postgres 17 + Bun + deps + migrated DB.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

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
# Official opt-out: https://github.com/nuxt/telemetry#opting-out
bunx nuxt-telemetry disable

bash .cursor/start.sh
