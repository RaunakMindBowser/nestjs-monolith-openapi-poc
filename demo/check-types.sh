#!/usr/bin/env bash
# Demo helper: type-check BOTH the backend and the frontend against the
# current contract.
#
# This POC deliberately avoids TS project references / composite builds
# (the thing that made `nx run-many -t typecheck` unreliable in the Nx POC —
# see that repo's demo/SCRIPT.md for the postmortem). Both tsconfigs here run
# plain `tsc --noEmit`, which re-checks from source every time with nothing
# to go stale. No --force needed, no cache to clear.
cd "$(dirname "$0")/.."

echo "── Backend ─────────────────────────────────────────"
if npm run --silent -w @org/backend typecheck; then
  echo "✓ Backend compiles."
  BACKEND_OK=1
else
  echo "✗ Backend errors above."
  BACKEND_OK=0
fi

echo
echo "── Frontend ────────────────────────────────────────"
if npm run --silent -w @org/frontend typecheck; then
  echo "✓ Frontend compiles."
  FRONTEND_OK=1
else
  echo "✗ Frontend errors above."
  FRONTEND_OK=0
fi

echo
if [ "$BACKEND_OK" = "1" ] && [ "$FRONTEND_OK" = "1" ]; then
  echo "✓✓ Contract intact — both sides compile."
  exit 0
else
  echo "✗✗ Contract broken — see errors above."
  exit 1
fi
