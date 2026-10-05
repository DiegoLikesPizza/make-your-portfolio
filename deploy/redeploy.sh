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
# the service. If the new release doesn't answer, `live` goes back to the previous one.
#
# deploy/test-redeploy.sh exercises all of this in CI.
set -euo pipefail

# Everything a deploy creates, releases included, is private to the app's user:
# nginx only proxies to the app, so nobody else on the box needs to read it.
umask 027

APP_DIR="${APP_DIR:-/srv/websites/make-your-portfolio.lfdiego.xyz/app}"
APP_USER="${APP_USER:-portfolio}"
SERVICE="${SERVICE:-make-your-portfolio}"
# Legacy root pm2 app, migrated away from on the first systemd deploy (see below).
PM2_APP="${PM2_APP:-make-your-portfolio}"
# How the app is (re)started. Overridable so deploy/test-redeploy.sh can stub it.
RESTART_CMD="${RESTART_CMD:-systemctl restart $SERVICE}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3004/signin}"
HEALTH_ATTEMPTS="${HEALTH_ATTEMPTS:-30}"
KEEP_RELEASES="${KEEP_RELEASES:-3}"
LOCK_FILE="${LOCK_FILE:-/tmp/make-your-portfolio-deploy.lock}"
export PATH="/opt/node22/bin:$PATH"

# User/unit/chown steps only make sense as root on the box; skipped in CI.
is_root() { [ "$(id -u)" = 0 ]; }

# Create the unprivileged service user and install/refresh the systemd unit,
# idempotently. A no-op off the box (e.g. in test-redeploy.sh).
ensure_service() {
  is_root || return 0
  id "$APP_USER" >/dev/null 2>&1 || \
    useradd --system --no-create-home --home-dir "$APP_DIR" --shell /usr/sbin/nologin "$APP_USER"
  local src="$APP_DIR/deploy/make-your-portfolio.service"
  local dst="/etc/systemd/system/${SERVICE}.service"
  if [ -f "$src" ] && ! cmp -s "$src" "$dst"; then
    install -m 644 "$src" "$dst"
    systemctl daemon-reload
    systemctl enable "$SERVICE" >/dev/null 2>&1 || true
  fi
}

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

# next build copies .env into the standalone output, and start.sh loads the app
# root's .env anyway, so a release never needs a copy of the secrets. Releases
# from before this check are cleaned up and closed off too.
rm -f releases/*/.env releases/*/.env.*
chmod -R go-rwx releases

# The service runs as $APP_USER, so it must own its releases to read them and to
# write the Next cache inside the current one. go-rwx above keeps everyone else
# out. Root-only; a no-op in CI, where the app runs as whoever invoked the test.
if is_root && id "$APP_USER" >/dev/null 2>&1; then
  chown -R "$APP_USER:$APP_USER" releases
  chown "$APP_USER:$APP_USER" .env 2>/dev/null || true
fi

# systemd runs the app root's copy of start.sh; keep it in step with the repo's.
install -m 755 deploy/start.sh start.sh

# Make sure the service user and unit exist before we (re)start the service.
ensure_service

previous="$(readlink live 2>/dev/null || true)"

point_live_at() {
  # A new link renamed over the old one, so `live` is never missing, even briefly.
  ln -sfn "$1" live.next
  mv -Tf live.next live
  # One-time migration: free 127.0.0.1:3004 from the old root pm2 process the
  # first time we deploy under systemd. A no-op once pm2 no longer owns it.
  if is_root && command -v pm2 >/dev/null 2>&1 && pm2 describe "$PM2_APP" >/dev/null 2>&1; then
    pm2 delete "$PM2_APP" >/dev/null 2>&1 || true
    pm2 save >/dev/null 2>&1 || true
  fi
  $RESTART_CMD
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
