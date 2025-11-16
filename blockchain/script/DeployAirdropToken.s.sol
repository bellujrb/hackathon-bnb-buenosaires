// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script} from "lib/forge-std/src/Script.sol";
import {AirdropToken} from "../src/AirdropToken.sol";

contract DeployAirdropToken is Script {
    /// @notice Deploy the AirdropToken (DROPit) and mint initial supply
    /// @dev Call with: forge script script/DeployAirdropToken.s.sol:DeployAirdropToken --rpc-url <RPC_URL> --broadcast
    function run() public {
        vm.startBroadcast();

        // Deploy AirdropToken - mints 1,000,000 DROPit to msg.sender
        AirdropToken token = new AirdropToken();

        vm.stopBroadcast();
    }
}
