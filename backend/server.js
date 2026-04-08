const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { ethers } = require("ethers");
require("dotenv").config();

const embeddedContractAbi = require("./contract/SupplyChain.abi.json");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ IMPORTANT FOR RENDER
app.set("trust proxy", 1);

// ✅ CORS (ALLOW FRONTEND URL)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);

app.use(helmet());
app.use(morgan("combined"));
app.use(express.json());

// ─────────────────────────────────────────────
// BLOCKCHAIN CONFIG
// ─────────────────────────────────────────────

let deploymentConfig = null;
let contractABI = null;
let provider = null;
let contract = null;

function loadBlockchainConfig() {
  try {
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!rpcUrl || !contractAddress) {
      console.log("⚠️ Missing BLOCKCHAIN_RPC_URL or CONTRACT_ADDRESS");
      return false;
    }

    contractABI = embeddedContractAbi;
    provider = new ethers.JsonRpcProvider(rpcUrl);

    contract = new ethers.Contract(contractAddress, contractABI, provider);

    deploymentConfig = {
      contractAddress,
      network: process.env.NETWORK_NAME || "unknown",
      chainId: process.env.CHAIN_ID || "unknown",
    };

    console.log("✅ Blockchain connected:", contractAddress);
    return true;
  } catch (error) {
    console.error("❌ Blockchain config error:", error.message);
    return false;
  }
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

async function getSigner(privateKey) {
  const signer = new ethers.Wallet(privateKey, provider);
  return new ethers.Contract(
    deploymentConfig.contractAddress,
    contractABI,
    signer
  );
}

function statusToString(statusNum) {
  const statuses = [
    "Created",
    "In Transit",
    "At Warehouse",
    "In Customs",
    "Delivered",
    "Recalled",
  ];
  return statuses[statusNum] || "Unknown";
}

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────

// Health
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    blockchain: deploymentConfig
      ? {
          connected: true,
          address: deploymentConfig.contractAddress,
          network: deploymentConfig.network,
        }
      : { connected: false },
    timestamp: new Date().toISOString(),
  });
});

// CONFIG
app.get("/api/config", (req, res) => {
  if (!deploymentConfig) {
    return res.status(503).json({ error: "Blockchain not configured" });
  }
  res.json(deploymentConfig);
});

// ─────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────

app.get("/api/products", async (req, res) => {
  if (!contract)
    return res.status(503).json({ error: "Blockchain not connected" });

  try {
    const count = await contract.productCount();
    const products = [];

    for (let i = 1; i <= Number(count); i++) {
      try {
        const p = await contract.getProduct(i);
        const trackingCount = await contract.getTrackingCount(i);

        products.push({
          id: Number(p.id),
          name: p.name,
          sku: p.sku,
          origin: p.origin,
          manufacturer: p.manufacturer,
          createdAt: new Date(Number(p.createdAt) * 1000).toISOString(),
          status: statusToString(Number(p.status)),
          trackingEvents: Number(trackingCount),
        });
      } catch {}
    }

    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE PRODUCT
app.post("/api/products", async (req, res) => {
  try {
    const { name, sku, origin, privateKey } = req.body;

    if (!name || !sku || !origin) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const signerKey = privateKey || process.env.PRIVATE_KEY;
    if (!signerKey)
      return res.status(400).json({ error: "Private key required" });

    const contractWithSigner = await getSigner(signerKey);

    const tx = await contractWithSigner.createProduct(
      name,
      sku,
      origin,
      origin,
      "0",
      "0"
    );

    const receipt = await tx.wait();

    res.status(201).json({
      success: true,
      txHash: receipt.hash,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GLOBAL HANDLERS
// ─────────────────────────────────────────────

app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  loadBlockchainConfig();
});

module.exports = app;