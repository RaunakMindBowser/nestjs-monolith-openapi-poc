// Public API of @org/api-client
// Generated from apps/backend's @nestjs/swagger decorators via generate-spec.ts.
// Consumers import everything through this package — never from ./generated directly.
export * from './generated/index.js';
export { configureApiClient } from './configure.js';
export { AuthenticationManager, SESSION_EXPIRED_EVENT } from './managers/AuthenticationManager.js';
export type * as PatientsApi from './generated/types.gen.js';
export type * as AuthApi from './generated/types.gen.js';
