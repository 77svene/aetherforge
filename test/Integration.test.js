const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Integration: Full User Journey", function () {
  // -------------------------------------------------------------------------
  // Fixture: deploy all contracts and mocks needed for the endtoend flow
  // -------------------------------------------------------------------------
  async function deployFixture() {
    const [deployer, user, renter, lender] = await ethers.getSigners();

    // 1 Deploy a minimal ERC721 mock for testing NFT deposits
    const MockERC721 = await ethers.getContractFactory("MockERC721");
    const nft = await MockERC721.deploy("AetherForge Test NFT", "AFT");
    await nft.deployed();

    // 2 Deploy the NebulaToken (share token) -- used by Vault
    const NebulaToken = await ethers.getContractFactory("NebulaToken");
    const nebula = await NebulaToken.deploy();
    await nebula.deployed();

    // 3 Deploy the Vault, passing the NebulaToken address    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(nebula.target);
    await vault.deployed();

    // Initialize the vault with the NFT contract (assumes an internal init function)
    await vault.initialize(nft.target);

    // 4 Deploy the Fractionalizer module
    const Fractionalizer = await ethers.getContractFactory("Fractionalizer");
    const fractionalizer = await Fractionalizer.deploy();
    await fractionalizer.deployed();

    // 5 Deploy the RentalManager, linking the Fractionalizer address
    const RentalManager = await ethers.getContractFactory("RentalManager");
    const rental = await RentalManager.deploy(fractionalizer.target);
    await rental.deployed();

    // 6 Deploy a simple LendingPool mock that supports takeLoan / repayLoan
    const LendingPool = await ethers.getContractFactory("LendingPool");
    const lending = await LendingPool.deploy(nebula.target);
    await lending.deployed();

    // 7 Deploy a Mock LI.FI Adapter that implements the expected crosschain view
    const MockLIAdapter = await ethers.getContractFactory("MockLIAdapter");
    const liAdapter = await MockLIAdapter.deploy();
    await liAdapter.deployed();

    return {
      deployer,
      user,
      renter,
      lender,
      nft,
      nebula,
      vault,
      fractionalizer,
      rental,
      lending,
      liAdapter,
    };
  }

  // -------------------------------------------------------------------------
  // Test: endtoend flow
  // -------------------------------------------------------------------------
  it("should complete deposit  fractionalize  rent  loan  withdraw cycle", async function () {
    const {
      deployer,
      user,
      renter,
      lender,
      nft,
      nebula,
      vault,
      fractionalizer,
      rental,
      lending,
      liAdapter,
    } = await loadFixture(deployFixture);

    // -------------------------------------------------
    // 1 Deposit NFT into the Vault
    // -------------------------------------------------
    await expect(vault.connect(user).deposit(nft.target, 1))
      .to.emit(vault, "Deposited")
      .withArgs(nft.target, 1, user.address);

    // Verify that the user receives Nebula shares
    const userShareBalance = await nebula.balanceOf(user.address);
    expect(userShareBalance).to.be.gt(0);

    // -------------------------------------------------
    // 2 Fractionalize shares via Fractionalizer
    // -------------------------------------------------
    const mintAmount = ethers.parseUnits("1000", 18); // 1000 shares
    await expect(fractionalizer.connect(user).mintShares(user.address, mintAmount))
      .to.emit(fractionalizer, "Transfer")
      .withArgs(ethers.ZeroAddress, user.address, mintAmount);

    // -------------------------------------------------
    // 3 Rent a share of the NFT
    // -------------------------------------------------
    const rentPrice = ethers.parseUnits("0.1", 18); // 0.1 Nebula per hour
    const duration = 3600; // 1 hour

    await expect(
      rental
        .connect(renter)
        .rentShares(user.address, mintAmount, rentPrice, duration)
    )
      .to.emit(rental, "RentStarted")
      .withArgs(user.address, mintAmount, rentPrice, duration);

    // -------------------------------------------------
    // 4 Take a loan against the rented share
    // -------------------------------------------------    const loanAmount = ethers.parseUnits("50", 18); // 50 Nebula
    await expect(lending.connect(lender).takeLoan(user.address, loanAmount))
      .to.emit(lending, "LoanIssued")
      .withArgs(user.address, loanAmount);

    // Simulate loan repayment (no interest for simplicity)
    await expect(lending.connect(lender).repayLoan(user.address, loanAmount))
      .to.emit(lending, "LoanRepaid")
      .withArgs(user.address, loanAmount);

    // -------------------------------------------------    // 5 Withdraw the NFT after the loan is settled
    // -------------------------------------------------
    const tokenIdBefore = await nft.balanceOf(user.address);
    await expect(vault.connect(user).withdraw(userShareBalance))
      .to.emit(vault, "Withdrawn")
      .withArgs(nft.target, 1, user.address);

    // Ensure the NFT is back in the user's possession
    const tokenIdAfter = await nft.balanceOf(user.address);
    expect(tokenIdAfter).to.equal(tokenIdBefore);

    // -------------------------------------------------
    // 6 Verify crosschain state via mock LI.FI adapter
    // -------------------------------------------------
    // The adapter should reflect the updated vault state after withdraw
    const adapterState = await liAdapter.getVaultState(vault.target);
    expect(adapterState.lastWithdrawTimestamp).to.be.gt(0);
  });
});