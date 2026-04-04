# ChainTrack Documentation

## Contents

- [01 - Quick Start](./01-quick-start.md)
- [02 - Architecture & Data Flow](./02-architecture-and-data-flow.md)
- [03 - Smart Contract (SupplyChain.sol)](./03-smart-contract.md)
- [04 - Backend API (Express)](./04-backend-api.md)
- [05 - Frontend (React)](./05-frontend.md)
- [06 - Troubleshooting & FAQ](./06-troubleshooting.md)

## Project Summary

ChainTrack is a full-stack blockchain supply chain tracking system built with:

- Hardhat + Solidity smart contract for immutable storage of products, participants, and tracking history.
- Node.js + Express backend for a REST API that reads/writes on-chain data via ethers.js.
- React frontend that consumes the REST API and displays dashboards, product pages, tracking history, verification, and reports.

## How to Use This Documentation

- Start with **01 - Quick Start** to run the app locally.
- Use **02 - Architecture & Data Flow** to understand how components communicate.
- Use **03/04/05** for code-level details per layer.
- Use **06** when something fails during run/deploy or when API/chain connectivity issues occur.
