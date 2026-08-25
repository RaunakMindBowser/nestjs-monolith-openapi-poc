# NestJS Monolith OpenAPI POC

Answers one question: **"We're not microservices — we have one NestJS app in a
monorepo. Is spec-first API typing still useful?"**

Yes. This repo proves it with the shape your stack actually has: one Nest
backend, one React frontend, npm workspaces — instead of the multi-service
setup in `../nx-openapi-poc`.

The spec here isn't hand-written YAML — it's generated from `@nestjs/swagger`
decorators already on the controller. Same downstream pipeline (generate a
typed Axios client with `@hey-api/openapi-ts`, gate CI on drift) either way.

**Start here** for the walkthrough below, or [`demo/SETUP.md`](demo/SETUP.md)
to adopt this in an existing Nest monorepo. A slide-style version of the demo
lives in [`demo/open-api.html`](demo/open-api.html).

## Quick start

```bash
npm install
npm run generate            # dumps openapi.json from decorators, generates the client
npm run backend:dev         # :3000 — Swagger UI at /docs
npm run frontend:dev        # :4300
```

| Script | What it does |
|---|---|
| `npm run generate` | Dump spec from Nest (`backend:spec`) then run Hey API (`client:generate`) |
| `npm run backend:dev` | Nest on port 3000 |
| `npm run frontend:dev` | Vite on port 4300 |
| `npm run frontend:typecheck` | `tsc --noEmit` on the frontend (and thus the generated client) |

## Layout

```
apps/
  backend/    NestJS app — patients CRUD, @nestjs/swagger decorators
  frontend/   React + Vite — consumes the generated client, zero hand-written API types
libs/
  api-client/ Generated from apps/backend's decorators via @hey-api/openapi-ts
              Runtime: axios. Generator: @hey-api/openapi-ts (Axios client is bundled)
demo/
  SETUP.md               how to adopt this in your own Nest monorepo
  open-api.html          slide-style demo page
  break-contract.sh      rename a DTO field + regenerate
  check-types.sh         typecheck backend and frontend
  restore-contract.sh    undo the DTO rename + regenerate
  demo-refresh-flow.sh   curl-only JWT refresh / rotation proof
```

## Walkthrough

Two terminals after `npm install` and `npm run generate`:

```bash
npm run backend:dev     # Terminal 1 — localhost:3000, Swagger at /docs
npm run frontend:dev    # Terminal 2 — localhost:4300
```

1. **The contract lives in the controller.** Open
   `apps/backend/src/patients/patients.controller.ts` and
   `apps/backend/src/patients/dto/patient-response.dto.ts`. There is no
   separate YAML file — the decorators are the source.

2. **Dump the spec without booting a server.**
   `npm run backend:spec` writes `libs/api-client/openapi.json`. Grep it for
   `ssn` — it isn't there (entity fields that aren't on the DTO never leave
   the backend).

3. **Generate the client.** `npm run client:generate`, or both steps via
   `npm run generate`. Config is `libs/api-client/openapi-ts.config.ts`
   (`plugins: ['@hey-api/client-axios']`). The Axios client ships inside
   `@hey-api/openapi-ts`; `axios` is the runtime dependency.

4. **Frontend uses generated types only.** Open
   `apps/frontend/src/services/patientService.ts`. No `ServiceLoader` — one
   client, imported from `@org/api-client`. Auth (access + rotating refresh)
   is `configureApiClient()` + `AuthenticationManager` in the same package.

5. **Break the contract → both sides fail typecheck.**

   ```bash
   ./demo/break-contract.sh
   ./demo/check-types.sh
   # backend mapping (toResponseDto) and frontend PatientList both error

   ./demo/restore-contract.sh
   ./demo/check-types.sh
   ```

6. **Same JSON as Swagger UI.** Open http://localhost:3000/docs — the
   document that page renders is what produced the typed client.

Optional: with the backend running, `./demo/demo-refresh-flow.sh` proves
token expiry, refresh, and one-time-use rotation over curl (no browser).
