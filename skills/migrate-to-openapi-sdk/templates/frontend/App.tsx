import { useEffect, useState } from 'react';
import { AuthenticationManager, SESSION_EXPIRED_EVENT } from '{{CLIENT_PACKAGE_NAME}}';
import LoginForm from './components/LoginForm';
import {{MAIN_AUTHENTICATED_VIEW}} from './components/{{MAIN_AUTHENTICATED_VIEW}}';

// Owns session state so the SDK's SESSION_EXPIRED_EVENT can be handled in
// one place: take ownership with preventDefault() and drop back to the
// login screen with a message, instead of the SDK's default hard redirect.
export default function App() {
  const [authenticated, setAuthenticated] = useState(() => AuthenticationManager.isAuthenticated());
  const [sessionMessage, setSessionMessage] = useState('');

  useEffect(() => {
    function handleSessionExpired(event: Event) {
      event.preventDefault();
      setSessionMessage('Your session expired. Please log in again.');
      setAuthenticated(false);
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, []);

  function handleLogout() {
    AuthenticationManager.logout();
    AuthenticationManager.clearStorage();
    setSessionMessage('');
    setAuthenticated(false);
  }

  if (!authenticated) {
    return (
      <>
        {sessionMessage && (
          <p style={{ color: '#b45309', textAlign: 'center', marginTop: 24 }}>{sessionMessage}</p>
        )}
        <LoginForm
          onAuthenticated={() => {
            setSessionMessage('');
            setAuthenticated(true);
          }}
        />
      </>
    );
  }

  return <{{MAIN_AUTHENTICATED_VIEW}} onLogout={handleLogout} />;
}
