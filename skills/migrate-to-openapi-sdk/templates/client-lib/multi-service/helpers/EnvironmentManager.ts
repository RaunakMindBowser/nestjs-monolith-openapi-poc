import ServiceLoader from '../ServiceLoader.js';
import { AuthenticationManager } from '../managers/AuthenticationManager.js';

export interface EnvironmentConfig {
  authServiceUrl: string;
  {{SERVICE_NAME}}ServiceUrl: string;
  // Add one *ServiceUrl per additional service.
}

// Attaches the current access token to every request, and — for every
// service EXCEPT the auth service itself — a 401 -> refresh -> retry
// interceptor. The auth service's own login/register/refresh/logout calls
// must never trigger a refresh loop, which is why it's wired separately
// below with `isAuthService: true`.
//
// DELIBERATELY NOT using the `axios-auth-refresh` library — see SKILL.md's
// gotchas section. Verified by direct reproduction that its
// `deduplicateRefresh` option only retries the ONE request that triggers a
// refresh, silently dropping every other concurrent 401 on the same axios
// instance. AuthenticationManager.refresh() is already single-flight, so
// routing every concurrent 401 through it directly (as done here) is what
// actually gives the "exactly one refresh call, every request retried"
// guarantee.
function wireAxiosInstance(axiosInstance: import('axios').AxiosInstance, isAuthService: boolean): void {
  axiosInstance.interceptors.request.use((config) => {
    const token = AuthenticationManager.getAccessToken();
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
    return config;
  });

  if (isAuthService) return;

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status !== 401 || error.config?.__isRetryAfterRefresh) {
        return Promise.reject(error);
      }
      console.info('[auth] token expired — refreshing…');
      const tokens = await AuthenticationManager.refresh();
      console.info('[auth] refreshed — retrying original request');
      return axiosInstance.request({
        ...error.config,
        __isRetryAfterRefresh: true,
        headers: { ...error.config.headers, Authorization: `Bearer ${tokens.accessToken}` },
      });
    },
  );
}

export const EnvironmentManager = {
  async configure(config: EnvironmentConfig): Promise<void> {
    const auth = await ServiceLoader.authService;
    auth.client.setConfig({ baseURL: config.authServiceUrl }); // note: baseURL, not baseUrl
    wireAxiosInstance(auth.client.instance, true);

    const {{SERVICE_NAME}} = await ServiceLoader.{{SERVICE_NAME}}Service;
    {{SERVICE_NAME}}.client.setConfig({ baseURL: config.{{SERVICE_NAME}}ServiceUrl });
    wireAxiosInstance({{SERVICE_NAME}}.client.instance, false);

    // Repeat the two lines above, one pair per additional service.
  },
};
