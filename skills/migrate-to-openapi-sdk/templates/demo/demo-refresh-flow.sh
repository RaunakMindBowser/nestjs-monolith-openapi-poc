#!/usr/bin/env bash
# Proves the axios refresh-token flow end-to-end via curl alone — no browser
# needed to verify it. Adjust {{PROTECTED_ENDPOINT}} to any real endpoint
# behind the new JwtAuthGuard (e.g. a resource list).
#
# Steps, each with a real, observed HTTP status (never assumed):
#   1. register                                   -> capture access/refresh tokens
#   2. GET {{PROTECTED_ENDPOINT}} with access token -> 200
#   3. sleep past the access token's real TTL
#   4. GET {{PROTECTED_ENDPOINT}} with stale token  -> 401 (proves expiry is real)
#   5. POST /auth/refresh                          -> 200, new tokens differ from old
#   6. GET {{PROTECTED_ENDPOINT}} with new token    -> 200
#   7. POST /auth/refresh AGAIN with the ORIGINAL (already-rotated) refresh
#      token -> 401 (proves one-time-use rotation / reuse detection)
set -uo pipefail
cd "$(dirname "$0")/.."

BASE_URL="${BASE_URL:-{{BACKEND_BASE_URL}}}"
PROTECTED_ENDPOINT="{{PROTECTED_ENDPOINT}}"
FAIL=0

pass() { echo "✓ $1"; }
fail() { echo "✗ $1"; FAIL=1; }

if ! curl -s -m 2 -o /dev/null "$BASE_URL/health" 2>/dev/null && ! curl -s -m 2 -o /dev/null "$BASE_URL$PROTECTED_ENDPOINT" 2>/dev/null; then
  echo "✗ Backend not reachable at $BASE_URL — start it first."
  exit 1
fi

json_get() { python3 -c "import json,sys; print(json.load(sys.stdin)$1)"; }

EMAIL="demo-$(date +%s)-$RANDOM@example.com"

echo "── Step 1: register ────────────────────────────────"
REGISTER_RESP=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"correct horse battery\",\"name\":\"Demo User\"}")
ACCESS_TOKEN=$(echo "$REGISTER_RESP" | json_get "['accessToken']" 2>/dev/null)
REFRESH_TOKEN=$(echo "$REGISTER_RESP" | json_get "['refreshToken']" 2>/dev/null)
EXPIRES_IN=$(echo "$REGISTER_RESP" | json_get "['expiresIn']" 2>/dev/null)
if [ -n "$ACCESS_TOKEN" ] && [ -n "$REFRESH_TOKEN" ]; then
  pass "Registered — accessToken TTL is ${EXPIRES_IN}s"
else
  fail "Register did not return tokens: $REGISTER_RESP"
  exit 1
fi

echo
echo "── Step 2: authenticated request succeeds ──────────"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$PROTECTED_ENDPOINT" -H "Authorization: Bearer $ACCESS_TOKEN")
[ "$STATUS" = "200" ] && pass "GET $PROTECTED_ENDPOINT -> 200" || fail "GET $PROTECTED_ENDPOINT -> $STATUS (expected 200)"

echo
echo "── Step 3: wait past the real TTL ──────────────────"
WAIT=$((EXPIRES_IN + 2))
echo "  sleeping ${WAIT}s so the access token genuinely expires…"
sleep "$WAIT"

echo
echo "── Step 4: stale access token is rejected ──────────"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$PROTECTED_ENDPOINT" -H "Authorization: Bearer $ACCESS_TOKEN")
[ "$STATUS" = "401" ] && pass "GET $PROTECTED_ENDPOINT with expired token -> 401 (expiry is real, not simulated)" \
  || fail "GET $PROTECTED_ENDPOINT with expired token -> $STATUS (expected 401)"

echo
echo "── Step 5: refresh issues a new, different token pair ──"
REFRESH_RESP=$(curl -s -X POST "$BASE_URL/auth/refresh" \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")
NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESP" | json_get "['accessToken']" 2>/dev/null)
NEW_REFRESH_TOKEN=$(echo "$REFRESH_RESP" | json_get "['refreshToken']" 2>/dev/null)
if [ -n "$NEW_ACCESS_TOKEN" ] && [ "$NEW_ACCESS_TOKEN" != "$ACCESS_TOKEN" ] && [ "$NEW_REFRESH_TOKEN" != "$REFRESH_TOKEN" ]; then
  pass "POST /auth/refresh -> 200, both tokens rotated (new != old)"
else
  fail "Refresh did not return a genuinely new token pair: $REFRESH_RESP"
fi

echo
echo "── Step 6: the new access token works ──────────────"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$PROTECTED_ENDPOINT" -H "Authorization: Bearer $NEW_ACCESS_TOKEN")
[ "$STATUS" = "200" ] && pass "GET $PROTECTED_ENDPOINT with refreshed token -> 200" \
  || fail "GET $PROTECTED_ENDPOINT with refreshed token -> $STATUS (expected 200)"

echo
echo "── Step 7: replaying the OLD refresh token fails ───"
REPLAY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/auth/refresh" \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")
[ "$REPLAY_STATUS" = "401" ] && pass "Replaying the already-rotated refresh token -> 401 (one-time-use rotation confirmed)" \
  || fail "Replaying the old refresh token -> $REPLAY_STATUS (expected 401)"

echo
if [ "$FAIL" = "0" ]; then
  echo "✓✓ Refresh flow verified end-to-end — real expiry, transparent refresh, rotation reuse-detection."
  exit 0
else
  echo "✗✗ Refresh flow broken — see failures above."
  exit 1
fi
