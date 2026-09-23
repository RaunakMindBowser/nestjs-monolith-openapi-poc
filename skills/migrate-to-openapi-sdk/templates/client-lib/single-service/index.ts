// Public API of {{CLIENT_PACKAGE_NAME}}
// Generated from the backend's @nestjs/swagger decorators via generate-spec.ts.
// Consumers import everything through this package — never from ./generated directly.
export * from './generated/index.js';
export { configureApiClient } from './configure.js';
export { AuthenticationManager, SESSION_EXPIRED_EVENT } from './managers/AuthenticationManager.js';
export type * as {{RESOURCE_NAME}}Api from './generated/types.gen.js';
