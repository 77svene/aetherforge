const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RentalManager", function () {
  let rentalManager, vault, nebulaToken, accessControl, mockNFT, owner, renter;
  let sharesToRent = ethers.utils.parseEther("1"); // 1 share
  let rentalDuration = 7 * 24 * 60 * 60; // 7 days  let rentalFee = ethers.utils.parseEther("0.01"); // 0.01 ETH

  beforeEach(async function () {
    [owner, renter] = await ethers.getSigners();

    // Deploy mock ERC721 NFT
    const MockERC721 = await ethers.getContractFactory(
      `
      // SPDX-License-Identifier: MIT
      pragma solidity ^0.8.24;
      contract MockERC721 {
          string public name = "MockNFT";
          string public symbol = "MNFT";
          address public owner;
          mapping(uint256 => address) private _owners;
          mapping(address => uint256) private _balances;
          mapping(uint256 => address) private _tokenApprovals;
          mapping(address => mapping(address => bool)) private _operatorApprovals;

          event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
          event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
          event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

          constructor() {
              owner = msg.sender;
          }

          function balanceOf(address owner) public view returns (uint256) {
              return _balances[owner] || 0;
          }

          function ownerOf(uint256 tokenId) public view returns (address) {
              require(_owners[tokenId] != address(0), "ERC721: owner query for nonexistent token");
              return _owners[tokenId];
          }

          function safeTransferFrom(address from, address to, uint256 tokenId) public {
              transferFrom(from, to, tokenId);
          }

          function transferFrom(address from, address to, uint256 tokenId) public {
              require(_owners[tokenId] == from, "ERC721: transfer of token that is not own");
              require(
                  msg.sender == from ||
                  getApproved(tokenId) == msg.sender ||
                  isApprovedForAll(_owners[tokenId], msg.sender),
                  "ERC721: transfer caller is not owner nor approved"
              );

              _clearApproval(tokenId);
              _owners[tokenId] = to;
              _balances[from] -= 1;
              _balances[to] += 1;
              emit Transfer(from, to, tokenId);
          }

          function approve(address to, uint256 tokenId) public {
              require(_owners[tokenId] != address(0), "ERC721: approve for nonexistent token");
              require(
                  msg.sender == _owners[tokenId] ||
                  isApprovedForAll(_owners[tokenId], msg.sender),
                  "ERC721: approve caller is not owner nor approved for all"
              );
              _tokenApprovals[tokenId] = to;
              emit Approval(_owners[tokenId], to, tokenId);
          }

          function getApproved(uint256 tokenId) public view returns (address) {
              return _tokenApprovals[tokenId];
          }

          function setApprovalForAll(address operator, bool approved) public {
              require(operator != msg.sender, "ERC721: approve to caller");
              _operatorApprovals[msg.sender][operator] = approved;
              emit ApprovalForAll(msg.sender, operator, approved);
          }

          function isApprovedForAll(address owner, address operator) public view returns (bool) {
              return _operatorApprovals[owner][operator] || false;
          }

          function _clearApproval(uint256 tokenId) private {
              if (_tokenApprovals[tokenId] != address(0)) {
                  delete _tokenApprovals[tokenId];
              }
          }

          function mint(address to, uint256 tokenId) public {
              require(msg.sender == owner, "Only owner");
              require(_owners[tokenId] == address(0), "ERC721: token already minted");
              _owners[tokenId] = to;
              _balances[to] += 1;
              emit Transfer(address(0), to, tokenId);
          }
      }
      `
    );
    mockNFT = await MockERC721.deploy();
    await mockNFT.deployed();

    // Deploy NebulaToken (shares)
    const NebulaToken = await ethers.getContractFactory("NebulaToken");
    nebulaToken = await NebulaToken.deploy();
    await nebulaToken.deployed();

    // Deploy Vault
    const Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy(mockNFT.address, nebulaToken.address);
    await vault.deployed();

    // Deploy AccessControl for role management
    const AccessControl = await ethers.getContractFactory("AccessControl");
    accessControl = await AccessControl.deploy();
    await accessControl.deployed();

    // Deploy RentalManager
    const RentalManager = await ethers.getContractFactory("RentalManager");
    rentalManager = await RentalManager.deploy(
      vault.address,
      nebulaToken.address,
      accessControl.address
    );
    await rentalManager.deployed();

    // Setup roles: give RentalManager MINTER_ROLE on NebulaToken for share minting/burning
    const MINTER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE"));
    await nebulaToken.grantRole(MINTER_ROLE, rentalManager.address);

    // Mint an NFT and deposit it into vault to create shares
    await mockNFT.mint(owner.address, 1);
    await mockNFT.approve(vault.address, 1);
    await vault.deposit(mockNFT.address, 1);

    // Approve RentalManager to manage shares on behalf of owner
    const ownerShares = await vault.balanceOf(owner.address);
    await nebulaToken.approve(rentalManager.address, ownerShares);
  });

  describe("Renting", function () {
    it("should allow renting shares with escrowed payment", async function () {
      await expect(
        rentalManager.connect(renter).rent(sharesToRent, rentalDuration, { value: rentalFee })
      )
        .to.emit(rentalManager, "Rented")
        .withArgs(renter.address, sharesToRent, rentalDuration);

      // Verify renter paid fee
      expect(await ethers.provider.getBalance(rentalManager.address)).to.equal(rentalFee);

      // Verify shares are escrowed (removed from owner's balance, held by contract)
      expect(await vault.balanceOf(owner.address)).to.equal(0);
      expect(await nebulaToken.balanceOf(rentalManager.address)).to.equal(sharesToRent);
    });

    it("should revert if rental fee is insufficient", async function () {
      await expect(
        rentalManager.connect(renter).rent(sharesToRent, rentalDuration, { value: 0 })
      ).to.be.revertedWith("Insufficient rental fee");
    });

    it("should revert if renting zero shares", async function () {
      await expect(
        rentalManager.connect(renter).rent(0, rentalDuration, { value: rentalFee })
      ).to.be.revertedWith("Invalid share amount");
    });

    it("should revert if rental duration is zero", async function () {
      await expect(
        rentalManager.connect(renter).rent(sharesToRent, 0, { value: rentalFee })
      ).to.be.revertedWith("