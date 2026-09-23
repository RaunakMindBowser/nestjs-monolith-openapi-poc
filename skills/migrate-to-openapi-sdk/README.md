# migrate-to-openapi-sdk

A Claude Code skill that migrates a fullstack monorepo's hand-written API
layer onto a **generated OpenAPI client SDK** — a typed client produced from
the backend's own code (no hand-maintained YAML, no manually-typed fetch
calls), plus a real JWT access/refresh-token auth layer wired through axios
interceptors.

This file is the human-facing "how do I use this" doc. The skill's actual
step-by-step logic, gates, and gotchas live in [`SKILL.md`](./SKILL.md) —
read that if you want to know exactly what Claude will do at each step, or if
you're adapting the skill itself.

---

## What it does

1. Adds code-first OpenAPI annotations to one backend controller/route
   (NestJS decorators, or a tsoa controller for Express+TypeScript) and dumps
   a spec — no server needs to be running.
2. Generates a typed axios client from that spec with `@hey-api/openapi-ts`.
3. Wires a thin aggregator library the frontend imports through, with a
   real login/refresh/logout flow: short-lived access tokens, one-time-use
   rotating refresh tokens, and a hand-rolled interceptor that correctly
   handles N concurrent 401s with exactly one refresh call (deliberately
   not using `axios-auth-refresh`'s `deduplicateRefresh` — see gotcha #2 in
   SKILL.md for why that library doesn't actually do this).
4. Cuts over exactly one frontend file from its hand-written API type onto
   the generated one.

It does **one service and one frontend consumer group per run**, with a
stop-and-confirm checkpoint before each major step. It is not a "point it at
the repo and walk away" tool — treat it as a pair-programming session with
checkpoints, not a batch job.

## What it doesn't do

- It won't touch a stack outside the supported matrix below — it stops and
  says so rather than forcing the pattern onto, say, a Fastify or Django
  backend.
- It won't give server-side code (Next.js Server Components, Route
  Handlers, Server Actions) a way to authenticate. The auth layer it builds
  is browser-session based (`localStorage`), so it only covers client-side
  data fetching in a Next.js app. See SKILL.md's "Supported stacks" section.
- It won't chain increments automatically. After each service/consumer is
  migrated and verified, it reports and waits for you to say "next."

---

## Supported stacks

| | Supported |
|---|---|
| Backend | NestJS, **or** Express + TypeScript (via [tsoa](https://tsoa-community.github.io/docs/)) |
| Frontend | React (Vite or CRA), **or** Next.js (App Router or Pages Router) |

That covers MERN (Express + React), NestJS + React, and NestJS + Next.js —
any combination of the rows above. A plain-JavaScript Express backend (no
`tsconfig.json`) is explicitly out of scope: tsoa generates the spec by
reading real TypeScript types, so there's nothing for it to read on a JS
backend.

---

## Prerequisites

Before running this on a real repo:

- The backend and frontend both build/typecheck today, before any changes.
- You know (or are prepared to discover at Step 0) whether the backend is a
  single service or several independently-run services — this changes
  which client-lib shape gets used (see below).
- If the app already has a user/auth model, have it handy — the skill will
  ask you to point the auth scaffold at your real model instead of
  scaffolding a second, competing one. Don't let it create demo in-memory
  users next to a real database-backed user table.
- `npm`/`node` available to run `npm view` (used to resolve a compatible
  `@hey-api/client-axios` version — see gotcha #1 in SKILL.md).

## How to invoke it

From Claude Code, in the target repo:

```
/migrate-to-openapi-sdk <service-or-resource-name>
```

or just describe the task in plain language — "migrate the Orders service
to the OpenAPI SDK pattern" — and Claude will load this skill. If you don't
name a starting service, it'll ask which one.

## What to expect, step by step

The skill works through six gated steps (full detail in SKILL.md):

| Gate | What happens | What it asks you |
|---|---|---|
| **G0 — Discover** | Greps the repo for backend/frontend framework, existing OpenAPI/tsoa setup, existing auth, existing hand-written API types | Confirms its read of your stack and proposes ONE low-risk starting point — **waits for your go-ahead** |
| **G1 — Decorate/Type** | Shows the exact diff adding spec-generation annotations to one controller | Approve before it runs the spec generator |
| **G2 — Auth design** | Proposes single-service vs. multi-service SDK shape, and how the new auth coexists with anything that already exists | Explicit sign-off — this step is never auto-resolved |
| **G3 — Consumer** | Picks the one frontend file being cut over | — |
| **G4 — Verify** | Runs real typechecks, a zero-diff regeneration check, and (if auth was touched) an end-to-end refresh-flow script against your running backend | Reviews literal command output, not assertions |
| **G5 — Retire** *(optional)* | Confirms zero remaining consumers before deleting an old hand-written type | Confirm before delete |

After G4, it reports what was migrated and what was deliberately deferred,
then proposes the next increment and stops — you decide whether to continue.

## Directory layout

```
SKILL.md                        the skill's own instructions (read this for full detail)
templates/
  backend/                      NestJS spec generation + auth scaffold
  backend-express/              Express + tsoa spec generation + auth scaffold
  client-lib/                   framework-agnostic: generated-client config, aggregator, auth manager
    single-service/             one backend → configureApiClient()
    multi-service/              several backends → ServiceLoader + EnvironmentManager
  frontend/                     React (Vite/CRA) bootstrap + login form reference
  frontend-next/                Next.js client-boundary provider + login form reference
  demo/                         type-check and refresh-flow verification scripts
```

## Before you run this on your team's repo

Read the **Known gotchas** section of [`SKILL.md`](./SKILL.md) once, even if
you don't read the rest closely. Several of them are silent-failure-shaped
(a version mismatch that only shows up as a compile error in generated code,
an error middleware you forgot that turns every failure into an HTML 500,
an env var missing one prefix that reads as `undefined` at runtime) — the
kind of thing that's cheap to avoid up front and expensive to debug after
the fact.
