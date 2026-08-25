import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  // Reads the document generate-spec.ts dumped from the running decorators —
  // not a hand-maintained YAML file.
  input: './openapi.json',
  output: 'src/generated',
  plugins: ['@hey-api/client-axios'],
});
