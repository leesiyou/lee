#!/bin/sh
# ============================================================
# Post-build route & artifact check — runs AFTER npm run build.
# Fails hard (exit 1) on any missing artifact. No catch/skip.
#
# Checks:
#   1. dist/server/entry.mjs exists
#   2. WeChat material page route in SSR manifest
#   3. WeChat material API route in SSR manifest
#   4. Today's H5 (h5/<date>/<slug>) entry in build output
# ============================================================
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENTRY="$ROOT/apps/web/dist/server/entry.mjs"
CLIENT="$ROOT/apps/web/dist/client"
TODAY="$(date +%Y-%m-%d)"
H5_PATH="h5/$TODAY/104-print-lab"

fail() {
  printf 'POST_BUILD=FAIL %s\n' "$*" >&2
  exit 1
}

# 1. SSR entry must exist
[ -f "$ENTRY" ] || fail "dist/server/entry.mjs missing (run npm run build first)"

# 2. WeChat material page route must be registered in the SSR manifest
grep -Fq '"route": "/wechat/material/[slug]"' "$ENTRY" \
  || fail "wechat material page route NOT in SSR manifest"
grep -Fq '"component": "src/pages/wechat/material/[slug].astro"' "$ENTRY" \
  || fail "wechat material page component NOT in SSR manifest"

# 3. WeChat material API route must be registered
grep -Fq '"route": "/api/wechat/material/[slug]"' "$ENTRY" \
  || fail "wechat material API route NOT in SSR manifest"
grep -Fq '"component": "src/pages/api/wechat/material/[slug].ts"' "$ENTRY" \
  || fail "wechat material API component NOT in SSR manifest"

# 4. Today's H5 must be present in the static client build
[ -f "$CLIENT/$H5_PATH/index.html" ] \
  || fail "H5 $H5_PATH/index.html NOT in build output"
[ -f "$CLIENT/$H5_PATH/css/style.css" ] \
  || fail "H5 $H5_PATH/css/style.css NOT in build output"
[ -f "$CLIENT/$H5_PATH/js/main.js" ] \
  || fail "H5 $H5_PATH/js/main.js NOT in build output"
[ -f "$CLIENT/$H5_PATH/js/lib/three.module.js" ] \
  || fail "H5 three.module.js NOT in build output"
[ -f "$CLIENT/$H5_PATH/assets/logo.webp" ] \
  || fail "H5 logo.webp NOT in build output"
[ -f "$CLIENT/$H5_PATH/assets/poster-01.webp" ] \
  || fail "H5 poster-01.webp NOT in build output"

printf 'POST_BUILD=PASS entry=%s h5=%s\n' "$ENTRY" "$H5_PATH"
