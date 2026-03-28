// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {NebulaToken} from "../core/NebulaToken.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title Fractionalizer
 * @dev Mints NebulaToken shares when NFTs are deposited into the Vault.
 *      Shares are burned when the corresponding NFTs are withdrawn.
 *      Interacts with Vault and Registry to maintain state consistency.
 */
contract Fractionalizer {
    // -------------------------------------------------------------------------
    // Core dependencies
    // -------------------------------------------------------------------------
    NebulaToken public immutable nebulaToken;
    IVault public immutable vault;
    IRegistry public immutable registry;
    address public immutable nftAddress; // The NFT contract that this Fractionalizer is for

    // -------------------------------------------------------------------------
    // Events    // -------------------------------------------------------------------------
    event Deposited(address indexed user, uint256 tokenId, uint256 shares);
    event Withdrawn(address indexed user, uint256 tokenId, uint256 shares);

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    /**
     * @param _vault        Address of the Vault contract (ERC4626 compatible).
     * @param _nebulaToken  Address of the NebulaToken (share ERC20).
     * @param _registry     Address of the Registry contract for module tracking.
     * @param _nftAddress   Address of the NFT contract this Fractionalizer handles.
     */
    constructor(
        address _vault,
        address _nebulaToken,
        address _registry,
        address _nftAddress
    ) {
        vault = IVault(_vault);
        nebulaToken = NebulaToken(_nebulaToken);
        registry = IRegistry(_registry);
        nftAddress = _nftAddress;
    }

    // -------------------------------------------------------------------------
    // Deposit NFT to mint shares
    // -------------------------------------------------------------------------
    /**
     * @dev User deposits an NFT to receive shares representing fractional ownership.
     *      The Vault mints shares to the user upon receiving the NFT.
     * @param tokenId The ID of the NFT to deposit.
     */
    function deposit(uint256 tokenId) external {
        require(IERC721(nftAddress).ownerOf(tokenId) == msg.sender, "Caller must own the NFT");
        IERC721(nftAddress).approve(address(vault), tokenId);
        uint256 shares = vault.depositNFT(nftAddress, tokenId);
        emit Deposited(msg.sender, tokenId, shares);
    }

    // -------------------------------------------------------------------------
    // Withdraw shares to redeem NFT
    // -------------------------------------------------------------------------
    /**
     * @dev User burns shares to withdraw the corresponding NFT from the Vault.
     *      The Vault burns shares and transfers the NFT to the user.
     * @param shares The amount of shares to burn for withdrawal.
     */
    function withdraw(uint256 shares) external {
        (address nftContract, uint256 tokenId) = vault.withdrawNFT(shares, msg.sender);
        require(nftContract == nftAddress, "Unexpected NFT contract");
        emit Withdrawn(msg.sender, tokenId, shares);
    }
}