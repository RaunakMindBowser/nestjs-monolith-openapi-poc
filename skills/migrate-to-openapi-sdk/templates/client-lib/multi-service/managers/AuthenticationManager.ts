import ServiceLoader from '../ServiceLoader.js';
import type { AuthServiceTypes } from '../index.js';

const TOKEN_KEY = '{{TOKEN_STORAGE_KEY}}';

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export const SESSION_EXPIRED_EVENT = '{{SESSION_EXPIRED_EVENT_NAME}}';

// Single-flight — every caller (regardless of which service's 401 triggered
// it) shares one in-flight promise, so concurrent 401s across DIFFERENT
// services still only cause one real call to /auth/refresh. See
// EnvironmentManager.ts's comment for why this matters more than it looks.
let refreshPromise: Promise<StoredTokens> | null = null;

export const AuthenticationManager = {
  async login(email: string, password: string) {
    const auth = await ServiceLoader.authService;
    const result = await auth.login({ body: { email, password } });
    if (result.error) throw new Error((result.error as AuthServiceTypes.ErrorResponseDto).message ?? 'Login failed');
    store(result.data!);
    return result.data!.user;
  },

  async register(email: string, password: string, name: string) {
    const auth = await ServiceLoader.authService;
    const result = await auth.register({ body: { email, password, name } });
    if (result.error)
      throw new Error((result.error as AuthServiceTypes.ErrorResponseDto).message ?? 'Registration failed');
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
    if (tokens) {
      const auth = await ServiceLoader.authService;
      await auth.logout({ body: { refreshToken: tokens.refreshToken } }).catch(() => undefined);
    }
    // Storage is NOT cleared here — the caller/UI clears local state.
  },

  clearStorage(): void {
    clearStorageInternal();
  },
};

async function doRefresh(): Promise<StoredTokens> {
  const current = read();
  if (!current) throw new Error('No refresh token available');

  const auth = await ServiceLoader.authService;
  const result = await auth.refreshToken({ body: { refreshToken: current.refreshToken } });
  if (result.error) {
    // GOTCHA: `.error` is `{}` for ANY failure, including a pure network
    // error with no HTTP response — check `result.response?.status`, not
    // just truthiness, before deciding the session is actually over.
    const status = result.response?.status;
    if (status === 400 || status === 401 || status === 403) {
      clearStorageInternal();
      // GOTCHA (Next.js / any SSR frontend): guard every `window` access —
      // it doesn't exist during server rendering. See the single-service
      // template's copy of this comment for the full reasoning.
      if (typeof window !== 'undefined') {
        const notHandled = window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { cancelable: true }));
        if (notHandled) window.location.href = '/';
      }
      throw new Error((result.error as AuthServiceTypes.ErrorResponseDto).message ?? 'Session expired');
    }
    throw new Error('Failed to refresh session — please try again');
  }

  store(result.data!);
  return read()!;
}

function store(data: AuthServiceTypes.AuthResponseDto): void {
  if (typeof window === 'undefined') return;
  const expiresAt = Date.now() + data.expiresIn * 1000 - 10_000;
  const tokens: StoredTokens = { accessToken: data.accessToken, refreshToken: data.refreshToken, expiresAt };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

function read(): StoredTokens | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(TOKEN_KEY);
  return raw ? JSON.parse(raw) : null;
}

function clearStorageInternal(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}
