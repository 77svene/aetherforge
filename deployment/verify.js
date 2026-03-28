const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const deploymentPath = "../deployments/sepolia.json";

  if (!fs.existsSync(deploymentPath)) {
    console.error(`Deployment file not found at ${deploymentPath}`);
    process.exit(1);
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  for (const [name, data] of Object.entries(deployments)) {
    console.log(`Verifying ${name} at ${data.address}`);
    try {
      // We assume the hardhat-etherscan plugin is available
      await hre.run("etherscan-verify", {
        address: data.address,
        constructorArguments: data.args
      });
      console.log(`Successfully verified ${name}`);
    } catch (error) {
      console.error(`Failed to verify ${name}:`, error.message);
      // Continue to verify other contracts
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });"}]