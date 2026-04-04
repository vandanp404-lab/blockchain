# 01 - Quick Start

## Prerequisites

- Node.js v18+
- npm (comes with Node.js)

## Step-by-step (Local Development)

## 1) Install dependencies

From the project root:

```bash
npm run setup
```

This installs dependencies for:

- Root Hardhat project
- `backend/`
- `frontend/`

## 2) Start the local blockchain (Hardhat node)

In the project root:

```bash
npm run node
```

Expected:

- JSON-RPC available at `http://127.0.0.1:8545`
- Hardhat prints a list of funded test accounts and private keys

Keep this terminal running.

## 3) Deploy smart contracts to localhost

In a second terminal (project root):

```bash
npm run deploy:local
```

What this does:

- Deploys `SupplyChain` contract
- Registers sample participants
- Creates sample products and tracking events
- Writes generated config files:
  - `backend/config/deployment.json`
  - `backend/config/SupplyChain.abi.json`
  - `frontend/src/config/deployment.json`
  - `frontend/src/config/SupplyChain.abi.json`

## 4) Start backend API

In a third terminal (project root):

```bash
npm run start:backend
```

Backend defaults:

- Base URL: `http://localhost:5000`
- Health check: `GET http://localhost:5000/api/health`

## 5) Start frontend

In a fourth terminal (project root):

```bash
npm run start:frontend
```

Frontend defaults:

- URL: `http://localhost:3000`
- Uses a proxy to backend (see `frontend/package.json`), so UI calls reach `http://localhost:5000`.

## Verify everything is running

- Backend health:
  - Open `http://localhost:5000/api/health`
  - You should see `status: OK`
  - `blockchain.connected` should be `true` after deploy

## Recommended order (important)

1. `npm run node`
2. `npm run deploy:local`
3. `npm run start:backend`
4. `npm run start:frontend`
