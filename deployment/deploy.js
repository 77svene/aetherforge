const { deployments, getNamedAccounts, ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const { deployer } = await getNamedAccounts();
  console.log("Deploying contracts with account:", deployer);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer)).toString());

  // Deploy AccessControl (MyAccessControl)
  const accessControl = await deployments.deploy("MyAccessControl", {
    from: deployer,
    args: [],
    log: true,
  });
  console.log("MyAccessControl deployed to:", accessControl.address);

  // Deploy NebulaToken
  const nebulaToken = await deployments.deploy("NebulaToken", {
    from: deployer,
    args: [],
    log: true,
  });
  console.log("NebulaToken deployed to:", nebulaToken.address);

  // Deploy a mock ERC721 for the Vault to use (using OpenZeppelin's ERC721)
  const MockERC721 = await ethers.getContractFactory("@openzeppelin/contracts/token/ERC721/ERC721.sol:ERC721");
  const mockERC721 = await MockERC721.deploy("Mock NFT", "MNFT");
  await mockERC721.deployed();
  console.log("MockERC721 deployed to:", mockERC721.address);

  // Deploy Vault (requires NFT contract and NebulaToken addresses)
  const vault = await deployments.deploy("Vault", {
    from: deployer,
    args: [mockERC721.address, nebulaToken.address],
    log: true,
  });
  console.log("Vault deployed to:", vault.address);

  // Deploy Registry
  const registry = await deployments.deploy("Registry", {
    from: deployer,
    args: [],
    log: true,
  });
  console.log("Registry deployed to:", registry.address);

  // Deploy Fractionalizer
  const fractionalizer = await deployments.deploy("Fractionalizer", {
    from: deployer,
    args: [vault.address, nebulaToken.address, registry.address],
    log: true,
  });
  console.log("Fractionalizer deployed to:", fractionalizer.address);

  // Deploy RentalManager  const rentalManager = await deployments.deploy("RentalManager", {
    from: deployer,
    args: [vault.address, nebulaToken.address, registry.address],
    log: true,
  });
  console.log("RentalManager deployed to:", rentalManager.address);

  // Deploy LendingPool
  const lendingPool = await deployments.deploy("LendingPool", {
    from: deployer,
    args: [vault.address, nebulaToken.address, registry.address],
    log: true,
  });
  console.log("LendingPool deployed to:", lendingPool.address);

  // Deploy BridgeAdapter
  const bridgeAdapter = await deployments.deploy("BridgeAdapter", {
    from: deployer,
    args: [vault.address, nebulaToken.address, registry.address],
    log: true,
  });
  console.log("BridgeAdapter deployed to:", bridgeAdapter.address);

  // Save deployment addresses to a file for link.js and verify.js
  const deploymentData = {
    accessControl: accessControl.address,
    nebulaToken: nebulaToken.address,
    vault: vault.address,
    mockERC721: mockERC721.address,
    registry: registry.address,
    fractionalizer: fractionalizer.address,
    rentalManager: rentalManager.address,
    lendingPool: lendingPool.address,
    bridgeAdapter: bridgeAdapter.address,
  };

  const deploymentsDir = "./deployment";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  fs.writeFileSync(
    `${deploymentsDir}/sepolia-deployments.json`,
    JSON.stringify(deploymentData, null, 2)
  );
  console.log("Deployment addresses saved to deployment/sepolia-deployments.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });