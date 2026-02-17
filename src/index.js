import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter as Router } from 'react-router-dom';
import { KeycloakProvider } from './contexts/KeycloakContext';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <Router>
    <KeycloakProvider>
      <App />
    </KeycloakProvider>
  </Router>
);
