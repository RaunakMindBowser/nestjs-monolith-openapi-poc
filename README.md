# NestJS Monolith OpenAPI POC

Answers one question: **"We're not microservices — we have one NestJS app in a
monorepo. Is spec-first API typing still useful?"**

Yes. This repo proves it with the shape your stack actually has: one Nest
backend, one React frontend, npm workspaces — instead of the multi-service
setup in `../nx-openapi-poc`.

The spec here isn't hand-written YAML — it's generated from `@nestjs/swagger`
decorators already on the controller. Same downstream pipeline (generate a
typed client, gate CI on drift) either way.

**Start here:** [`demo/SCRIPT.md`](demo/SCRIPT.md) for a walkthrough, or
[`demo/SETUP.md`](demo/SETUP.md) to adopt this in an existing Nest monorepo.

## Quick start

```bash
npm install
npm run generate            # dumps openapi.json from decorators, generates the client
npm run backend:dev         # :3000 — Swagger UI at /docs
npm run frontend:dev        # :4300
```

## Layout

```
apps/
  backend/    NestJS app — patients CRUD, @nestjs/swagger decorators
  frontend/   React + Vite — consumes the generated client, zero hand-written API types
libs/
  api-client/ Generated from apps/backend's decorators via @hey-api/openapi-ts
demo/
  SCRIPT.md              walkthrough script
  SETUP.md               how to adopt this in your own Nest monorepo
  break-contract.sh       \
  check-types.sh           > see demo/SCRIPT.md step 6
  restore-contract.sh     /
```
