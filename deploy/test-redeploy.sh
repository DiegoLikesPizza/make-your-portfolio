#!/usr/bin/env bash
#
# Exercises deploy/redeploy.sh against a throwaway repository, with everything
# that would build or restart a real app stubbed out:
#
#   - a deploy creates a release and points `live` at it
#   - only the newest releases are kept
#   - a release that fails its health check is rolled back, and the deploy fails
#   - npm rewriting package-lock.json never stops the next deploy, but a file
#     edited on the box does
#   - no release carries an env file or is readable by other users, including
#     releases left from before
#   - a ref that isn't a full commit id is refused
#
#   bash deploy/test-redeploy.sh
#
# Needs Linux (symlinks, flock, GNU mv), so it runs in CI.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

failures=0
check() {
  local label="$1"; shift
  if "$@"; then echo "PASS $label"; else echo "FAIL $label"; failures=$((failures + 1)); fi
}

# --- stubs --------------------------------------------------------------------
mkdir -p "$work/bin"
cat > "$work/bin/npm" <<'STUB'
#!/usr/bin/env bash
# `npm install` rewrites the lockfile, as it does on the box. `npm run build`
# produces a "server" that records which commit it was built from.
if [[ "$1" == "install" ]]; then
  echo "linux-only optional package" >> package-lock.json
fi
if [[ "$*" == "run build" ]]; then
  mkdir -p .next/standalone .next/static
  git rev-parse HEAD > .next/standalone/server.js
  # next build copies .env into the standalone output; here it's world-readable too.
  (umask 022 && echo "AUTH_SECRET=not-for-releases" > .next/standalone/.env)
fi
STUB
printf '#!/usr/bin/env bash\n' > "$work/bin/npx"
printf '#!/usr/bin/env bash\necho "$*" >> "$PM2_LOG"\n' > "$work/bin/pm2"
printf '#!/usr/bin/env bash\n[[ "${HEALTH:-up}" == up ]]\n' > "$work/bin/curl"
chmod +x "$work/bin/"*

# --- repositories: an origin, a clone to push from, and the app being deployed -
git init -q --bare -b main "$work/origin.git"
git clone -q "$work/origin.git" "$work/dev" 2>/dev/null
git -C "$work/dev" config user.email test@example.com
git -C "$work/dev" config user.name test
mkdir -p "$work/dev/deploy" "$work/dev/public"
cp "$here/start.sh" "$work/dev/deploy/start.sh"
touch "$work/dev/public/robots.txt"
echo '{"lockfileVersion": 3}' > "$work/dev/package-lock.json"

commit() {
  echo "$1" > "$work/dev/version.txt"
  git -C "$work/dev" add -A
  git -C "$work/dev" commit -qm "$1"
  git -C "$work/dev" push -q origin HEAD:main
}

commit one
git clone -q "$work/origin.git" "$work/app" 2>/dev/null
# A release left by an earlier deploy, before env files were kept out.
old_release="$work/app/releases/19700101T000000000000000-old"
(umask 022 && mkdir -p "$old_release" && echo "AUTH_SECRET=old" > "$old_release/.env" && echo "AUTH_SECRET=backup" > "$old_release/.env.backup")

deploy() {
  PATH="$work/bin:$PATH" APP_DIR="$work/app" LOCK_FILE="$work/deploy.lock" \
    PM2_LOG="$work/pm2.log" HEALTH_ATTEMPTS=1 bash "$here/redeploy.sh" "$@" >/dev/null 2>&1
}
live_commit() { cat "$work/app/live/server.js"; }
origin_main() { git -C "$work/dev" rev-parse HEAD; }
releases() { ls -1d "$work/app/releases"/*/ | wc -l; }

# --- a first deploy -----------------------------------------------------------
deploy
check "a deploy points live at a release" test -L "$work/app/live"
check "the live release is the commit on main" test "$(live_commit)" = "$(origin_main)"
check "the release carries the static files" test -f "$work/app/live/public/robots.txt"
check "start.sh is installed at the app root" test -x "$work/app/start.sh"
check "pm2 was restarted" grep -q "restart" "$work/pm2.log"
check "the new release carries no env file" test ! -e "$work/app/live/.env"
check "an older release's env files are removed" test -z "$(find "$old_release" -name '.env*' -print -quit)"
check "no release is readable by other users" \
  test -z "$(find "$work/app/releases" \( -type f -o -type d \) -perm -o=r -print -quit)"

# --- more deploys: only the newest releases stay ------------------------------
for version in two three four; do
  commit "$version"
  deploy
done
check "live follows main" test "$(live_commit)" = "$(origin_main)"
check "the newest 3 releases are kept" test "$(releases)" -eq 3

# --- npm's lockfile rewrite doesn't block a deploy that changes the lockfile ---
echo '{"lockfileVersion": 3, "changed": true}' > "$work/dev/package-lock.json"
commit five
deploy || true
check "a deploy that changes the lockfile still goes out" test "$(live_commit)" = "$(origin_main)"
check "the lockfile is left as committed" git -C "$work/app" diff --quiet -- package-lock.json

# --- a file edited on the box still stops a deploy ---------------------------
echo "edited on the box" >> "$work/app/version.txt"
commit six
if deploy; then status=0; else status=$?; fi
check "a file edited on the box stops the deploy" test "$status" -ne 0
check "and nothing new goes live" test "$(live_commit)" != "$(origin_main)"
git -C "$work/app" checkout --quiet -- version.txt

# --- a release that fails its health check -----------------------------------
good="$(live_commit)"
commit broken
: > "$work/pm2.log"
if HEALTH=down deploy; then status=0; else status=$?; fi
check "a failed health check fails the deploy" test "$status" -ne 0
check "live goes back to the last good release" test "$(live_commit)" = "$good"
check "pm2 restarted onto the new release and back" test "$(grep -c restart "$work/pm2.log")" -eq 2

# --- refusing refs -------------------------------------------------------------
if deploy "main; rm -rf /"; then status=0; else status=$?; fi
check "a ref that isn't a commit id is refused" test "$status" -eq 2

echo
if [[ "$failures" -eq 0 ]]; then echo "all deploy script checks passed"; else echo "$failures deploy script check(s) failed"; exit 1; fi
