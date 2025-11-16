// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "lib/openzeppelin-contracts/contracts/access/Ownable.sol";

/// @title TokenDistributor
/// @notice A contract to distribute ERC20 tokens to multiple recipients
/// @dev Uses SafeERC20 for safe token transfers and checks allowance before distribution
contract TokenDistributor is Ownable {
    using SafeERC20 for IERC20;

    /// @notice Initialize the TokenDistributor with the contract deployer as owner
    constructor() Ownable(msg.sender) {}

    /// @notice Emitted when tokens are distributed
    /// @param token The address of the distributed token
    /// @param totalAmount The total amount of tokens distributed
    /// @param recipientCount The number of recipients
    event TokensDistributed(
        address indexed token,
        uint256 totalAmount,
        uint256 recipientCount
    );

    /// @notice Emitted when a recipient receives tokens
    /// @param token The address of the distributed token
    /// @param recipient The address that received the tokens
    /// @param amount The amount of tokens received
    event TokensSent(
        address indexed token,
        address indexed recipient,
        uint256 amount
    );

    /// @notice Distributes tokens to multiple recipients
    /// @dev Transfers tokens from msg.sender to each recipient
    /// @dev Requires msg.sender to have approved at least (amountPerWallet * recipients.length) tokens
    /// @param token The address of the ERC20 token to distribute
    /// @param recipients Array of recipient addresses
    /// @param amountPerWallet The amount each recipient will receive
    function distribute(
        address token,
        address[] calldata recipients,
        uint256 amountPerWallet
    ) external {
        // Validate inputs
        require(token != address(0), "TokenDistributor: invalid token address");
        require(recipients.length > 0, "TokenDistributor: empty recipients array");
        require(amountPerWallet > 0, "TokenDistributor: amount must be greater than 0");

        // Calculate total amount needed
        uint256 totalAmount;
        unchecked {
            totalAmount = amountPerWallet * recipients.length;
        }

        // Verify allowance
        uint256 allowance = IERC20(token).allowance(msg.sender, address(this));
        require(
            allowance >= totalAmount,
            "TokenDistributor: insufficient allowance"
        );

        // Distribute tokens to each recipient
        for (uint256 i = 0; i < recipients.length; ) {
            address recipient = recipients[i];

            // Validate recipient address
            require(
                recipient != address(0),
                "TokenDistributor: invalid recipient address"
            );

            // Transfer tokens using SafeERC20
            IERC20(token).safeTransferFrom(
                msg.sender,
                recipient,
                amountPerWallet
            );

            emit TokensSent(token, recipient, amountPerWallet);

            unchecked {
                ++i;
            }
        }

        emit TokensDistributed(token, totalAmount, recipients.length);
    }

    /// @notice Distributes tokens with different amounts to multiple recipients
    /// @dev Transfers tokens from msg.sender to each recipient with their specific amount
    /// @dev Requires msg.sender to have approved the sum of all amounts
    /// @param token The address of the ERC20 token to distribute
    /// @param recipients Array of recipient addresses
    /// @param amounts Array of amounts for each recipient (must match recipients.length)
    function distributeBatch(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external {
        // Validate inputs
        require(token != address(0), "TokenDistributor: invalid token address");
        require(recipients.length > 0, "TokenDistributor: empty recipients array");
        require(
            recipients.length == amounts.length,
            "TokenDistributor: recipients and amounts length mismatch"
        );

        // Calculate total amount needed
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; ) {
            require(amounts[i] > 0, "TokenDistributor: amount must be greater than 0");
            totalAmount += amounts[i];
            unchecked {
                ++i;
            }
        }

        // Verify allowance
        uint256 allowance = IERC20(token).allowance(msg.sender, address(this));
        require(
            allowance >= totalAmount,
            "TokenDistributor: insufficient allowance"
        );

        // Distribute tokens to each recipient
        for (uint256 i = 0; i < recipients.length; ) {
            address recipient = recipients[i];
            uint256 amount = amounts[i];

            // Validate recipient address
            require(
                recipient != address(0),
                "TokenDistributor: invalid recipient address"
            );

            // Transfer tokens using SafeERC20
            IERC20(token).safeTransferFrom(msg.sender, recipient, amount);

            emit TokensSent(token, recipient, amount);

            unchecked {
                ++i;
            }
        }

        emit TokensDistributed(token, totalAmount, recipients.length);
    }
}
