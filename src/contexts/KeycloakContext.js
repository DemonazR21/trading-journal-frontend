import React from 'react';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import Keycloak from 'keycloak-js';

// Create Keycloak instance
const keycloakConfig = {
  url: process.env.REACT_APP_KEYCLOAK_URL || 'https://keycloak.uat.lan',
  realm: 'trading',
  clientId: 'trading-frontend',
};

console.log('[Keycloak] Config:', keycloakConfig);

const keycloakInstance = new Keycloak(keycloakConfig);

// Keycloak init options
const keycloakInitOptions = {
  onLoad: 'check-sso',
  checkLoginIframe: false,
  pkceMethod: 'S256',
  enableLogging: true,
  silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
};

export const KeycloakProvider = ({ children }) => {
  const handleOnEvent = (event, error) => {
    console.log('[Keycloak] Event:', event, error || '');

    if (event === 'onAuthSuccess') {
      console.log('[Keycloak] Authentication successful');
    } else if (event === 'onAuthError') {
      console.error('[Keycloak] Authentication error:', error);
    } else if (event === 'onAuthRefreshSuccess') {
      console.log('[Keycloak] Token refreshed');
    } else if (event === 'onAuthRefreshError') {
      console.error('[Keycloak] Token refresh failed');
    } else if (event === 'onTokenExpired') {
      console.log('[Keycloak] Token expired, refreshing...');
      keycloakInstance.updateToken(70);
    }
  };

  const handleOnTokens = (tokens) => {
    console.log('[Keycloak] Tokens updated:', {
      token: tokens.token ? 'PRESENT' : 'ABSENT',
      refreshToken: tokens.refreshToken ? 'PRESENT' : 'ABSENT',
      idToken: tokens.idToken ? 'PRESENT' : 'ABSENT',
    });
  };

  return (
    <ReactKeycloakProvider
      authClient={keycloakInstance}
      initOptions={keycloakInitOptions}
      onEvent={handleOnEvent}
      onTokens={handleOnTokens}
    >
      {children}
    </ReactKeycloakProvider>
  );
};

// Export custom hook that matches our previous API
export const useKeycloak = () => {
  const { keycloak, initialized } = require('@react-keycloak/web').useKeycloak();

  return {
    keycloak,
    authenticated: keycloak?.authenticated || false,
    initialized,
    login: () => keycloak?.login(),
    logout: () => keycloak?.logout(),
  };
};
