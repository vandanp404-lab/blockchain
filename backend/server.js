const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const embeddedContractAbi = require("./contract/SupplyChain.abi.json");

const app = express();
const PORT = process.env.PORT || 5000;
       
// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Load blockchain config
let deploymentConfig = null;
let contractABI = null;
let provider = null;
let contract = null;

function loadBlockchainConfig() {
  try {
    const configPath = path.join(__dirname, "config/deployment.json");
    const abiPath = path.join(__dirname, "config/SupplyChain.abi.json");

    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
    const envContractAddress = process.env.CONTRACT_ADDRESS;

    if (fs.existsSync(configPath)) {
      deploymentConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    }

    if (fs.existsSync(abiPath)) {
      contractABI = JSON.parse(fs.readFileSync(abiPath, "utf8"));
    } else {
      contractABI = embeddedContractAbi;
    }

    const contractAddress = envContractAddress || deploymentConfig?.contractAddress;
    if (!contractAddress) {
      console.log(
        "⚠️  No contract address found. Set CONTRACT_ADDRESS (recommended for production) or run deploy script locally."
      );
      return false;
    }

    provider = new ethers.JsonRpcProvider(rpcUrl);

    contract = new ethers.Contract(
      contractAddress,
      contractABI,
      provider
    );

    if (!deploymentConfig) {
      deploymentConfig = {
        contractAddress,
        network: process.env.NETWORK_NAME || "unknown",
        chainId: process.env.CHAIN_ID || "unknown",
      };
    }

    console.log(
      "✅ Blockchain connected:",
      contractAddress
    );
    return true;
  } catch (error) {
    console.error("❌ Blockchain config error:", error.message);
    return false;
  }
}

// Helper: Get signer for write operations
async function getSigner(privateKey) {
  const signer = new ethers.Wallet(privateKey, provider);
  return new ethers.Contract(
    deploymentConfig.contractAddress,
    contractABI,
    signer
  );
}

// Helper: Convert status number to string
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
//  ROUTES
// ─────────────────────────────────────────────

// Health check
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

// Get deployment config
app.get("/api/config", (req, res) => {
  if (!deploymentConfig) {
    return res.status(503).json({ error: "Blockchain not configured" });
  }
  res.json({
    contractAddress: deploymentConfig.contractAddress,
    network: deploymentConfig.network,
    chainId: deploymentConfig.chainId,
    accounts: deploymentConfig.accounts,
  });
});

// ── PRODUCTS ──────────────────────────────────

// GET all products
app.get("/api/products", async (req, res) => {
  if (!contract) return res.status(503).json({ error: "Blockchain not connected" });

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
          statusCode: Number(p.status),
          trackingEvents: Number(trackingCount),
        });
      } catch (e) {
        // Skip invalid products
      }
    }

    res.json({ success: true, data: products, total: products.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single product
app.get("/api/products/:id", async (req, res) => {
  if (!contract) return res.status(503).json({ error: "Blockchain not connected" });

  try {
    const productId = req.params.id;
    const p = await contract.getProduct(productId);

    res.json({
      success: true,
      data: {
        id: Number(p.id),
        name: p.name,
        sku: p.sku,
        origin: p.origin,
        manufacturer: p.manufacturer,
        createdAt: new Date(Number(p.createdAt) * 1000).toISOString(),
        status: statusToString(Number(p.status)),
        statusCode: Number(p.status),
      },
    });
  } catch (error) {
    res.status(404).json({ error: "Product not found" });
  }
});

// POST create product
app.post("/api/products", async (req, res) => {
  if (!contract) return res.status(503).json({ error: "Blockchain not connected" });

  try {
    const { name, sku, origin, initialLocation, latitude, longitude, privateKey } = req.body;

    if (!name || !sku || !origin) {
      return res.status(400).json({ error: "name, sku, origin are required" });
    }

    const signerKey = privateKey || deploymentConfig.privateKeys?.manufacturer;
    if (!signerKey) {
      return res.status(400).json({ error: "Private key required" });
    }

    const contractWithSigner = await getSigner(signerKey);

    const tx = await contractWithSigner.createProduct(
      name,
      sku,
      origin,
      initialLocation || origin,
      latitude || "0",
      longitude || "0"
    );

    const receipt = await tx.wait();

    // Get the new product count
    const count = await contract.productCount();

    res.status(201).json({
      success: true,
      message: "Product created on blockchain",
      data: {
        productId: Number(count),
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        name,
        sku,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── TRACKING ──────────────────────────────────

// GET tracking history for a product
app.get("/api/products/:id/tracking", async (req, res) => {
  if (!contract) return res.status(503).json({ error: "Blockchain not connected" });

  try {
    const productId = req.params.id;
    const history = await contract.getTrackingHistory(productId);

    const formatted = history.map((event, index) => ({
      index,
      productId: Number(event.productId),
      location: event.location,
      description: event.description,
      handler: event.handler,
      timestamp: new Date(Number(event.timestamp) * 1000).toISOString(),
      status: statusToString(Number(event.status)),
      statusCode: Number(event.status),
      coordinates: {
        latitude: event.latitude,
        longitude: event.longitude,
      },
    }));

    res.json({ success: true, data: formatted, total: formatted.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST update tracking
app.post("/api/products/:id/tracking", async (req, res) => {
  if (!contract) return res.status(503).json({ error: "Blockchain not connected" });

  try {
    const productId = req.params.id;
    const { location, description, status, latitude, longitude, privateKey } = req.body;

    if (!location || status === undefined) {
      return res.status(400).json({ error: "location and status required" });
    }

    const signerKey = privateKey || deploymentConfig.privateKeys?.supplier;
    const contractWithSigner = await getSigner(signerKey);

    const tx = await contractWithSigner.updateTracking(
      productId,
      location,
      description || "",
      status,
      latitude || "0",
      longitude || "0"
    );

    const receipt = await tx.wait();

    res.json({
      success: true,
      message: "Tracking updated on blockchain",
      data: {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        productId: Number(productId),
        location,
        status: statusToString(status),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── PARTICIPANTS ──────────────────────────────

// GET participant
app.get("/api/participants/:address", async (req, res) => {
  if (!contract) return res.status(503).json({ error: "Blockchain not connected" });

  try {
    const participant = await contract.getParticipant(req.params.address);
    res.json({
      success: true,
      data: {
        address: participant.addr,
        name: participant.name,
        role: participant.role,
        isActive: participant.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST register participant
app.post("/api/participants", async (req, res) => {
  if (!contract) return res.status(503).json({ error: "Blockchain not connected" });

  try {
    const { address, name, role, privateKey } = req.body;

    if (!address || !name || !role) {
      return res.status(400).json({ error: "address, name, role required" });
    }

    const signerKey = privateKey || deploymentConfig.privateKeys?.deployer;
    const contractWithSigner = await getSigner(signerKey);

    const tx = await contractWithSigner.registerParticipant(address, name, role);
    const receipt = await tx.wait();

    res.status(201).json({
      success: true,
      message: "Participant registered on blockchain",
      data: {
        transactionHash: receipt.hash,
        address,
        name,
        role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── VERIFICATION ──────────────────────────────

// GET verify product by SKU
app.get("/api/verify/:sku", async (req, res) => {
  if (!contract) return res.status(503).json({ error: "Blockchain not connected" });

  try {
    const sku = req.params.sku;
    const [isValid, productId] = await contract.verifyProduct(sku);

    if (isValid) {
      const product = await contract.getProduct(productId);
      res.json({
        success: true,
        authentic: true,
        data: {
          productId: Number(productId),
          name: product.name,
          sku: product.sku,
          origin: product.origin,
          manufacturer: product.manufacturer,
          status: statusToString(Number(product.status)),
        },
      });
    } else {
      res.json({ success: true, authentic: false, message: "Product not found - may be counterfeit" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── REPORTS ──────────────────────────────────

// GET supply chain analytics report
app.get("/api/reports/analytics", async (req, res) => {
  if (!contract) return res.status(503).json({ error: "Blockchain not connected" });

  try {
    const count = await contract.productCount();
    const stats = { total: 0, created: 0, inTransit: 0, atWarehouse: 0, inCustoms: 0, delivered: 0, recalled: 0 };
    const products = [];

    for (let i = 1; i <= Number(count); i++) {
      try {
        const p = await contract.getProduct(i);
        const statusCode = Number(p.status);
        stats.total++;

        if (statusCode === 0) stats.created++;
        else if (statusCode === 1) stats.inTransit++;
        else if (statusCode === 2) stats.atWarehouse++;
        else if (statusCode === 3) stats.inCustoms++;
        else if (statusCode === 4) stats.delivered++;
        else if (statusCode === 5) stats.recalled++;

        products.push({
          id: Number(p.id),
          name: p.name,
          sku: p.sku,
          status: statusToString(statusCode),
          manufacturer: p.manufacturer,
        });
      } catch (e) {}
    }

    res.json({
      success: true,
      data: {
        summary: stats,
        products,
        generatedAt: new Date().toISOString(),
        blockchain: {
          contractAddress: deploymentConfig.contractAddress,
          network: deploymentConfig.network,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log("\n🔗 Supply Chain Blockchain API");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🌐 Server running on http://localhost:${PORT}`);
  console.log(`📡 API Base: http://localhost:${PORT}/api`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  loadBlockchainConfig();
});

module.exports = app;
