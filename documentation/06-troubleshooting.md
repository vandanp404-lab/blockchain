# 06 - Troubleshooting & FAQ

## Backend says "Blockchain not configured" or "Blockchain not connected"

Cause:

- You did not deploy the contract yet, or backend cannot read generated config.

Fix:

1. Start node:

```bash
npm run node
```

2. Deploy to localhost:

```bash
npm run deploy:local
```

3. Restart backend:

```bash
npm run start:backend
```

## Frontend shows a blockchain warning banner

Cause:

- Frontend calls backend `GET /api/health` and sees `blockchain.connected=false`.

Fix:

- Ensure backend is running and contract is deployed.

## RPC errors / cannot connect to 8545

Cause:

- Hardhat node is not running.

Fix:

- Run `npm run node` and keep it running.

## Address already in use

- Backend default port is 5000.
- Frontend default port is 3000.

Fix:

- Stop the conflicting process, or change ports:
  - Backend: set `PORT=xxxx`
  - Frontend: React will usually ask to run on a different port.

## Transactions failing with "Participant not registered or inactive"

Cause:

- Contract requires `onlyRegistered` for `createProduct` and `updateTracking`.

Fix:

- Use a private key that belongs to a registered participant.
- For local demo, `deploy:local` registers:
  - manufacturer
  - supplier
  - distributor
  - retailer

## SKU already exists

Cause:

- Contract enforces unique SKU via `skuExists[sku]`.

Fix:

- Use a new SKU.

## Notes about private keys

- Local hardhat private keys are included in `scripts/deploy.js` for demo.
- Never use these keys on a real network with real funds.
