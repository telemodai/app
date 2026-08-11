#!/usr/bin/env bash
# Build-time: Bun deps + DB ready in snapshot (start.sh creates role/db + migrates).
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

if ! command -v bun >/dev/null 2>&1; then
  curl -fsSL https://bun.sh/install | bash
fi
sudo ln -sf "$HOME/.bun/bin/bun" /usr/local/bin/bun
sudo ln -sf "$HOME/.bun/bin/bunx" /usr/local/bin/bunx

bun install
bash .cursor/start.sh
