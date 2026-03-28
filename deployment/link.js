const fs = require('fs');
const { ethers } = require("hardhat");

async function main() {
  // Read deployment outputs from deploy.js
  const deployments = JSON.parse(fs.readFileSync('./deployments.json', 'utf8'));
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  
  // Get core contract addresses
  const registryAddress = deployments.Registry;
  const vaultAddress = deployments.Vault;
  
  if (!registryAddress || registryAddress === ethers.constants.AddressZero) {
    throw new Error("Registry address is zero or undefined");
  }
  if (!vaultAddress || vaultAddress === ethers.constants.AddressZero) {
    throw new Error("Vault address is zero or undefined");
  }
  
  // Get contract instances
  const registry = await ethers.getContractAt("Registry", registryAddress, deployer);
  const vault = await ethers.getContractAt("Vault", vaultAddress, deployer);
  
  // Define core contracts to skip
  const coreContracts = ["Vault", "NebulaToken", "AccessControl", "Registry"];
  
  // Link each module to Registry
  for (const [key, value] of Object.entries(deployments)) {
    if (coreContracts.includes(key)) continue;
    
    // Handle different deployment output formats
    let moduleId, moduleAddr;
    if (typeof value === 'object' && value !== null) {
      // New format: { moduleId: "0x...", address: "0x..." }
      moduleId = value.moduleId;
      moduleAddr = value.address;
    } else if (typeof value === 'string') {
      // Legacy format: direct address, generate moduleId from key
      moduleId = ethers.utils.id(key);
      moduleAddr = value;
    } else {
      throw new Error(`Invalid deployment format for ${key}`);
    }
    
    // Validate addresses
    if (!moduleAddr || moduleAddr === ethers.constants.AddressZero) {
      throw new Error(`Zero address for module ${key}`);
    }
    if (!moduleId || !ethers.utils.isHexString(moduleId)) {
      throw new Error(`Invalid moduleId for ${key}: ${moduleId}`);
    }
    
    // Register module in Registry
    console.log(`Registering ${key} (moduleId: ${moduleId}) at ${moduleAddr}`);
    await registry.registerModule(moduleId, moduleAddr);
    console.log(` Registered ${key}`);
  }
  
  // Initialize modules in Vault
  console.log("Initializing modules in Vault...");
  await vault.initializeModules();
  console.log(" Modules initialized");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(" Linking failed:", error);
    process.exit(1);
  });