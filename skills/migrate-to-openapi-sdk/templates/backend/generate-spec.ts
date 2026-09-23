import 'reflect-metadata';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { buildSwaggerConfig } from './swagger-config';

// Dumps the OpenAPI document to disk WITHOUT starting an HTTP server or
// binding a port. This is what the generated client is built from — the
// contract is derived straight from the same decorators the backend runs on,
// with no separately-maintained YAML to fall out of sync.
async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const document = SwaggerModule.createDocument(app, buildSwaggerConfig());

  const outPath = resolve(__dirname, '{{RELATIVE_PATH_TO_CLIENT_LIB}}/openapi.json');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(document, null, 2));

  console.log(`[generate-spec] wrote ${outPath}`);
  await app.close();
}

main().catch((err) => {
  console.error('[generate-spec] failed:', err);
  process.exit(1);
});
