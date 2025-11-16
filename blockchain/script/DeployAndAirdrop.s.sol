// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script} from "lib/forge-std/src/Script.sol";
import {TokenDistributor} from "../src/TokenDistributor.sol";
import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {AirdropToken} from "../src/AirdropToken.sol";

/// @title DeployAndAirdrop
/// @notice Deploy AirdropToken and distribute to 10 recipient wallets
/// @dev Usage: forge script script/DeployAndAirdrop.s.sol:DeployAndAirdrop --rpc-url <RPC_URL> --broadcast
contract DeployAndAirdrop is Script {
    // Configuration
    address constant DISTRIBUTOR_ADDRESS = address(0); // If non-zero, use existing distributor

    // 10 recipient wallets (hardcoded - modify as needed)
    address[] private recipients = [
        0x2B00A9166290E56990eaDD2c09709A88Bd43146b,
        0xaeB7Ff7d6d48E743ba0B86404128F58628A20ac6,
        0x3a159d24634A180f3Ab9ff37868358C73226E672,
        0x9757724C3EcDC93479a039Eb062F5111f0B66aa5,
        0x03c0D6e51079A550827BaEd0b73E8aD631d7C4E3,
        0xaf59B12ea11914A0373ffbb13FF8b03F8537C599,
        0x0000000000000000000000000000000000000007,
        0x0000000000000000000000000000000000000008,
        0x0000000000000000000000000000000000000009,
        0x000000000000000000000000000000000000000A
    ];

    // Amount per wallet: 100 DROPit (with 18 decimals)
    uint256 constant AMOUNT_PER_WALLET = 100 * 10 ** 18;

    function run() public {
        vm.startBroadcast();

        // 1. Resolve token: try env TOKEN_ADDRESS, otherwise deploy AirdropToken
        address tokenAddr;
        bool tokenResolved = true;
        try vm.envAddress("TOKEN_ADDRESS") returns (address addr) {
            tokenAddr = addr;
        } catch {
            tokenResolved = false;
        }
        if (!tokenResolved) {
            AirdropToken deployed = new AirdropToken();
            tokenAddr = address(deployed);
        }
        IERC20 token = IERC20(tokenAddr);

        // 2. Use existing distributor if provided; otherwise deploy
        TokenDistributor distributor;
        if (DISTRIBUTOR_ADDRESS == address(0)) {
            distributor = new TokenDistributor();
        } else {
            distributor = TokenDistributor(DISTRIBUTOR_ADDRESS);
        }

        // 3. Calculate total amount needed
        uint256 totalAmount = AMOUNT_PER_WALLET * recipients.length; // 1000 DROPit total

        // 4. Approve TokenDistributor to spend tokens
        token.approve(address(distributor), totalAmount);

        // 5. Distribute tokens to 10 wallets
        distributor.distribute(address(token), recipients, AMOUNT_PER_WALLET);

        vm.stopBroadcast();
    }
}
