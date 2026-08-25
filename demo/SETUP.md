# Setting This Up In An Existing NestJS Monorepo

For a company codebase that's a single Node/Nest app in a monorepo — not
microservices. If you want the microservices version instead, see
`../nx-openapi-poc/demo/SETUP.md`.

The mechanism is the same as any spec-first setup: generate a typed client
from an OpenAPI document, commit it, gate CI on it staying in sync. The only
thing that changes here is *where the spec comes from* — decorators you
already have, instead of hand-written YAML.

---

## 0. Do you already have `@nestjs/swagger`?

```bash
grep -r "SwaggerModule" src/
```

**If yes** — you're most of the way there. Skip to step 2.

**If no** — install it and add a couple of decorators to one controller
before doing anything else:

```bash
npm install @nestjs/swagger class-validator class-transformer
```

---

## 1. Wire up SwaggerModule (if you don't have it)

`src/main.ts`:

```ts
import { SwaggerModule } from '@nestjs/swagger';
import { buildSwaggerConfig } from './swagger-config';

const document = SwaggerModule.createDocument(app, buildSwaggerConfig());
SwaggerModule.setup('docs', app, document);
```

Factor the `DocumentBuilder()` config into its own file (`swagger-config.ts`)
— you'll reuse it in step 2 to dump the spec without booting a server. See
`apps/backend/src/swagger-config.ts` in this repo.

---

## 2. Add a spec-dump script — no server, no port

This is the one piece that doesn't exist in a typical Nest setup: a way to get
`openapi.json` onto disk without `app.listen()`.

`src/generate-spec.ts` — copy from this repo's
`apps/backend/src/generate-spec.ts`:

```ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { AppModule } from './app.module';
import { buildSwaggerConfig } from './swagger-config';

async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const document = SwaggerModule.createDocument(app, buildSwaggerConfig());
  writeFileSync('libs/api-client/openapi.json', JSON.stringify(document, null, 2));
  await app.close();
}
main();
```

```bash
npm pkg set scripts.spec="ts-node -T src/generate-spec.ts"
npm run spec
```

Why this matters: generating the spec without a running server means CI can
produce it in the same step it typechecks — no "start the app, curl
`/docs-json`, kill it" dance, and nothing that can hang a pipeline waiting on
a port.

---

## 3. Make every controller's `operationId` explicit

Without it, `@nestjs/swagger` derives operation IDs from `ClassName_methodName`
— e.g. `PatientsController_list` — and your generated client ends up with a
function called `patientsControllerList()`. Ugly, and it changes if you rename
the controller class.

```ts
@ApiOperation({ operationId: 'listPatients', summary: 'List all patients' })
@Get()
list() { ... }
```

One line per route. This is the only decorator change most existing
controllers actually need.

---

## 4. Use `@nestjs/swagger`'s `PartialType`, not `@nestjs/mapped-types`'s

If you use `PartialType` for PATCH-style DTOs, import it from
`@nestjs/swagger`:

```ts
import { PartialType } from '@nestjs/swagger';   // ✓ carries @ApiProperty metadata
// NOT: import { PartialType } from '@nestjs/mapped-types';
```

The `@nestjs/mapped-types` version strips Swagger metadata — we hit this
directly building this POC. `UpdatePatientDto` generated as an untyped
`{ [key: string]: unknown }` blob until switching imports. If your codebase
already uses `@nestjs/mapped-types` for this, it's a one-line import swap per
DTO.

---

## 5. Separate your DTOs from your entities — if you haven't already

This is the step that actually earns the "types match reality" claim, and it's
worth doing even if you never generate a client:

```ts
// entity — server-only, may include sensitive or internal-only fields
export interface PatientEntity {
  id: string;
  ssn: string;            // never exposed
  riskScore: number;      // internal
  dateOfBirth: Date;      // real Date in memory
}

// DTO — the public contract, decorated for the spec
export class PatientResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ format: 'date' }) dateOfBirth!: string;   // ISO string on the wire
}
```

If your controllers currently return the entity/ORM model directly, this is
the real work of adopting this pattern — everything downstream (the generated
client, the drift protection) depends on there being a DTO that's narrower
than the entity. See `apps/backend/src/patients/patient.entity.ts` vs.
`dto/patient-response.dto.ts` in this repo for the reference shape, and
`patients.service.ts`'s `toResponseDto()` for the one place that's allowed to
touch both.

---

## 6. Set up the generated client lib

Same as the microservices version — one lib, `openapi-ts.config.ts` pointed at
your dumped JSON instead of a YAML file:

```ts
// libs/api-client/openapi-ts.config.ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi.json',              // the file generate-spec.ts writes
  output: 'src/generated',
  plugins: ['@hey-api/client-axios'],
});
```

Install `axios` as the runtime HTTP client and `@hey-api/openapi-ts` as a
devDependency. From openapi-ts 0.73 the Axios client is bundled in the
generator — do **not** also install `@hey-api/client-axios` (that package is
deprecated). After generate, import the client instance from
`src/generated/client.gen.ts` (it is no longer re-exported from
`generated/index.ts`).

**No `ServiceLoader` aggregator needed.** That pattern in the microservices
POC exists to pick between several generated packages at runtime via dynamic
import. With one backend there's exactly one client — just export it:

```ts
// libs/api-client/src/index.ts
export * from './generated/index.js';
export { configureApiClient } from './configure.js';
export { AuthenticationManager, SESSION_EXPIRED_EVENT } from './managers/AuthenticationManager.js';
export type * as PatientsApi from './generated/types.gen.js';
```

`configureApiClient()` sets the Axios `baseURL` and auth interceptors once,
at app bootstrap — see `libs/api-client/src/configure.ts`.

---

## 7. Point the frontend's TS paths straight at source — skip project references

This repo's `tsconfig.base.json` maps `@org/api-client` directly to
`libs/api-client/src/index.ts` (a source file, not a build output), and no
tsconfig in the repo uses `composite`/`incremental`. That sidesteps a real
failure mode: with TS project references and `tsc --build`, a frontend that
type-checks against a lib's *emitted* `.d.ts` can pass on broken code right
after a regen, because the build considers the lib's dist "still current" per
its `.tsbuildinfo` timestamp. If your monorepo already uses project
references for other reasons, run `tsc --build --force` in the check you gate
CI on. This repo uses plain `tsc --noEmit` so nothing goes stale.

---

## 8. Commit the generated client, gate CI on drift

Same two checks as any spec-first setup:

```yaml
- run: npm run generate
- run: git diff --exit-code -- libs/api-client/
  # non-empty => someone changed a DTO/decorator and didn't regenerate

- run: npm run --workspace @org/backend typecheck
- run: npm run --workspace @org/frontend typecheck
```

---

## Rollout order

1. Pick one controller — ideally one with `@nestjs/swagger` decorators
   already, or few enough routes to add them in an afternoon.
2. Split its return type into a DTO if it's currently returning an entity/ORM
   model directly (step 5 — this is the part with real value).
3. Add `operationId` to each route, dump the spec, generate the client.
4. Migrate one frontend screen off its hand-written interface onto the
   generated type.
5. Add the CI drift check.
6. Repeat per controller as you touch them. Don't block on doing this for the
   whole API up front.

---

## Gotchas specific to the Nest/code-first path

| Symptom | Cause | Fix |
|---|---|---|
| `UpdatePatientDto` generates as `{ [key: string]: unknown }` | `PartialType` imported from `@nestjs/mapped-types` | Import from `@nestjs/swagger` instead |
| Generated function named `patientsControllerList` | No explicit `operationId` | Add `@ApiOperation({ operationId: '...' })` per route |
| Generated type has fields your entity doesn't expose safely, or is missing fields it should | Controller returns the entity/ORM model directly | Return a DTO class; map explicitly in the service |
| `dateOfBirth` typed as it looks in code, not as it looks on the wire | `@ApiProperty()` with no `format`/type override on a `Date`-typed field | Declare the DTO field as `string` with `format: 'date'` or `'date-time'` — that's what JSON actually sends |
| Typecheck passes on broken code locally | Project references + `tsc --build` composite caching | Don't use composite/project-references for this; if you must, use `tsc --build --force` in the gate |
| `class-validator` decorators seem to have no effect on the generated types | They govern runtime validation, not the spec — `@ApiProperty()` governs the spec | Use both; they answer different questions |
