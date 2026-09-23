import { client } from './generated/index.js';
import { AuthenticationManager } from './managers/AuthenticationManager.js';

export interface ApiClientConfig {
  baseUrl: string;
}

// One service, one client — no ServiceLoader/aggregator layer needed here.
// That indirection (see the multi-service template) exists to pick between
// several generated packages; with a single backend there's only ever one.
export function configureApiClient({ baseUrl }: ApiClientConfig): void {
  // GOTCHA: the axios client's config key is `baseURL`, not `baseUrl` like
  // @hey-api/client-fetch — this is genuinely a different shape, not a typo.
  // Confirm this against whatever version of @hey-api/client-axios actually
  // resolves in this repo (see SKILL.md's gotchas section on version pinning).
  client.setConfig({ baseURL: baseUrl });

  const axiosInstance = client.instance;

  // Attach the current access token fresh on every request — never cached
  // beyond the request itself, so a token refreshed mid-session is picked
  // up immediately without re-configuring anything.
  axiosInstance.interceptors.request.use((config) => {
    const token = AuthenticationManager.getAccessToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  });

  // Hand-rolled 401 -> refresh -> retry. DELIBERATELY NOT using the
  // `axios-auth-refresh` library's `deduplicateRefresh` option — read
  // SKILL.md's gotchas section before reaching for that library. Verified by
  // direct reproduction: with N genuinely concurrent 401s on one axios
  // instance, that option retries only the ONE request that happens to
  // trigger the refresh — every other request that was also mid-flight with
  // the same stale token is rejected outright, not queued, despite the
  // library's docs implying otherwise. AuthenticationManager.refresh() is
  // already single-flight (every caller shares one in-flight promise, see
  // its own comment for why), so routing every concurrent 401 through it
  // directly gives the real guarantee: exactly one network call to
  // /auth/refresh, and every stalled request retried afterward.
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const url: string | undefined = error.config?.url;
      const isAuthEndpoint =
        url?.includes('/auth/login') || url?.includes('/auth/register') || url?.includes('/auth/refresh');
      if (isAuthEndpoint || error.response?.status !== 401 || error.config?.__isRetryAfterRefresh) {
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
