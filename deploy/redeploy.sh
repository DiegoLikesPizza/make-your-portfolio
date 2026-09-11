#!/usr/bin/env bash
#
# Redeploy the app on the box from a commit on main.
#
#   deploy/redeploy.sh [<commit sha>]
#
# Run by .github/workflows/deploy.yml over SSH once CI has passed on main, and
# fine to run by hand. Without a commit it deploys the tip of origin/main.
#
# The deploy key is pinned to this script in authorized_keys with
# command="…/deploy/redeploy.sh", so the key can do nothing else. SSH then passes
# the commit the workflow asked for in SSH_ORIGINAL_COMMAND.
set -euo pipefail

APP_DIR="${APP_DIR:-/srv/websites/make-your-portfolio.lfdiego.xyz/app}"
PM2_APP="${PM2_APP:-make-your-portfolio}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3004/signin}"
export PATH="/opt/node22/bin:$PATH"

REF="${1:-${SSH_ORIGINAL_COMMAND:-}}"

# Only ever a full commit id. This string can arrive over SSH, and it reaches git.
if [[ -n "$REF" && ! "$REF" =~ ^[0-9a-f]{40}$ ]]; then
  echo "redeploy: refusing ref: ${REF}" >&2
  exit 2
fi

cd "$APP_DIR"

# One deploy at a time: two builds writing .next at once corrupt each other.
exec 9>/tmp/make-your-portfolio-deploy.lock
if ! flock -n 9; then
  echo "redeploy: another deploy holds the lock" >&2
  exit 3
fi

git fetch --quiet origin main
TARGET="${REF:-$(git rev-parse origin/main)}"

# Whatever is deployed has been on main, and so through CI and review.
if ! git merge-base --is-ancestor "$TARGET" origin/main; then
  echo "redeploy: ${TARGET} is not on origin/main" >&2
  exit 2
fi

# Fast-forward only. Anything edited in place on the box stops the deploy
# instead of being silently overwritten.
git merge --ff-only --quiet "$TARGET"
echo "redeploy: at $(git log --oneline -1)"

# The same steps as the manual recipe in the README, which explains the ones
# that look optional and are not (npm install rather than ci, prisma generate).
npm install --no-audit --no-fund
npx prisma generate
npx prisma migrate deploy
npm run build
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

pm2 restart "$PM2_APP" --update-env

# A restart that comes back broken — a missing AUTH_URL answers every request
# with a 500 — should fail the deploy, not report success.
for attempt in $(seq 1 30); do
  if curl -fsS -o /dev/null "$HEALTH_URL"; then
    echo "redeploy: healthy after ${attempt}s"
    exit 0
  fi
  sleep 1
done

echo "redeploy: ${HEALTH_URL} did not answer after the restart" >&2
exit 1
