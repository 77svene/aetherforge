// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title MyAccessControl
 * @dev Simple wrapper around OpenZeppelin AccessControl exposing only the roles required by the protocol.
 *      Uses OpenZeppelin's DEFAULT_ADMIN_ROLE (bytes32(0)) for compatibility.
 */
contract MyAccessControl is AccessControl {
    // -------------------------------------------------------------------------
    // Role constants -- keep them in sync with any offchain role checks
    // -------------------------------------------------------------------------
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // -------------------------------------------------------------------------
    // Constructor -- grants DEFAULT_ADMIN_ROLE to the deployer
    // -------------------------------------------------------------------------
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // -------------------------------------------------------------------------
    // Admin functions -- only accounts with DEFAULT_ADMIN_ROLE can call them
    // -------------------------------------------------------------------------
    /**
     * @notice Grant a role to an account.
     * @param role The role to grant (must be PAUSER_ROLE or MINTER_ROLE).
     * @param account The address to grant the role to.
     */
    function grantRole(bytes32 role, address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(role == PAUSER_ROLE || role == MINTER_ROLE, "Invalid role");
        _grantRole(role, account);
    }

    /**
     * @notice Revoke a role from an account.
     * @param role The role to revoke (must be PAUSER_ROLE or MINTER_ROLE).
     * @param account The address to revoke the role from.
     */
    function revokeRole(bytes32 role, address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(role == PAUSER_ROLE || role == MINTER_ROLE, "Invalid role");
        _revokeRole(role, account);
    }
}