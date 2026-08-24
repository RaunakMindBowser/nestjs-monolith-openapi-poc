import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { configureApiClient } from '@org/api-client';
import App from './App';

configureApiClient({
  baseUrl: 'http://localhost:3000',
});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
