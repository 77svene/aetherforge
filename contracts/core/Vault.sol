// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {NebulaToken} from "./NebulaToken.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces.sol";

/**
 * @title Vault * @dev ERC4626 compatible vault that holds NFTs (ERC721) and mints NebulaToken shares.
 *      Simplified version: only accepts one NFT contract at a time, and each NFT represents 1e18 shares.
 *      Uses ReentrancyGuard to prevent reentrancy attacks.
 */
contract Vault is IVault, ReentrancyGuard {
    address public immutable nftContract; // The only NFT contract this vault accepts
    NebulaToken public immutable nebulaToken;
    bool public deposited;
    uint256 public tokenId; // Token ID of the deposited NFT

    event Deposited(address indexed nftContract, uint256 indexed tokenId, address indexed user);
    event Withdrawn(address indexed nftContract, uint256 indexed tokenId, address indexed user);

    /**
     * @dev Constructor sets the NFT contract address and NebulaToken address.
     *      Assumes the caller has already granted MINTER_ROLE on the NebulaToken to this vault.
     * @param _nftContract Address of the NFT contract (ERC721)
     * @param _nebulaToken Address of the NebulaToken contract
     */
    constructor(address _nftContract, address _nebulaToken) {
        require(_nftContract != address(0), "NFT contract cannot be zero");
        require(_nebulaToken != address(0), "NebulaToken cannot be zero");
        nftContract = _nftContract;
        nebulaToken = NebulaToken(_nebulaToken);
    }

    /**
     * @dev Deposits an NFT into the vault and mints shares to the caller.
     *      Follows checks-effects-interactions pattern to prevent reentrancy.
     * @param nftContract Address of the NFT contract (ERC721 or ERC1155)
     * @param tokenId ID of the NFT to deposit
     */
    function deposit(address nftContract, uint256 tokenId) external nonReentrant {
        require(nftContract == address(this.nftContract), "Wrong NFT contract");
        require(!deposited, "Already deposited");
        
        // Effects: update state before interacting with external contract
        deposited = true;
        this.tokenId = tokenId;
        
        // Interaction: transfer NFT from user to vault
        IERC721(nftContract).safeTransferFrom(msg.sender, address(this), tokenId);
        
        // Mint shares after successful transfer
        nebulaToken.mint(msg.sender, 1e18);
        
        emit Deposited(nftContract, tokenId, msg.sender);
    }

    /**
     * @dev Withdraws shares from the vault and transfers the corresponding NFT to the caller.
     *      Follows checks-effects-interactions pattern to prevent reentrancy.
     * @param shares Amount of shares to burn
     */
    function withdraw(uint256 shares) external nonReentrant {
        require(shares > 0, "Shares must be > 0");
        require(deposited, "No NFT deposited");
        require(nebulaToken.balanceOf(msg.sender) >= shares, "Insufficient shares");
                // Effects: update state before interacting with external contract
        uint256 withdrawnTokenId = tokenId;
        deposited = false;
        tokenId = 0;
        
        // Interaction: burn shares and transfer NFT to user        nebulaToken.burn(msg.sender, shares);
        IERC721(nftContract).safeTransferFrom(address(this), msg.sender, withdrawnTokenId);
        
        emit Withdrawn(nftContract, withdrawnTokenId, msg.sender);
    }

    /**
     * @dev Returns the share balance of an account.
     * @param account Address to check balance for     * @return Share balance
     */
    function balanceOf(address account) external view override returns (uint256) {
        return nebulaToken.balanceOf(account);
    }
}