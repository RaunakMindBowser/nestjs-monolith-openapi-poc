import { useEffect, useState } from 'react';
import { AuthenticationManager, SESSION_EXPIRED_EVENT } from '@org/api-client';
import LoginForm from './components/LoginForm';
import PatientList from './components/PatientList';

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => AuthenticationManager.isAuthenticated());
  const [sessionMessage, setSessionMessage] = useState('');

  useEffect(() => {
    function handleSessionExpired(event: Event) {
      // Take ownership of what happens next instead of the SDK's default
      // hard redirect to '/' — show a message and drop back to the login
      // screen in place.
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

  return <PatientList onLogout={handleLogout} />;
}
