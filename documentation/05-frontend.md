# 05 - Frontend (React)

## Location

- `frontend/`

## Purpose

The frontend provides the user interface to:

- View products and their statuses
- Add products to the blockchain (via backend)
- Update tracking history (via backend)
- Verify product authenticity by SKU
- View analytics/reporting pages

## Key files

## Routing

- `frontend/src/App.js`

Routes:

- `/dashboard`
- `/products`
- `/products/add`
- `/products/:id`
- `/verify`
- `/reports`
- `/participants`

## API client

- `frontend/src/services/api.js`

Important behavior:

- `API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api"`
- Axios response interceptor returns `response.data` directly
- Errors are normalized into `Error(message)` where message typically comes from backend `{ error: "..." }`

## Proxy setup

- `frontend/package.json` includes:
  - `"proxy": "http://localhost:5000"`

This is mainly used by Create React App for local development.

## Blockchain connection indicator

- `App.js` calls `checkHealth()` every 30 seconds.
- If backend says blockchain is not connected, the UI shows a warning banner.

## Typical feature flow

## Product list

- UI calls: `getProducts()` -> `GET /api/products`

## Add product

- UI calls: `createProduct(formData)` -> `POST /api/products`

## Track product

- UI calls:
  - `getTrackingHistory(productId)` -> `GET /api/products/:id/tracking`
  - `updateTracking(productId, data)` -> `POST /api/products/:id/tracking`

## Verify

- UI calls: `verifyProduct(sku)` -> `GET /api/verify/:sku`

## Environment variables

Optional:

- `REACT_APP_API_URL` (example: `http://localhost:5000/api`)

If not set, defaults to `http://localhost:5000/api`.
