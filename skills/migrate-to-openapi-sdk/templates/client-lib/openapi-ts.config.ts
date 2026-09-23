import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  client: '@hey-api/client-axios',
  // For a NestJS backend generating its own spec: point at the JSON
  // generate-spec.ts writes. For an existing spec (hand-written YAML, or
  // fetched from a running service's /docs-json), point at that instead.
  input: '{{SPEC_INPUT_PATH}}',
  output: {
    path: 'src/generated',
    format: 'prettier',
  },
});
