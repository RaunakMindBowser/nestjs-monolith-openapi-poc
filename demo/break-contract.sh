#!/usr/bin/env bash
# Demo helper: rename PatientResponseDto.firstName -> legalFirstName in the
# NestJS controller's DTO, then regenerate the spec + client from it.
#
# Unlike the YAML-spec POC, this edits real backend TypeScript — the decorator
# IS the contract, there's no separate file to remember to update.
set -euo pipefail
cd "$(dirname "$0")/.."

DTO=apps/backend/src/patients/dto/patient-response.dto.ts
BAK=demo/.patient-response.dto.ts.orig

[ -f "$BAK" ] || cp "$DTO" "$BAK"

python3 - "$DTO" <<'PY'
import sys
p = sys.argv[1]
s = open(p).read()
old = "  @ApiProperty()\n  firstName!: string;"
new = "  @ApiProperty()\n  legalFirstName!: string;"
if old not in s:
    sys.exit("DTO not in expected state — run demo/restore-contract.sh first.")
open(p, 'w').write(s.replace(old, new))
PY

echo "✓ Contract changed: PatientResponseDto.firstName -> legalFirstName"
npm run generate
echo
echo "✓ Spec regenerated from the decorator, client regenerated from the spec."
echo "  Now run: ./demo/check-types.sh"
