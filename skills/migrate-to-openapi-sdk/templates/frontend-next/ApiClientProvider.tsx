'use client';
// Next.js requires 'use client' at the top of any component using
// hooks/browser APIs — Server Components (the App Router default) can't run
// AuthenticationManager, useState, or useEffect at all. This file IS the
// client boundary; nothing above it in the tree needs the directive.
//
// Wire this ONCE, high in the tree:
//   - App Router: app/layout.tsx (a Server Component is fine) renders
//     <ApiClientProvider>{children}</ApiClientProvider> inside <body> —
//     the 'use client' boundary starts at this file, not at layout.tsx.
//   - Pages Router: pages/_app.tsx wraps <Component {...pageProps} /> the
//     same way.
//
// GOTCHA — env vars: only vars prefixed `NEXT_PUBLIC_` are inlined into the
// browser bundle. `process.env.API_BASE_URL` (no prefix) silently reads as
// `undefined` client-side even though the same line works fine in a Server
// Component or API route — this is not a type error, it fails at runtime
// the first time a request goes to `undefined/whatever`. Use
// `NEXT_PUBLIC_API_BASE_URL` (or one `NEXT_PUBLIC_*_SERVICE_URL` per service
// for the multi-service/EnvironmentManager shape).
//
// GOTCHA — hydration: don't read `AuthenticationManager.isAuthenticated()`
// in a `useState` initializer. That runs during the very first client
// render, but React requires that render to match the server-rendered
// markup exactly, and the server has no `localStorage` to check (it always
// renders the logged-out shape). Reading it inside a `useEffect` instead —
// as done below — defers it until after hydration, avoiding a
// "hydration mismatch" warning/flash.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AuthenticationManager, SESSION_EXPIRED_EVENT } from '{{CLIENT_PACKAGE_NAME}}';
// Single-service shape: also `import { configureApiClient } from '{{CLIENT_PACKAGE_NAME}}';`
// Multi-service shape: also `import { EnvironmentManager } from '{{CLIENT_PACKAGE_NAME}}';`
// Pick the one that matches Step 3's G2 decision — don't import both.

interface SessionContextValue {
  authenticated: boolean;
  sessionMessage: string;
  setAuthenticated: (value: boolean) => void;
  clearSessionMessage: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be called within <ApiClientProvider>');
  return ctx;
}

export function ApiClientProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionMessage, setSessionMessage] = useState('');

  useEffect(() => {
    // --- Single-service shape ---
    // configureApiClient({ baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL! });
    // --- Multi-service shape ---
    // void EnvironmentManager.configure({
    //   authServiceUrl: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL!,
    //   {{SERVICE_NAME}}ServiceUrl: process.env.NEXT_PUBLIC_{{SERVICE_NAME_UPPER}}_SERVICE_URL!,
    // });
    setAuthenticated(AuthenticationManager.isAuthenticated());
  }, []);

  useEffect(() => {
    function handleSessionExpired(event: Event) {
      event.preventDefault();
      setSessionMessage('Your session expired. Please log in again.');
      setAuthenticated(false);
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, []);

  return (
    <SessionContext.Provider
      value={{
        authenticated,
        sessionMessage,
        setAuthenticated,
        clearSessionMessage: () => setSessionMessage(''),
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
