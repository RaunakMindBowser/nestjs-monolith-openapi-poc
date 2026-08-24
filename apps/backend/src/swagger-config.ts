import { DocumentBuilder } from '@nestjs/swagger';

// Shared between main.ts (serves /docs) and generate-spec.ts (dumps openapi.json
// without booting a server) so the two never drift from each other.
export function buildSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Patients Service API')
    .setDescription('Code-first OpenAPI — generated from @nestjs/swagger decorators, not written by hand')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .build();
}
