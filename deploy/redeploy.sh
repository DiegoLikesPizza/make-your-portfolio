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
#
# No downtime while building: the server runs whatever `live` points at, a copy
# of a standalone build under releases/. A deploy builds while that release keeps
# serving, copies the result into a new release, swaps the symlink and restarts
# pm2. If the new release doesn't answer, `live` goes back to the previous one.
#
# deploy/test-redeploy.sh exercises all of this in CI.
set -euo pipefail

APP_DIR="${APP_DIR:-/srv/websites/make-your-portfolio.lfdiego.xyz/app}"
PM2_APP="${PM2_APP:-make-your-portfolio}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3004/signin}"
HEALTH_ATTEMPTS="${HEALTH_ATTEMPTS:-30}"
KEEP_RELEASES="${KEEP_RELEASES:-3}"
LOCK_FILE="${LOCK_FILE:-/tmp/make-your-portfolio-deploy.lock}"
export PATH="/opt/node22/bin:$PATH"

REF="${1:-${SSH_ORIGINAL_COMMAND:-}}"

# Only ever a full commit id. This string can arrive over SSH, and it reaches git.
if [[ -n "$REF" && ! "$REF" =~ ^[0-9a-f]{40}$ ]]; then
  echo "redeploy: refusing ref: ${REF}" >&2
  exit 2
fi

cd "$APP_DIR"

# One deploy at a time: two builds writing .next at once corrupt each other.
exec 9>"$LOCK_FILE"
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

# npm rewrites package-lock.json on every install here (see below), and that
# rewrite isn't an edit made on the box. Left in place, it would stop the
# fast-forward of any commit that changes the lockfile.
git checkout --quiet -- package-lock.json

# Fast-forward only. Anything edited in place on the box stops the deploy
# instead of being silently overwritten.
git merge --ff-only --quiet "$TARGET"
echo "redeploy: at $(git log --oneline -1)"

# The same steps as the manual recipe in the README, which explains the ones
# that look optional and are not (npm install rather than ci, prisma generate).
# The site keeps serving throughout: it runs from releases/, not from .next.
npm install --no-audit --no-fund
# The committed lockfile is generated on Windows and lacks Linux-only optional
# packages, so `npm ci` fails and install adds them to the file. Put it back, so
# the working tree stays as committed between deploys.
git checkout --quiet -- package-lock.json
npx prisma generate
npx prisma migrate deploy
npm run build

# A new release: the standalone server plus the files it serves but doesn't
# bundle. Named time-first, so sorting names sorts releases.
release="releases/$(date -u +%Y%m%dT%H%M%S%N)-$(git rev-parse --short HEAD)"
mkdir -p "$release/.next"
cp -R .next/standalone/. "$release/"
cp -R public "$release/public"
cp -R .next/static "$release/.next/static"

# pm2 runs the app root's copy of start.sh; keep it in step with the repo's.
install -m 755 deploy/start.sh start.sh

previous="$(readlink live 2>/dev/null || true)"

point_live_at() {
  # A new link renamed over the old one, so `live` is never missing, even briefly.
  ln -sfn "$1" live.next
  mv -Tf live.next live
  pm2 restart "$PM2_APP" --update-env
}

healthy() {
  local attempt
  for attempt in $(seq 1 "$HEALTH_ATTEMPTS"); do
    if curl -fsS -o /dev/null "$HEALTH_URL"; then
      echo "redeploy: healthy after ${attempt}s"
      return 0
    fi
    sleep 1
  done
  return 1
}

point_live_at "$release"

# A restart that comes back broken — a missing AUTH_URL answers every request
# with a 500 — fails the deploy and puts the last good release back.
if ! healthy; then
  echo "redeploy: ${HEALTH_URL} did not answer after switching to ${release}" >&2
  if [[ -n "$previous" ]]; then
    point_live_at "$previous"
    echo "redeploy: rolled back to ${previous}" >&2
  fi
  exit 1
fi

# Keep the newest few for rolling back to. The live one is the newest, so it
# is always kept.
ls -1d releases/*/ | sed 's:/$::' | sort -r | tail -n "+$((KEEP_RELEASES + 1))" | while read -r old; do
  rm -rf "$old"
done

echo "redeploy: live -> ${release}"
