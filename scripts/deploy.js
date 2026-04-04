const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying SupplyChain contract...\n");

  // Get signers
  const [deployer, manufacturer, supplier, distributor, retailer] =
    await hre.ethers.getSigners();

  console.log("📋 Deployer address:", deployer.address);
  console.log(
    "💰 Deployer balance:",
    hre.ethers.formatEther(
      await hre.ethers.provider.getBalance(deployer.address)
    ),
    "ETH\n"
  );

  // Deploy contract
  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy();
  await supplyChain.waitForDeployment();

  const contractAddress = await supplyChain.getAddress();
  console.log("✅ SupplyChain deployed to:", contractAddress);

  // Register sample participants
  console.log("\n📝 Registering participants...");

  await supplyChain.registerParticipant(
    manufacturer.address,
    "TechManufacturers Inc",
    "manufacturer"
  );
  console.log("  ✓ Manufacturer registered:", manufacturer.address);

  await supplyChain.registerParticipant(
    supplier.address,
    "Global Suppliers Ltd",
    "supplier"
  );
  console.log("  ✓ Supplier registered:", supplier.address);

  await supplyChain.registerParticipant(
    distributor.address,
    "FastTrack Distributors",
    "distributor"
  );
  console.log("  ✓ Distributor registered:", distributor.address);

  await supplyChain.registerParticipant(
    retailer.address,
    "MegaMart Retail",
    "retailer"
  );
  console.log("  ✓ Retailer registered:", retailer.address);

  // Create sample products
  console.log("\n📦 Creating sample products...");

  const tx1 = await supplyChain
    .connect(manufacturer)
    .createProduct(
      "Premium Laptop X1",
      "LAPTOP-X1-2024-001",
      "Shenzhen, China",
      "Shenzhen Factory",
      "22.5431",
      "114.0579"
    );
  const receipt1 = await tx1.wait();
  console.log("  ✓ Product 1 created: Premium Laptop X1");

  const tx2 = await supplyChain
    .connect(manufacturer)
    .createProduct(
      "Wireless Headphones Pro",
      "HEADPH-PRO-2024-002",
      "Seoul, South Korea",
      "Seoul Manufacturing Plant",
      "37.5665",
      "126.9780"
    );
  await tx2.wait();
  console.log("  ✓ Product 2 created: Wireless Headphones Pro");

  const tx3 = await supplyChain
    .connect(manufacturer)
    .createProduct(
      "Smart Watch Series 5",
      "SWATCH-S5-2024-003",
      "Tokyo, Japan",
      "Tokyo Assembly Line",
      "35.6762",
      "139.6503"
    );
  await tx3.wait();
  console.log("  ✓ Product 3 created: Smart Watch Series 5");

  // Add tracking events for product 1
  console.log("\n🔄 Adding tracking events for Product 1...");

  await supplyChain
    .connect(supplier)
    .updateTracking(
      1,
      "Hong Kong Port",
      "Cleared for export, loaded onto vessel",
      1,
      "22.3193",
      "114.1694"
    );
  console.log("  ✓ Product 1: Departed Hong Kong Port");

  await supplyChain
    .connect(distributor)
    .updateTracking(
      1,
      "Dubai Customs",
      "Customs inspection completed",
      3,
      "25.2048",
      "55.2708"
    );
  console.log("  ✓ Product 1: Cleared Dubai Customs");

  await supplyChain
    .connect(retailer)
    .updateTracking(
      1,
      "MegaMart Warehouse, Mumbai",
      "Received at regional warehouse",
      2,
      "19.0760",
      "72.8777"
    );
  console.log("  ✓ Product 1: Arrived at Mumbai Warehouse");

  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployedAt: new Date().toISOString(),
    accounts: {
      deployer: deployer.address,
      manufacturer: manufacturer.address,
      supplier: supplier.address,
      distributor: distributor.address,
      retailer: retailer.address,
    },
    privateKeys: {
      // These are Hardhat's default test private keys - NEVER use in production
      deployer:
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      manufacturer:
        "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
      supplier:
        "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
      distributor:
        "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
      retailer:
        "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
    },
  };

  // Save to backend config
  const backendConfigPath = path.join(
    __dirname,
    "../backend/config/deployment.json"
  );
  fs.mkdirSync(path.dirname(backendConfigPath), { recursive: true });
  fs.writeFileSync(backendConfigPath, JSON.stringify(deploymentInfo, null, 2));

  // Save ABI to backend
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/SupplyChain.sol/SupplyChain.json"
  );

  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const abiPath = path.join(__dirname, "../backend/config/SupplyChain.abi.json");
    fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
    console.log("\n💾 ABI saved to backend/config/");
  }

  // Save to frontend
  const frontendConfigPath = path.join(
    __dirname,
    "../frontend/src/config/deployment.json"
  );
  fs.mkdirSync(path.dirname(frontendConfigPath), { recursive: true });
  fs.writeFileSync(
    frontendConfigPath,
    JSON.stringify(
      {
        contractAddress,
        chainId: deploymentInfo.chainId,
        network: deploymentInfo.network,
      },
      null,
      2
    )
  );

  // Copy ABI to frontend
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const frontendAbiPath = path.join(
      __dirname,
      "../frontend/src/config/SupplyChain.abi.json"
    );
    fs.writeFileSync(frontendAbiPath, JSON.stringify(artifact.abi, null, 2));
    console.log("💾 ABI saved to frontend/src/config/");
  }

  console.log("\n✅ Deployment complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Contract Address:", contractAddress);
  console.log("Network:", hre.network.name);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📌 Next Steps:");
  console.log("1. cd backend && npm install && node server.js");
  console.log("2. cd frontend && npm install && npm start");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
