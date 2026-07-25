#!/bin/sh
set -e

# Nuxt reads runtimeConfig.public.appName from NUXT_PUBLIC_APP_NAME at container start.
if [ -n "${APP_NAME:-}" ]; then
  export NUXT_PUBLIC_APP_NAME="${APP_NAME}"
fi

# Same for deployment mode (server uses DEPLOYMENT_MODE; client uses runtimeConfig.public.deploymentMode).
if [ -n "${DEPLOYMENT_MODE:-}" ]; then
  export NUXT_PUBLIC_DEPLOYMENT_MODE="${DEPLOYMENT_MODE}"
fi

echo "Applying database migrations..."
node scripts/db-migrate.mjs

echo "Starting application..."
exec node .output/server/index.mjs
