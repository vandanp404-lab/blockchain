# 04 - Backend API (Express)

## Location

- `backend/server.js`

## Purpose

The backend exposes a REST API that:

- Reads product / participant / tracking data from the blockchain
- Sends blockchain transactions for write operations
- Converts raw on-chain values into frontend-friendly JSON

## How the backend connects to blockchain

## Config files

On startup, the backend loads:

- `backend/config/deployment.json` (contract address, chain id, sample accounts)
- `backend/config/SupplyChain.abi.json` (ABI)

These are created by `npm run deploy:local`.

## Provider + contract (read-only)

The backend initializes:

- `provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545")`
- `contract = new ethers.Contract(deploymentConfig.contractAddress, contractABI, provider)`

## Contract with signer (writes)

For transactions, it uses:

- `new ethers.Wallet(privateKey, provider)`
- `new ethers.Contract(address, abi, signer)`

## Server port

- Default: `PORT=5000`
- Override: set environment variable `PORT`

## Endpoints

Base URL:

- `http://localhost:5000/api`

## Health

## `GET /health`

- Purpose: confirms API is running and whether blockchain config is loaded.
- Returns: `status`, `blockchain`, `timestamp`

## Config

## `GET /config`

- Purpose: returns deployment info used by frontend/testing

## Products

## `GET /products`

- Reads:
  - `productCount()`
  - `getProduct(i)`
  - `getTrackingCount(i)`
- Response format (high-level):
  - `data: [ { id, name, sku, origin, manufacturer, createdAt, status, statusCode, trackingEvents } ]`

## `GET /products/:id`

- Reads:
  - `getProduct(id)`

## `POST /products`

- Sends transaction:
  - `createProduct(name, sku, origin, initialLocation, latitude, longitude)`
- Body fields:
  - `name` (required)
  - `sku` (required)
  - `origin` (required)
  - `initialLocation` (optional)
  - `latitude` (optional)
  - `longitude` (optional)
  - `privateKey` (optional)

If `privateKey` is not provided, backend tries:

- `deploymentConfig.privateKeys.manufacturer`

## Tracking

## `GET /products/:id/tracking`

- Reads:
  - `getTrackingHistory(id)`

## `POST /products/:id/tracking`

- Sends transaction:
  - `updateTracking(productId, location, description, status, latitude, longitude)`
- Body fields:
  - `location` (required)
  - `status` (required; number 0..5)
  - `description` (optional)
  - `latitude` (optional)
  - `longitude` (optional)
  - `privateKey` (optional)

If `privateKey` is not provided, backend tries:

- `deploymentConfig.privateKeys.supplier`

## Participants

## `GET /participants/:address`

- Reads:
  - `getParticipant(address)`

## `POST /participants`

- Sends transaction:
  - `registerParticipant(address, name, role)`
- Body fields:
  - `address` (required)
  - `name` (required)
  - `role` (required)
  - `privateKey` (optional)

If `privateKey` is not provided, backend tries:

- `deploymentConfig.privateKeys.deployer`

## Verification

## `GET /verify/:sku`

- Reads:
  - `verifyProduct(sku)`
  - if valid: `getProduct(productId)`

## Reports

## `GET /reports/analytics`

- Reads all products and aggregates counts by status.

## Error behavior

- If blockchain config is missing or contract isn’t loaded, endpoints return `503` with:
  - `{ "error": "Blockchain not connected" }`
- Other failures return `500` with `error.message`.
