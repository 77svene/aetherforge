// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title NebulaToken
 * @dev ERC20 token representing shares in the AetherForge Vault.
 *      Uses AccessControl to restrict minting and burning to authorized accounts (e.g., the Vault).
 */
contract NebulaToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender); // Initial minter is deployer; can be transferred
    }

    function grantRole(bytes32 role, address account) public override onlyRole(DEFAULT_ADMIN_ROLE) {
        super._grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account) public override onlyRole(DEFAULT_ADMIN_ROLE) {
        super._revokeRole(role, account);
    }

    /**
     * @dev Mints shares to an account. Only callable by accounts with MINTER_ROLE.
     * @param account The address to receive shares.
     * @param amount The amount of shares to mint.
     */
    function mint(address account, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(account, amount);
    }

    /**
     * @dev Burns shares from an account. Only callable by accounts with MINTER_ROLE.
     * @param account The address to burn shares from.
     * @param amount The amount of shares to burn.
     */
    function burn(address account, uint256 amount) public onlyRole(MINTER_ROLE) {
        _burn(account, amount);
    }
}