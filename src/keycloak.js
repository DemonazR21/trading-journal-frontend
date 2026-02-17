import Keycloak from 'keycloak-js';

// Keycloak configuration
// REACT_APP_KEYCLOAK_URL should be set via environment variable
const keycloakConfig = {
  url: process.env.REACT_APP_KEYCLOAK_URL || 'https://keycloak.uat.lan',
  realm: 'trading',
  clientId: 'trading-frontend',
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;
