// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test} from "lib/forge-std/src/Test.sol";
import {TokenDistributor} from "../src/TokenDistributor.sol";
import {MockERC20} from "../src/MockERC20.sol";

contract TokenDistributorTest is Test {
    TokenDistributor public distributor;
    MockERC20 public token;
    address public owner;
    address[] public recipients;

    function setUp() public {
        owner = address(this);
        distributor = new TokenDistributor();
        token = new MockERC20();

        // Setup test recipients
        recipients = new address[](5);
        recipients[0] = address(0x1);
        recipients[1] = address(0x2);
        recipients[2] = address(0x3);
        recipients[3] = address(0x4);
        recipients[4] = address(0x5);

        // Give owner tokens
        token.mint(owner, 10000 * 10 ** 18);
    }

    // ============ SUCCESS CASES ============

    function test_distribute_equal_amounts() public {
        uint256 amountPerWallet = 100 * 10 ** 18;

        // Approve tokens
        token.approve(address(distributor), amountPerWallet * recipients.length);

        // Distribute
        distributor.distribute(address(token), recipients, amountPerWallet);

        // Verify all recipients got the correct amount
        for (uint256 i = 0; i < recipients.length; i++) {
            assertEq(
                token.balanceOf(recipients[i]),
                amountPerWallet,
                "Recipient did not receive correct amount"
            );
        }
    }

    function test_distribute_emits_events() public {
        uint256 amountPerWallet = 100 * 10 ** 18;
        token.approve(address(distributor), amountPerWallet * recipients.length);

        vm.expectEmit(true, false, false, true);
        emit TokenDistributor.TokensDistributed(
            address(token),
            amountPerWallet * recipients.length,
            recipients.length
        );

        distributor.distribute(address(token), recipients, amountPerWallet);
    }

    function test_distribute_batch_different_amounts() public {
        uint256[] memory amounts = new uint256[](5);
        amounts[0] = 100 * 10 ** 18;
        amounts[1] = 200 * 10 ** 18;
        amounts[2] = 150 * 10 ** 18;
        amounts[3] = 300 * 10 ** 18;
        amounts[4] = 50 * 10 ** 18;

        uint256 totalAmount = 800 * 10 ** 18;
        token.approve(address(distributor), totalAmount);

        distributor.distributeBatch(address(token), recipients, amounts);

        for (uint256 i = 0; i < recipients.length; i++) {
            assertEq(
                token.balanceOf(recipients[i]),
                amounts[i],
                "Recipient did not receive correct amount"
            );
        }
    }

    function test_distribute_single_recipient() public {
        address[] memory singleRecipient = new address[](1);
        singleRecipient[0] = address(0xABC);

        uint256 amount = 500 * 10 ** 18;
        token.approve(address(distributor), amount);

        distributor.distribute(address(token), singleRecipient, amount);

        assertEq(
            token.balanceOf(singleRecipient[0]),
            amount,
            "Single recipient did not receive correct amount"
        );
    }

    function test_distribute_large_batch() public {
        // Create large batch of recipients
        address[] memory largeRecipients = new address[](100);
        for (uint256 i = 0; i < 100; i++) {
            largeRecipients[i] = address(uint160(i + 1000));
        }

        uint256 amountPerWallet = 10 * 10 ** 18;
        uint256 totalAmount = amountPerWallet * 100;

        token.approve(address(distributor), totalAmount);
        distributor.distribute(address(token), largeRecipients, amountPerWallet);

        // Verify a few recipients
        assertEq(
            token.balanceOf(largeRecipients[0]),
            amountPerWallet,
            "First recipient did not receive correct amount"
        );
        assertEq(
            token.balanceOf(largeRecipients[99]),
            amountPerWallet,
            "Last recipient did not receive correct amount"
        );
    }

    function test_distributor_balance_after_distribution() public {
        uint256 amountPerWallet = 100 * 10 ** 18;
        uint256 initialBalance = token.balanceOf(owner);

        token.approve(address(distributor), amountPerWallet * recipients.length);
        distributor.distribute(address(token), recipients, amountPerWallet);

        uint256 expectedBalance = initialBalance - (amountPerWallet * recipients.length);
        assertEq(
            token.balanceOf(owner),
            expectedBalance,
            "Distributor sender balance incorrect after distribution"
        );
    }

    // ============ FAILURE CASES ============

    function test_distribute_reverts_with_invalid_token() public {
        uint256 amountPerWallet = 100 * 10 ** 18;

        vm.expectRevert("TokenDistributor: invalid token address");
        distributor.distribute(address(0), recipients, amountPerWallet);
    }

    function test_distribute_reverts_with_empty_recipients() public {
        uint256 amountPerWallet = 100 * 10 ** 18;
        address[] memory emptyRecipients = new address[](0);

        vm.expectRevert("TokenDistributor: empty recipients array");
        distributor.distribute(address(token), emptyRecipients, amountPerWallet);
    }

    function test_distribute_reverts_with_zero_amount() public {
        vm.expectRevert("TokenDistributor: amount must be greater than 0");
        distributor.distribute(address(token), recipients, 0);
    }

    function test_distribute_reverts_with_insufficient_allowance() public {
        uint256 amountPerWallet = 100 * 10 ** 18;
        uint256 insufficientAllowance = amountPerWallet * recipients.length - 1;

        token.approve(address(distributor), insufficientAllowance);

        vm.expectRevert("TokenDistributor: insufficient allowance");
        distributor.distribute(address(token), recipients, amountPerWallet);
    }

    function test_distribute_reverts_with_no_allowance() public {
        uint256 amountPerWallet = 100 * 10 ** 18;

        // Don't approve any tokens
        vm.expectRevert("TokenDistributor: insufficient allowance");
        distributor.distribute(address(token), recipients, amountPerWallet);
    }

    function test_distribute_reverts_with_invalid_recipient() public {
        address[] memory invalidRecipients = new address[](2);
        invalidRecipients[0] = address(0x1);
        invalidRecipients[1] = address(0); // Invalid recipient

        uint256 amountPerWallet = 100 * 10 ** 18;
        token.approve(address(distributor), amountPerWallet * 2);

        vm.expectRevert("TokenDistributor: invalid recipient address");
        distributor.distribute(address(token), invalidRecipients, amountPerWallet);
    }

    function test_distribute_batch_reverts_with_length_mismatch() public {
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 100 * 10 ** 18;
        amounts[1] = 200 * 10 ** 18;
        amounts[2] = 150 * 10 ** 18;

        vm.expectRevert(
            "TokenDistributor: recipients and amounts length mismatch"
        );
        distributor.distributeBatch(address(token), recipients, amounts);
    }

    function test_distribute_batch_reverts_with_zero_amount() public {
        uint256[] memory amounts = new uint256[](5);
        amounts[0] = 100 * 10 ** 18;
        amounts[1] = 0; // Zero amount
        amounts[2] = 150 * 10 ** 18;
        amounts[3] = 300 * 10 ** 18;
        amounts[4] = 50 * 10 ** 18;

        token.approve(address(distributor), 600 * 10 ** 18);

        vm.expectRevert("TokenDistributor: amount must be greater than 0");
        distributor.distributeBatch(address(token), recipients, amounts);
    }

    // ============ EDGE CASES ============

    function test_distribute_all_available_tokens() public {
        uint256 totalTokens = token.balanceOf(owner);
        uint256 amountPerWallet = totalTokens / recipients.length;

        token.approve(address(distributor), totalTokens);
        distributor.distribute(address(token), recipients, amountPerWallet);

        assertEq(
            token.balanceOf(owner),
            0,
            "Owner should have no tokens left after distributing all"
        );
    }

    function test_distribute_preserves_total_supply() public {
        uint256 totalSupplyBefore = token.totalSupply();
        uint256 amountPerWallet = 100 * 10 ** 18;

        token.approve(address(distributor), amountPerWallet * recipients.length);
        distributor.distribute(address(token), recipients, amountPerWallet);

        uint256 totalSupplyAfter = token.totalSupply();
        assertEq(
            totalSupplyBefore,
            totalSupplyAfter,
            "Total supply should not change after distribution"
        );
    }

    // ============ GAS BENCHMARKS ============

    function test_distribute_gas_10_recipients() public {
        address[] memory testRecipients = new address[](10);
        for (uint256 i = 0; i < 10; i++) {
            testRecipients[i] = address(uint160(i + 100));
        }

        uint256 amountPerWallet = 100 * 10 ** 18;
        token.approve(address(distributor), amountPerWallet * 10);

        distributor.distribute(address(token), testRecipients, amountPerWallet);
    }

    function test_distribute_gas_50_recipients() public {
        address[] memory testRecipients = new address[](50);
        for (uint256 i = 0; i < 50; i++) {
            testRecipients[i] = address(uint160(i + 200));
        }

        uint256 amountPerWallet = 100 * 10 ** 18;
        token.approve(address(distributor), amountPerWallet * 50);

        distributor.distribute(address(token), testRecipients, amountPerWallet);
    }

    function test_distribute_batch_gas_10_recipients() public {
        address[] memory testRecipients = new address[](10);
        uint256[] memory amounts = new uint256[](10);

        for (uint256 i = 0; i < 10; i++) {
            testRecipients[i] = address(uint160(i + 300));
            amounts[i] = (100 + i * 10) * 10 ** 18;
        }

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < 10; i++) {
            totalAmount += amounts[i];
        }

        token.approve(address(distributor), totalAmount);
        distributor.distributeBatch(address(token), testRecipients, amounts);
    }
}
