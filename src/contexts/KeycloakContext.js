import React, { createContext, useContext, useState, useEffect } from 'react';
import Keycloak from 'keycloak-js';

const KeycloakContext = createContext();

export const useKeycloak = () => {
  const context = useContext(KeycloakContext);
  if (!context) {
    throw new Error('useKeycloak must be used within KeycloakProvider');
  }
  return context;
};

export const KeycloakProvider = ({ children }) => {
  const [keycloak, setKeycloak] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Reuse existing Keycloak instance if available
    if (window._keycloakInstance) {
      console.log('[KeycloakContext] Reusing existing Keycloak instance');
      setKeycloak(window._keycloakInstance);
      setAuthenticated(!!window._keycloakInstance.token);
      setInitialized(true);
      return;
    }

    console.log('[KeycloakContext] Initializing Keycloak...');

    const redirectUri = window.location.origin + '/';
    console.log('[KeycloakContext] Redirect URI:', redirectUri);

    const kc = new Keycloak({
      url: process.env.REACT_APP_KEYCLOAK_URL || 'https://keycloak.uat.lan',
      realm: 'trading',
      clientId: 'trading-frontend',
    });

    // Store instance globally to prevent re-initialization
    window._keycloakInstance = kc;

    console.log('[KeycloakContext] Config:', {
      url: kc.authServerUrl,
      realm: kc.realm,
      clientId: kc.clientId
    });

    kc.init({
      checkLoginIframe: false,
      pkceMethod: 'S256',
      redirectUri: redirectUri,
      enableLogging: true,
      responseMode: 'query'  // Use query params instead of fragment to avoid React Router conflict
    })
      .then((auth) => {
        console.log('[KeycloakContext] Init success! Authenticated:', auth);
        console.log('[KeycloakContext] Token:', kc.token ? 'PRESENT' : 'ABSENT');

        setKeycloak(kc);
        setAuthenticated(auth);
        setInitialized(true);

        if (auth && kc.token) {
          console.log('[KeycloakContext] User authenticated successfully');

          // Auto refresh token
          const refreshInterval = setInterval(() => {
            kc.updateToken(70)
              .then((refreshed) => {
                if (refreshed) {
                  console.log('[KeycloakContext] Token refreshed');
                }
              })
              .catch(() => {
                console.error('[KeycloakContext] Failed to refresh token');
                setAuthenticated(false);
                clearInterval(refreshInterval);
              });
          }, 60000);
        }
      })
      .catch((error) => {
        console.error('[KeycloakContext] Init error:', error);
        setKeycloak(kc);
        setAuthenticated(false);
        setInitialized(true);
      });
  }, []);

  const login = () => {
    console.log('[KeycloakContext] Login requested');
    if (keycloak) {
      const redirectUri = window.location.origin + '/';
      console.log('[KeycloakContext] Login with redirectUri:', redirectUri);
      keycloak.login({ redirectUri: redirectUri });
    } else {
      console.error('[KeycloakContext] Keycloak not initialized');
    }
  };

  const logout = () => {
    console.log('[KeycloakContext] Logout requested');
    if (keycloak) {
      keycloak.logout();
    }
  };

  const value = {
    keycloak,
    authenticated,
    initialized,
    login,
    logout,
  };

  console.log('[KeycloakContext] Current state:', { authenticated, initialized, hasKeycloak: !!keycloak });

  return (
    <KeycloakContext.Provider value={value}>
      {children}
    </KeycloakContext.Provider>
  );
};
