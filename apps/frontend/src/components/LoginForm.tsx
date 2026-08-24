import { useState } from 'react';
import { AuthenticationManager } from '@org/api-client';

export default function LoginForm({ onAuthenticated }: { onAuthenticated: () => void }) {
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
      onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '80px auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif' }}>
      <h2>{mode === 'login' ? 'Log in' : 'Register'}</h2>
      <p style={{ color: '#666', fontSize: 13 }}>
        Access tokens expire in ~45s by design — try waiting after logging in, then click around: the SDK's axios
        interceptor refreshes and retries transparently.
      </p>

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
