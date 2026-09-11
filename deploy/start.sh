#!/usr/bin/env bash
# Loads .env into the process before starting Next.
#
# Next's standalone server resolves .env relative to server.js
# (.next/standalone/), not the project root, so variables placed in the project
# .env were silently ignored in production. That is how every magic link ended
# up pointing at https://localhost:3004 — Auth.js never saw AUTH_URL and fell
# back to the server's own bind address.
#
# Serves the release that `live` points at (see deploy/redeploy.sh). Node
# resolves the symlink when it starts, so a running server keeps reading its own
# release after `live` moves on. Before the first deploy that creates a release,
# it falls back to the in-place build.
#
# Installed at <app>/start.sh and run by pm2; redeploy.sh refreshes that copy.
set -a
. "$(dirname "$0")/.env"
set +a

server="$(dirname "$0")/live/server.js"
[ -f "$server" ] || server="$(dirname "$0")/.next/standalone/server.js"
exec /opt/node22/bin/node "$server"
