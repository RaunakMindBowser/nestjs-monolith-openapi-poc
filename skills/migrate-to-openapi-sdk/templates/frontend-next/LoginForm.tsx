'use client';
// Same form as templates/frontend/LoginForm.tsx, adapted to read/write
// session state through useSession() (see ApiClientProvider.tsx) instead of
// owning local App-level state — there's no single App.tsx root in a Next
// project to hold that state the way there is in a Vite/CRA SPA.
import { useState } from 'react';
import { AuthenticationManager } from '{{CLIENT_PACKAGE_NAME}}';
import { useSession } from './ApiClientProvider';

export default function LoginForm() {
  const { setAuthenticated, clearSessionMessage } = useSession();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        await AuthenticationManager.login(email, password);
      } else {
        await AuthenticationManager.register(email, password, name);
      }
      clearSessionMessage();
      setAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '80px auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif' }}>
      <h2>{mode === 'login' ? 'Log in' : 'Register'}</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {mode === 'register' && (
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <button type="submit">{mode === 'login' ? 'Log in' : 'Register'}</button>
      </form>

      <p style={{ fontSize: 13, marginTop: 12 }}>
        {mode === 'login' ? (
          <>
            No account?{' '}
            <a href="#" onClick={(e) => (e.preventDefault(), setMode('register'))}>
              Register
            </a>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <a href="#" onClick={(e) => (e.preventDefault(), setMode('login'))}>
              Log in
            </a>
          </>
        )}
      </p>
    </div>
  );
}
