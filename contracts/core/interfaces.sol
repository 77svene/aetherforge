// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

/**
 * @title IVault
 * @dev Interface for the Vault contract (ERC4626 compatible) that holds NFT assets.
 */
interface IVault {
    /**
     * @dev Deposits an NFT into the vault and mints shares to the caller.
     * @param nftContract Address of the NFT contract (ERC721 or ERC1155)
     * @param tokenId ID of the NFT to deposit
     */
    function deposit(address nftContract, uint256 tokenId) external;

    /**
     * @dev Withdraws shares from the vault and transfers the corresponding NFT to the caller.
     * @param shares Amount of shares to burn
     */
    function withdraw(uint256 shares) external;

    /**
     * @dev Returns the share balance of an account.
     * @param account Address to check balance for
     * @return Share balance
     */
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title IRegistry
 * @dev Interface for the Registry contract that tracks deployed module adapters.
 */
interface IRegistry {
    /**
     * @dev Registers a module contract address.
     * @param moduleId Identifier for the module (bytes32 hash)
     * @param moduleAddr Address of the module contract
     */
    function registerModule(bytes32 moduleId, address moduleAddr) external;

    /**
     * @dev Retrieves the address of a registered module.
     * @param moduleId Identifier for the module
     * @return Address of the module contract (zero if not registered)
     */
    function getModule(bytes32 moduleId) external view returns (address);
}