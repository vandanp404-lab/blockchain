# 03 - Smart Contract (SupplyChain.sol)

## Location

- `contracts/SupplyChain.sol`

## Purpose

The `SupplyChain` contract is the on-chain source of truth for:

- Products
- Tracking history (audit trail)
- Participants (registered entities)

## Core data structures

## ProductStatus (enum)

Defined as:

- `Created` (0)
- `InTransit` (1)
- `AtWarehouse` (2)
- `InCustoms` (3)
- `Delivered` (4)
- `Recalled` (5)

## Product (struct)

Stores:

- `id`
- `name`
- `sku`
- `origin`
- `manufacturer`
- `createdAt`
- `status`
- `exists`

## TrackingEvent (struct)

Each event stores:

- `productId`
- `location`
- `description`
- `handler` (the account that performed the update)
- `timestamp`
- `status`
- `latitude`, `longitude`

## Participant (struct)

Stores:

- `addr`
- `name`
- `role` (string: e.g. "manufacturer", "supplier", "distributor", "retailer", "customs")
- `isActive`

## Storage mappings

- `products[productId] => Product`
- `trackingHistory[productId] => TrackingEvent[]`
- `participants[address] => Participant`
- `skuExists[sku] => bool`

## Access control

- `onlyOwner`
  - used for administrative actions such as registering participants and recalling products.

- `onlyRegistered`
  - requires `participants[msg.sender].isActive == true`
  - used for product creation and tracking updates.

## Main functions (code-level)

## `registerParticipant(address _addr, string _name, string _role)`

- Access: `onlyOwner`
- Behavior:
  - Adds an active participant
  - Emits `ParticipantRegistered`

## `createProduct(string _name, string _sku, string _origin, string _initialLocation, string _latitude, string _longitude)`

- Access: `onlyRegistered`
- Validations:
  - SKU must be unique (`skuExists[_sku] == false`)
  - name must be non-empty
- Behavior:
  - increments `productCount`
  - writes product struct
  - creates initial tracking event
  - emits `ProductCreated`

## `updateTracking(uint256 _productId, string _location, string _description, ProductStatus _status, string _latitude, string _longitude)`

- Access: `onlyRegistered` + `productExists`
- Validations:
  - cannot update a recalled product
- Behavior:
  - updates `products[_productId].status`
  - appends a new `TrackingEvent`
  - emits `ProductTracked`

## `recallProduct(uint256 _productId, string _reason)`

- Access: `onlyOwner` + `productExists`
- Behavior:
  - sets status to `Recalled`
  - appends recall tracking event
  - emits `ProductRecalled`

## Read functions

- `getTrackingHistory(productId)`
- `getTrackingCount(productId)`
- `getProduct(productId)`
- `getParticipant(address)`
- `getParticipantCount()`
- `verifyProduct(sku)`

## Notes / limitations

- `verifyProduct(sku)` currently loops from `1..productCount` which is fine for a demo but can be expensive on large datasets.
- Role is stored as a string; the contract enforces registration but does not enforce role-specific permissions beyond registration.
