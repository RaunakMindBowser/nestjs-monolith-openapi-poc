#!/usr/bin/env bash
# Type-checks BOTH the backend and the frontend against the current contract.
#
# GOTCHA: don't run this through `nx run-many -t typecheck` (or any cached/
# incremental "typecheck" target) if the target repo uses TS project
# references + composite builds — `tsc --build` can report success on
# genuinely broken code right after a spec regen, because it trusts a stale
# .tsbuildinfo / a lib's previously-emitted .d.ts. Run plain `tsc --noEmit`
# against each project's real tsconfig directly, or `tsc --build --force` if
# project references are unavoidable in this repo.
cd "$(dirname "$0")/.."

echo "── Backend ─────────────────────────────────────────"
if npm run --silent -w {{BACKEND_PACKAGE_NAME}} typecheck; then
  echo "✓ Backend compiles."
  BACKEND_OK=1
else
  echo "✗ Backend errors above."
  BACKEND_OK=0
fi

echo
echo "── Frontend ────────────────────────────────────────"
if npm run --silent -w {{FRONTEND_PACKAGE_NAME}} typecheck; then
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
