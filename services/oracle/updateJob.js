require('dotenv').config();
const { ethers } = require("ethers");
const aggregator = require("./aggregator");
const priceFeed = require("./priceFeed");

// Configuration
const RPC_URL = process.env.RPC_URL || "http://localhost:8545";
const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Default to a mock address
const KEEPER_PRIVATE_KEY = process.env.KEEPER_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Hardhat default
const UPDATE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const VAULT_ABI = [
  "function setPrice(uint256 price) external"
];

async function initialize() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(KEEPER_PRIVATE_KEY, provider);
  const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
  
  console.log(`Oracle keeper initialized:
  - RPC: ${RPC_URL}
  - Vault: ${VAULT_ADDRESS}
  - Keeper: ${await signer.getAddress()}
  - Update interval: ${UPDATE_INTERVAL_MS / 1000}s`);
    return { provider, signer, vault };
}

async function updatePrice(vault) {
  try {
    // Get median price from aggregator (in USD with 8 decimals like Chainlink)
    const medianPrice = await aggregator.getMedianPrice();
    
    if (medianPrice.eq(0)) {
      console.warn("Median price is zero, skipping update");
      return;
    }
    
    console.log(`Fetching median price: ${ethers.formatUnits(medianPrice, 8)} USD`);
    
    // Call vault.setPrice(uint256 price)
    const tx = await vault.setPrice(medianPrice);
    console.log(`Transaction sent: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    
  } catch (error) {
    console.error("Error updating price:", error.message);
  }
}

async function run() {
  let { vault } = await initialize();
  
  // Run immediately on start
  await updatePrice(vault);
    // Then run at intervals
  setInterval(async () => {
    await updatePrice(vault);
  }, UPDATE_INTERVAL_MS);
    // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log("\nShutting down oracle keeper...");
    process.exit(0);
  });
}

// Run if called directly
if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run, updatePrice };