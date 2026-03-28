const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Fractionalizer", function () {
  let fractionalizer;
  let mockNFT;
  let owner;
  let addr1;
  let addr2;
  const TOKEN_ID = 1;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy a mock ERC721 NFT contract
    const MockNFT = await ethers.getContractFactory("MockERC721");
    mockNFT = await MockNFT.deploy();
    await mockNFT.deployed();

    // Mint an NFT to addr1 for testing
    await mockNFT.mint(addr1.address, TOKEN_ID);

    // Deploy Fractionalizer
    const Fractionalizer = await ethers.getContractFactory("Fractionalizer");
    fractionalizer = await Fractionalizer.deploy(mockNFT.address);
    await fractionalizer.deployed();

    // Approve Fractionalizer to transfer the NFT from addr1
    await mockNFT.connect(addr1).setApprovalForAll(fractionalizer.address, true);
  });

  it("Should deposit NFT and mint shares", async function () {
    const initialShares = await fractionalizer.sharesOf(addr1.address);
    expect(initialShares).to.equal(0);

    // Deposit NFT    await fractionalizer.connect(addr1).deposit(TOKEN_ID);

    // Check shares minted (assuming 1e18 shares per NFT)
    const sharesAfter = await fractionalizer.sharesOf(addr1.address);
    expect(sharesAfter).to.equal(ethers.utils.parseEther("1"));

    // Check NFT is now held by Fractionalizer
    expect(await mockNFT.ownerOf(TOKEN_ID)).to.equal(fractionalizer.address);
  });

  it("Should withdraw NFT by burning shares", async function () {
    // Deposit NFT first
    await fractionalizer.connect(addr1).deposit(TOKEN_ID);

    // Withdraw NFT
    await fractionalizer.connect(addr1).withdraw(ethers.utils.parseEther("1"));

    // Check shares burned
    const sharesAfter = await fractionalizer.sharesOf(addr1.address);
    expect(sharesAfter).to.equal(0);

    // Check NFT returned to user
    expect(await mockNFT.ownerOf(TOKEN_ID)).to.equal(addr1.address);
  });

  it("Should revert if insufficient shares for withdrawal", async function () {
    await expect(
      fractionalizer.connect(addr1).withdraw(ethers.utils.parseEther("1"))
    ).to.be.revertedWith("ERC20: burn amount exceeds balance");
  });

  it("Should revert if depositing unapproved NFT", async function () {
    // Transfer NFT to addr2 without approval
    await mockNFT.connect(addr1).transferFrom(addr1.address, addr2.address, TOKEN_ID);
    await mockNFT.connect(addr2).setApprovalForAll(fractionalizer.address, true);

    // Try to deposit from addr1 (who no longer owns the NFT)
    await expect(
      fractionalizer.connect(addr1).deposit(TOKEN_ID)
    ).to.be.revertedWith("ERC721: transfer caller is not owner nor approved");
  });
});

// Mock ERC721 contract for testing
contract MockERC721 {
    function mint(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function ownerOf(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
}