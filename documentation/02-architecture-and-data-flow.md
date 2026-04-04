# 02 - Architecture & Data Flow

## High-level architecture

- **Smart Contract (Solidity + Hardhat)**
  - File: `contracts/SupplyChain.sol`
  - Stores products, tracking events, and participants.

- **Backend (Node.js + Express)**
  - File: `backend/server.js`
  - Uses ethers.js to read/write smart contract data.
  - Exposes REST endpoints under `/api/*`.

- **Frontend (React)**
  - Root: `frontend/src/App.js`
  - API client: `frontend/src/services/api.js`
  - UI pages in `frontend/src/pages/*`.

## Runtime components and ports

- **Hardhat node**
  - RPC: `http://127.0.0.1:8545`

- **Backend**
  - Default: `http://localhost:5000`

- **Frontend**
  - Default: `http://localhost:3000`

## Data flow: Read operations

Example: “View all products”

1. React calls backend
   - `GET /api/products`
2. Backend reads from contract using a provider
   - `productCount()`
   - `getProduct(i)`
   - `getTrackingCount(i)`
3. Backend returns JSON to frontend
4. Frontend renders list

## Data flow: Write operations (transactions)

Example: “Create product”

1. React calls backend
   - `POST /api/products`
2. Backend selects a signer (private key)
   - From request: `privateKey` OR
   - From deployment config: `deploymentConfig.privateKeys.manufacturer`
3. Backend sends a blockchain transaction
   - `createProduct(...)`
4. Backend waits for confirmation
   - `await tx.wait()`
5. Backend returns transaction details

## Generated configuration files

After running `npm run deploy:local`, the deployment script generates:

- Backend config
  - `backend/config/deployment.json`
  - `backend/config/SupplyChain.abi.json`

- Frontend config
  - `frontend/src/config/deployment.json`
  - `frontend/src/config/SupplyChain.abi.json`

These files are required to connect to the correct contract address and ABI.

## Key design decisions

- The backend is the main integration layer.
  - It simplifies blockchain interactions for the frontend.
- Contract writes require a signer.
  - Reads use the provider.
  - Writes use a wallet created from a private key.
- The system is designed for local demo/testing (Hardhat default accounts).
