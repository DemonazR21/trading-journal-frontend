import React from 'react';
import ReactDOM from 'react-dom/client';
import { KeycloakProvider } from './contexts/KeycloakContext';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <KeycloakProvider>
    <App />
  </KeycloakProvider>
);
