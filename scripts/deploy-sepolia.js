const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying SupplyChain contract to Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();

  console.log("📋 Deployer address:", deployer.address);
  console.log(
    "💰 Deployer balance:",
    hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)),
    "ETH\n"
  );

  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy();
  await supplyChain.waitForDeployment();

  const contractAddress = await supplyChain.getAddress();

  console.log("✅ SupplyChain deployed to:", contractAddress);
  console.log("🌐 Network:", hre.network.name);
  console.log("🔗 ChainId:", (await hre.ethers.provider.getNetwork()).chainId.toString());

  console.log("\n📌 Next steps (important):");
  console.log("1) Set backend env CONTRACT_ADDRESS =", contractAddress);
  console.log("2) Set backend env BLOCKCHAIN_RPC_URL = your Sepolia RPC URL");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
