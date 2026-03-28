const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vault", function () {
  let vault, nebulaToken, nft, owner, user;
  const SHARES_PER_NFT = ethers.parseEther("1"); // 1e18 shares per NFT

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy NebulaToken    const NebulaToken = await ethers.getContractFactory("NebulaToken");
    nebulaToken = await NebulaToken.deploy();
    await nebulaToken.waitForDeployment();

    // Deploy mock ERC721 NFT    const MockERC721 = await ethers.getContractFactory("ERC721Mock");
    nft = await MockERC721.deploy("MockNFT", "MNFT");
    await nft.waitForDeployment();

    // Mint an NFT to user for testing
    await nft.mint(user.address, 1);

    // Deploy Vault    const Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy(await nft.getAddress(), await nebulaToken.getAddress());
    await vault.waitForDeployment();

    // Grant Vault minter role on NebulaToken
    const MINTER_ROLE = await nebulaToken.MINTER_ROLE();
    await nebulaToken.grantRole(MINTER_ROLE, await vault.getAddress());
  });

  describe("Deposit", function () {
    it("should deposit NFT and mint shares", async function () {
      // Approve vault to transfer NFT      await nft.connect(user).setApprovalForAll(await vault.getAddress(), true);

      // Deposit NFT
      await expect(vault.connect(user).deposit(await nft.getAddress(), 1))
        .to.emit(vault, "Deposited")
        .withArgs(await nft.getAddress(), 1, user.address);

      // Verify NFT transferred to vault
      expect(await nft.ownerOf(1)).to.equal(await vault.getAddress());

      // Verify user received shares
      expect(await nebulaToken.balanceOf(user.address)).to.equal(SHARES_PER_NFT);
    });

    it("should revert if NFT not approved", async function () {
      await expect(
        vault.connect(user).deposit(await nft.getAddress(), 1)
      ).to.be.revertedWith("ERC721: transfer caller is not owner nor approved");
    });

    it("should revert if already deposited", async function () {
      await nft.connect(user).setApprovalForAll(await vault.getAddress(), true);
      await vault.connect(user).deposit(await nft.getAddress(), 1);

      await expect(
        vault.connect(user).deposit(await nft.getAddress(), 1)
      ).to.be.revertedWith("Vault: NFT already deposited");
    });
  });

  describe("Withdraw", function () {
    beforeEach(async function () {
      await nft.connect(user).setApprovalForAll(await vault.getAddress(), true);
      await vault.connect(user).deposit(await nft.getAddress(), 1);
      await nebulaToken.connect(user).approve(await vault.getAddress(), SHARES_PER_NFT);
    });

    it("should withdraw NFT and burn shares", async function () {
      await expect(vault.connect(user).withdraw(SHARES_PER_NFT))
        .to.emit(vault, "Withdrawn")
        .withArgs(await nft.getAddress(), 1, user.address);

      // Verify NFT returned to user
      expect(await nft.ownerOf(1)).to.equal(user.address);

      // Verify shares burned
      expect(await nebulaToken.balanceOf(user.address)).to.equal(0);
    });

    it("should revert if insufficient shares", async function () {
      await expect(
        vault.connect(user).withdraw(SHARES_PER_NFT * 2)
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });

    it("should revert if called by non-owner", async function () {
      await expect(
        vault.connect(owner).withdraw(SHARES_PER_NFT)
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });
  });

  describe("Balance", function () {
    it("should return zero shares before deposit", async function () {
      expect(await vault.balanceOf(user.address)).to.equal(0);
    });

    it("should return correct shares after deposit", async function () {
      await nft.connect(user).setApprovalForAll(await vault.getAddress(), true);
      await vault.connect(user).deposit(await nft.getAddress(), 1);
      expect(await vault.balanceOf(user.address)).to.equal(SHARES_PER_NFT);
    });
  });
});

// Mock ERC721 for testing
contract ERC721Mock is ERC721 {
    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    function mint(address to, uint256 tokenId) public {
        _safeMint(to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, IERC165) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}