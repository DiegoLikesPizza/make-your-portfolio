#!/usr/bin/env bash
# Loads .env into the process before starting Next.
#
# Next's standalone server resolves .env relative to server.js
# (.next/standalone/), not the project root, so variables placed in the project
# .env were silently ignored in production. That is how every magic link ended
# up pointing at https://localhost:3004 — Auth.js never saw AUTH_URL and fell
# back to the server's own bind address.
#
# Installed at <app>/start.sh and run by pm2.
set -a
. "$(dirname "$0")/.env"
set +a
exec /opt/node22/bin/node "$(dirname "$0")/.next/standalone/server.js"
