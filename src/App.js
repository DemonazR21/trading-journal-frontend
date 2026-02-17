import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useKeycloak } from './contexts/KeycloakContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import SignalsList from './components/SignalsList';
import TradesHistory from './components/TradesHistory';
import Stats from './components/Stats';
import KeycloakDebug from './components/KeycloakDebug';

function LoginScreen() {
  const { login } = useKeycloak();
  const location = useLocation();

  // Show debug page if on /debug route
  if (location.pathname === '/debug') {
    return <KeycloakDebug />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '20px' }}>
      <h2>Trading Journal</h2>
      <p>Please login to continue</p>
      <button
        onClick={login}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#1890ff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Login with Keycloak
      </button>
      <a href="/debug" style={{ marginTop: '20px', color: '#666', fontSize: '14px' }}>
        🔍 Debug Info
      </a>
    </div>
  );
}

function App() {
  const { authenticated, initialized } = useKeycloak();

  if (!initialized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>Initializing...</h2>
      </div>
    );
  }

  return !authenticated ? (
    <Routes>
      <Route path="*" element={<LoginScreen />} />
    </Routes>
  ) : (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/signals" element={<SignalsList />} />
        <Route path="/trades" element={<TradesHistory />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/debug" element={<KeycloakDebug />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
