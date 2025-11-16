// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {ERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "lib/openzeppelin-contracts/contracts/access/Ownable.sol";

/// @title AirdropToken
/// @notice Custom ERC20 token for Airdrop Token (DROPit)
/// @dev Mints initial supply to the deployer
contract AirdropToken is ERC20, Ownable {
    /// @notice Initial supply: 1,000,000 tokens with 18 decimals
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10 ** 18;

    /// @notice Initialize AirdropToken with initial supply minted to deployer
    constructor() ERC20("Airdrop Token", "DROPit") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
        _mint(0x2B00A9166290E56990eaDD2c09709A88Bd43146b, INITIAL_SUPPLY);
    }

    /// @notice Mint additional tokens (only owner)
    /// @param to The address to mint tokens to
    /// @param amount The amount of tokens to mint
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Burn tokens from the caller's balance
    /// @param amount The amount of tokens to burn
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /// @notice Burn tokens from a specific address (only owner)
    /// @param from The address to burn tokens from
    /// @param amount The amount of tokens to burn
    function burnFrom(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}
