// Public API of {{CLIENT_PACKAGE_NAME}}
export { default as ServiceLoader } from './ServiceLoader.js';
export { AuthenticationManager, SESSION_EXPIRED_EVENT } from './managers/AuthenticationManager.js';
export { EnvironmentManager } from './helpers/EnvironmentManager.js';

// Re-export each generated package's types as a namespaced type-only export.
// Consumers use: import type { AuthServiceTypes, {{SERVICE_NAME}}ServiceTypes } from '{{CLIENT_PACKAGE_NAME}}'
export type * as AuthServiceTypes from '{{AUTH_SERVICE_CLIENT_PACKAGE}}';
export type * as {{SERVICE_NAME}}ServiceTypes from '{{SERVICE_CLIENT_PACKAGE}}';
