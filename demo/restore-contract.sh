#!/usr/bin/env bash
# Demo helper: restore the original DTO and regenerate spec + client.
set -euo pipefail
cd "$(dirname "$0")/.."

BAK=demo/.patient-response.dto.ts.orig
DTO=apps/backend/src/patients/dto/patient-response.dto.ts

[ -f "$BAK" ] || { echo "No backup found — DTO is presumably already original."; exit 0; }

cp "$BAK" "$DTO"
npm run generate

echo
echo "✓ Contract restored and client regenerated."
