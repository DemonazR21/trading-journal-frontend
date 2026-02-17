import React, { useState, useEffect } from 'react';
import { useKeycloak } from '../contexts/KeycloakContext';

const KeycloakDebug = () => {
  const { keycloak, authenticated, initialized } = useKeycloak();
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    if (keycloak) {
      // Get sessionStorage keys
      const sessionKeys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('keycloak') || key.includes('pkce'))) {
          sessionKeys.push(key);
        }
      }

      setDebugInfo({
        authenticated: authenticated,
        initialized: initialized,
        hasKeycloak: !!keycloak,
        hasToken: !!keycloak.token,
        hasRefreshToken: !!keycloak.refreshToken,
        hasIdToken: !!keycloak.idToken,
        tokenParsed: keycloak.tokenParsed ? JSON.stringify(keycloak.tokenParsed, null, 2) : 'null',
        url: keycloak.authServerUrl || 'undefined',
        realm: keycloak.realm || 'undefined',
        clientId: keycloak.clientId || 'undefined',
        subject: keycloak.subject || 'null',
        username: keycloak.tokenParsed?.preferred_username || 'null',
        sessionId: keycloak.sessionId || 'null',
        currentUrl: window.location.href,
        hasCodeInUrl: window.location.href.includes('code='),
        hasStateInUrl: window.location.href.includes('state='),
        sessionStorageKeys: sessionKeys.join(', ') || 'none',
        flow: keycloak.flow || 'undefined',
        responseMode: keycloak.responseMode || 'undefined',
      });
    }
  }, [keycloak, authenticated, initialized]);

  const testLogin = () => {
    console.log('[DEBUG] Testing manual login...');
    if (keycloak) {
      keycloak.login();
    } else {
      console.error('[DEBUG] Keycloak not initialized!');
    }
  };

  const testLogout = () => {
    console.log('[DEBUG] Testing logout...');
    if (keycloak) {
      keycloak.logout();
    }
  };

  const refreshToken = () => {
    console.log('[DEBUG] Testing token refresh...');
    if (keycloak) {
      keycloak.updateToken(30)
        .then((refreshed) => {
          console.log('[DEBUG] Token refreshed:', refreshed);
          alert('Token refresh: ' + (refreshed ? 'SUCCESS' : 'NOT NEEDED'));
        })
        .catch((error) => {
          console.error('[DEBUG] Token refresh failed:', error);
          alert('Token refresh FAILED: ' + error);
        });
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
      <h2>🔍 Keycloak Debug Info</h2>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={testLogin} style={{ marginRight: '10px', padding: '10px' }}>Test Login</button>
        <button onClick={testLogout} style={{ marginRight: '10px', padding: '10px' }}>Test Logout</button>
        <button onClick={refreshToken} style={{ padding: '10px' }}>Refresh Token</button>
      </div>

      <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '5px' }}>
        <h3>State:</h3>
        <div style={{ marginLeft: '20px' }}>
          <p><strong>Initialized:</strong> <span style={{ color: initialized ? 'green' : 'red' }}>{String(initialized)}</span></p>
          <p><strong>Authenticated:</strong> <span style={{ color: authenticated ? 'green' : 'red' }}>{String(authenticated)}</span></p>
          <p><strong>Has Keycloak Instance:</strong> <span style={{ color: debugInfo.hasKeycloak ? 'green' : 'red' }}>{String(debugInfo.hasKeycloak)}</span></p>
        </div>

        <h3>Tokens:</h3>
        <div style={{ marginLeft: '20px' }}>
          <p><strong>Has Access Token:</strong> <span style={{ color: debugInfo.hasToken ? 'green' : 'red' }}>{String(debugInfo.hasToken)}</span></p>
          <p><strong>Has Refresh Token:</strong> <span style={{ color: debugInfo.hasRefreshToken ? 'green' : 'red' }}>{String(debugInfo.hasRefreshToken)}</span></p>
          <p><strong>Has ID Token:</strong> <span style={{ color: debugInfo.hasIdToken ? 'green' : 'red' }}>{String(debugInfo.hasIdToken)}</span></p>
        </div>

        <h3>Configuration:</h3>
        <div style={{ marginLeft: '20px' }}>
          <p><strong>Auth Server URL:</strong> {debugInfo.url}</p>
          <p><strong>Realm:</strong> {debugInfo.realm}</p>
          <p><strong>Client ID:</strong> {debugInfo.clientId}</p>
          <p><strong>Flow:</strong> {debugInfo.flow}</p>
          <p><strong>Response Mode:</strong> {debugInfo.responseMode}</p>
        </div>

        <h3>URL Info:</h3>
        <div style={{ marginLeft: '20px' }}>
          <p><strong>Current URL:</strong> <span style={{ fontSize: '10px', wordBreak: 'break-all' }}>{debugInfo.currentUrl}</span></p>
          <p><strong>Has 'code' parameter:</strong> <span style={{ color: debugInfo.hasCodeInUrl ? 'green' : 'red' }}>{String(debugInfo.hasCodeInUrl)}</span></p>
          <p><strong>Has 'state' parameter:</strong> <span style={{ color: debugInfo.hasStateInUrl ? 'green' : 'red' }}>{String(debugInfo.hasStateInUrl)}</span></p>
        </div>

        <h3>SessionStorage:</h3>
        <div style={{ marginLeft: '20px' }}>
          <p><strong>Keycloak Keys:</strong> {debugInfo.sessionStorageKeys || 'none'}</p>
        </div>

        <h3>User Info:</h3>
        <div style={{ marginLeft: '20px' }}>
          <p><strong>Subject (User ID):</strong> {debugInfo.subject}</p>
          <p><strong>Username:</strong> {debugInfo.username}</p>
          <p><strong>Session ID:</strong> {debugInfo.sessionId}</p>
        </div>

        <h3>Token Parsed:</h3>
        <pre style={{ background: '#fff', padding: '10px', overflow: 'auto', maxHeight: '300px' }}>
          {debugInfo.tokenParsed}
        </pre>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '5px' }}>
        <h3>📝 Console Logs</h3>
        <p>Open Developer Console (F12) to see detailed logs with [KeycloakContext] prefix</p>
      </div>
    </div>
  );
};

export default KeycloakDebug;
