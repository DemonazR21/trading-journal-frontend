# Trading Journal Frontend

React-based frontend for the Trading Journal application with Keycloak authentication.

## Prerequisites

- Node.js 18+ and npm
- Access to Keycloak at `keycloak.uat.lan`
- Backend API running

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env.local` file:

```bash
REACT_APP_KEYCLOAK_URL=https://keycloak.uat.lan
REACT_APP_API_URL=http://192.168.88.102:30091/api
```

### 3. Start Development Server

```bash
npm start
```

Application will open at `http://localhost:3000`.

## Build for UAT Deployment

### Option A: Build on Local Machine (if npm is available)

```bash
# Set environment variables for UAT
export REACT_APP_KEYCLOAK_URL=https://keycloak.uat.lan
export REACT_APP_API_URL=https://trading.uat.lan/api

# Build
npm run build
```

The `build/` folder will contain the production build.

### Option B: Build on Another Machine with Node.js

If npm is not available on your server, build on a machine with Node.js:

```bash
# On a machine with Node.js installed:
cd frontend/
npm install
export REACT_APP_KEYCLOAK_URL=https://keycloak.uat.lan
export REACT_APP_API_URL=https://trading.uat.lan/api
npm run build

# Copy build/ folder to server
scp -r build/ user@server:/path/to/trading-journal/frontend/
```

## Deploy to K8s

After building, the `build/` folder needs to be packaged into a ConfigMap. Jenkins will do this automatically using `_config.yaml`:

```yaml
frontend:
  src: k3s/manifests/trading-journal/frontend/build
  files:
    - "**/*"  # All files in build folder
  configmap: trading-frontend-build
```

## Components

- **Dashboard** (`/`) - Overview with quick stats
- **Signals** (`/signals`) - View trading signals with filters, create trades from signals
- **Trades** (`/trades`) - View/edit/close trades with filters
- **Stats** (`/stats`) - Detailed statistics and performance metrics

## Features

- Keycloak SSO authentication
- Auto JWT token refresh
- Responsive Ant Design UI
- Real-time API integration
- Signal-to-trade workflow
- Trade P&L tracking
- Performance statistics

## Tech Stack

- React 18
- React Router v6
- Ant Design v5
- Axios
- Keycloak JS
- Day.js

## Keycloak Configuration Required

Ensure the Keycloak realm `trading` has a client `trading-frontend` configured:

- Access Type: `public`
- Valid Redirect URIs: `https://trading.uat.lan/*`, `http://localhost:3000/*`
- Web Origins: `https://trading.uat.lan`, `http://localhost:3000`
