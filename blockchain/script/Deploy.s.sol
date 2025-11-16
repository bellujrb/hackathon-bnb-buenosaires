// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script} from "lib/forge-std/src/Script.sol";
import {TokenDistributor} from "../src/TokenDistributor.sol";
import {MockERC20} from "../src/MockERC20.sol";

contract DeployTokenDistributor is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        // Deploy TokenDistributor
        TokenDistributor distributor = new TokenDistributor();

        vm.stopBroadcast();
    }
}

contract DeployWithMockToken is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        // Deploy TokenDistributor
        TokenDistributor distributor = new TokenDistributor();

        // Deploy Mock Token for testing
        MockERC20 mockToken = new MockERC20();

        vm.stopBroadcast();
    }
}
