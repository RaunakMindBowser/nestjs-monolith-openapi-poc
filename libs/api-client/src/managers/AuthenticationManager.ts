import { login, register, refreshToken, logout } from '../generated/index.js';
import type { AuthResponseDto } from '../generated/index.js';

const TOKEN_KEY = 'poc_auth_token'; // matches nx-openapi-poc's AuthenticationManager naming convention

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Dispatched on window when a refresh is unrecoverable (the server rejected
// the refresh token) right before the fallback redirect to '/'. Consumers
// can call event.preventDefault() to take ownership — e.g. show a "session
// expired" message before navigating away. Mirrors bi-openapi-client's
// SESSION_EXPIRED_EVENT.
export const SESSION_EXPIRED_EVENT = 'poc-session-expired';

// Refresh calls are single-flight: this is what makes configure.ts's
// response interceptor correct for N concurrent 401s (every one of them
// awaits this same promise, so exactly one network call to /auth/refresh
// happens no matter how many requests failed at once — see configure.ts's
// comment for the direct reproduction that proved this matters). It also
// covers this method being called directly and proactively (e.g. a future
// refresh-on-focus timer) outside the interceptor path — without the guard,
// a proactive call racing a reactive one would both consume the same
// one-time-use refresh token, and the loser would force-log-out the user for
// no real reason.
let refreshPromise: Promise<StoredTokens> | null = null;

export const AuthenticationManager = {
  async login(email: string, password: string) {
    const result = await login({ body: { email, password } });
    if (result.error) throw new Error(result.error.message ?? 'Login failed');
    store(result.data!);
    return result.data!.user;
  },

  async register(email: string, password: string, name: string) {
    const result = await register({ body: { email, password, name } });
    if (result.error) throw new Error(result.error.message ?? 'Registration failed');
    store(result.data!);
    return result.data!.user;
  },

  getAccessToken(): string | null {
    return read()?.accessToken ?? null;
  },

  isAuthenticated(): boolean {
    return read() !== null;
  },

  async refresh(): Promise<StoredTokens> {
    if (!refreshPromise) {
      refreshPromise = doRefresh().finally(() => {
        refreshPromise = null;
      });
    }
    return refreshPromise;
  },

  async logout(): Promise<void> {
    const tokens = read();
    // Best-effort — revocation failing shouldn't block the local logout.
    if (tokens) await logout({ body: { refreshToken: tokens.refreshToken } }).catch(() => undefined);
    // Storage is NOT cleared here, matching bi-openapi-client's logout()
    // semantics — the caller/UI is responsible for clearing local state.
  },

  clearStorage(): void {
    localStorage.removeItem(TOKEN_KEY);
  },
};

async function doRefresh(): Promise<StoredTokens> {
  const current = read();
  if (!current) throw new Error('No refresh token available');

  const result = await refreshToken({ body: { refreshToken: current.refreshToken } });
  if (result.error) {
    // The generated axios client sets `.error` to `{}` for ANY failure —
    // including a pure network error with no HTTP response at all — not
    // just real 4xx rejections. Only a genuine 400/401/403 from the auth
    // server means the refresh token was actually rejected (rotated,
    // expired, revoked) and the session is over. A network blip, timeout,
    // or 5xx must be rethrown untouched — treating those as "session ended"
    // would log a user out over a flaky connection.
    const status = result.response?.status;
    if (status === 400 || status === 401 || status === 403) {
      localStorage.removeItem(TOKEN_KEY);
      const notHandled = window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { cancelable: true }));
      if (notHandled) window.location.href = '/';
      throw new Error(result.error.message ?? 'Session expired');
    }
    throw new Error('Failed to refresh session — please try again');
  }

  store(result.data!);
  return read()!;
}

function store(data: AuthResponseDto): void {
  const expiresAt = Date.now() + data.expiresIn * 1000 - 10_000; // 10s safety margin
  const tokens: StoredTokens = { accessToken: data.accessToken, refreshToken: data.refreshToken, expiresAt };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

function read(): StoredTokens | null {
  const raw = localStorage.getItem(TOKEN_KEY);
  return raw ? JSON.parse(raw) : null;
}
