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
    console.log('[KeycloakContext] Initializing Keycloak...');

    const kc = new Keycloak({
      url: process.env.REACT_APP_KEYCLOAK_URL || 'https://keycloak.uat.lan',
      realm: 'trading',
      clientId: 'trading-frontend',
    });

    console.log('[KeycloakContext] Config:', { url: kc.url, realm: kc.realm, clientId: kc.clientId });

    kc.init({
      checkLoginIframe: false,
      pkceMethod: 'S256'
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
      keycloak.login();
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
