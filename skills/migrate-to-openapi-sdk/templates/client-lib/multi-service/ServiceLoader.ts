/**
 * ServiceLoader — aggregator that lazily loads each service's generated API module.
 *
 *   const items = await ServiceLoader.{{SERVICE_NAME}}Service;
 *   const result = await items.listSomething();
 *
 * Each getter returns a Promise<module> via dynamic import so a service's
 * bundle is only loaded when first accessed, keeping the initial bundle lean.
 * Add one getter per backend service — copy the pattern below.
 */
class ServiceLoader {
  /**
   * Auth Service — register, login, refresh, logout
   */
  get authService() {
    return import('{{AUTH_SERVICE_CLIENT_PACKAGE}}');
  }

  /**
   * {{SERVICE_NAME}} Service
   */
  get {{SERVICE_NAME}}Service() {
    return import('{{SERVICE_CLIENT_PACKAGE}}');
  }

  // Repeat the getter above, one per additional service.
}

export default new ServiceLoader();
