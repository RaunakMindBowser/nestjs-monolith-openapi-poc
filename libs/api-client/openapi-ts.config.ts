import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  client: '@hey-api/client-axios',
  // Reads the document generate-spec.ts dumped from the running decorators —
  // not a hand-maintained YAML file.
  input: './openapi.json',
  output: {
    path: 'src/generated',
    format: 'prettier',
  },
});
