# TokenDistributor

A secure and gas-optimized Solidity smart contract for distributing ERC20 tokens to multiple recipients on Binance Smart Chain (BSC) and other EVM-compatible blockchains.

## Overview

TokenDistributor simplifies the airdrop distribution process by providing two main functions:
- **`distribute()`** - Distribute equal amounts to multiple recipients
- **`distributeBatch()`** - Distribute different amounts to multiple recipients

The contract validates inputs, checks token allowances, and uses OpenZeppelin's SafeERC20 for secure token transfers.

## Features

✅ **Equal & Batch Distribution** - Support for both uniform and variable amount distributions
✅ **Gas Optimized** - Uses unchecked arithmetic and calldata optimization
✅ **Safe Transfers** - Leverages OpenZeppelin's SafeERC20 for secure token operations
✅ **Input Validation** - Comprehensive checks for addresses, amounts, and allowances
✅ **Event Logging** - Detailed events for tracking distributions
✅ **Access Control** - Built on OpenZeppelin's Ownable (extendable for restrictions)

## Installation

### Prerequisites
- [Foundry](https://book.getfoundry.sh/getting-started/installation.html)

### Setup

```bash
# Clone or navigate to the project
cd TokenDistributor

# Install dependencies
forge install

# Compile contracts
forge build

# Run tests
forge test

# Run tests with verbose output
forge test -vvv

# Check gas usage
forge test --gas-report
```

## Smart Contracts

### TokenDistributor.sol

Main contract for token distribution.

#### Functions

##### `distribute(address token, address[] calldata recipients, uint256 amountPerWallet)`

Distributes equal amounts of tokens to multiple recipients.

**Parameters:**
- `token` - ERC20 token address to distribute
- `recipients` - Array of recipient addresses
- `amountPerWallet` - Amount each recipient will receive

**Requirements:**
- Caller must have approved at least `amountPerWallet * recipients.length` tokens
- Token must be a valid ERC20 contract
- Recipients array must not be empty
- Amount must be greater than 0
- No recipient can be address(0)

**Events:**
- `TokensSent` - Emitted for each transfer
- `TokensDistributed` - Emitted after all distributions

**Example:**
```solidity
address token = 0x...;
address[] memory recipients = new address[](3);
recipients[0] = 0xAddress1;
recipients[1] = 0xAddress2;
recipients[2] = 0xAddress3;

uint256 amount = 100 * 10**18; // 100 tokens with 18 decimals

// Must approve first
IERC20(token).approve(address(distributor), amount * 3);

// Distribute
distributor.distribute(token, recipients, amount);
```

##### `distributeBatch(address token, address[] calldata recipients, uint256[] calldata amounts)`

Distributes different amounts to multiple recipients.

**Parameters:**
- `token` - ERC20 token address to distribute
- `recipients` - Array of recipient addresses
- `amounts` - Array of amounts for each recipient (must match recipients.length)

**Requirements:**
- Caller must have approved at least the sum of all amounts
- Token must be a valid ERC20 contract
- Recipients array must not be empty
- Arrays must have the same length
- All amounts must be greater than 0
- No recipient can be address(0)

**Events:**
- `TokensSent` - Emitted for each transfer
- `TokensDistributed` - Emitted after all distributions

**Example:**
```solidity
address[] memory recipients = new address[](3);
recipients[0] = 0xAddress1;
recipients[1] = 0xAddress2;
recipients[2] = 0xAddress3;

uint256[] memory amounts = new uint256[](3);
amounts[0] = 100 * 10**18;
amounts[1] = 200 * 10**18;
amounts[2] = 150 * 10**18;

uint256 total = 450 * 10**18;
IERC20(token).approve(address(distributor), total);

distributor.distributeBatch(token, recipients, amounts);
```

## Testing

The project includes comprehensive tests covering:

### Test Coverage

- **Success Cases**
  - Equal amount distribution
  - Batch distribution with different amounts
  - Single recipient distribution
  - Large batch (100 recipients)
  - Balance verification

- **Failure Cases (Reverts)**
  - Invalid token address
  - Empty recipients array
  - Zero amount
  - Insufficient allowance
  - No allowance
  - Invalid recipient (address 0)
  - Array length mismatch
  - Zero amounts in batch

- **Edge Cases**
  - Distributing all available tokens
  - Total supply preservation

- **Gas Benchmarks**
  - 10 recipients distribution
  - 50 recipients distribution
  - 10 recipients batch distribution

### Running Tests

```bash
# Run all tests
forge test

# Run with verbose output
forge test -vvv

# Run specific test
forge test -k "test_distribute_equal_amounts" -vvv

# Run tests with gas report
forge test --gas-report

# Run tests on a specific contract
forge test --match-contract TokenDistributorTest
```

## Deployment

### Local Network Testing

```bash
# Start local blockchain
anvil

# In another terminal, deploy
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

### BSC Testnet Deployment

```bash
# Set your private key
export PRIVATE_KEY=0x...

# Deploy to BSC Testnet
forge script script/Deploy.s.sol \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545 \
  --broadcast \
  --verify
```

### BSC Mainnet Deployment

```bash
# Set your private key (use a secure method in production)
export PRIVATE_KEY=0x...

# Deploy to BSC Mainnet
forge script script/Deploy.s.sol \
  --rpc-url https://bsc-dataseed1.bnbchain.org:443 \
  --broadcast \
  --verify
```

### Verify on Block Explorer

```bash
forge verify-contract <contract-address> <contract-name> \
  --chain bsc \
  --etherscan-api-key <BSCSCAN_API_KEY>
```

## Gas Optimization

The contract implements several gas optimization techniques:

1. **Unchecked Arithmetic** - Uses `unchecked` blocks for loop increments and calculations where overflow is impossible
2. **Calldata** - Uses `calldata` for function parameters (no unnecessary memory copies)
3. **Event Optimization** - Indexed parameters for efficient log filtering
4. **Loop Optimization** - Post-increment in unchecked blocks

## Usage Examples

### Example 1: Distribute Equal Tokens

```solidity
// Distribute 100 USDC to 10 addresses equally
address usdc = 0x8AC76a51cc950d9822D68b83FE1ad97B32Cd580d; // BSC USDC
address[] memory recipients = new address[](10);
// ... populate recipients array

distributor.distribute(usdc, recipients, 100 * 10**18);
```

### Example 2: Distribute from CSV Data

```solidity
// Import from CSV with different amounts
address token = 0x...;
address[] memory addresses = // from CSV
uint256[] memory amounts = // from CSV

distributor.distributeBatch(token, addresses, amounts);
```

### Example 3: Airdrop Campaign

```solidity
// Execute airdrop for specific eligible addresses
address campaignToken = 0x...;
address[] memory eligibleAddresses = getEligibleAddresses();
uint256 rewardPerAddress = 1000 * 10**18;

// Approve tokens
IERC20(campaignToken).approve(
    address(distributor),
    rewardPerAddress * eligibleAddresses.length
);

// Distribute
distributor.distribute(campaignToken, eligibleAddresses, rewardPerAddress);
```

## Security Considerations

1. **Allowance Checking** - Contract validates sufficient allowance before transfer
2. **SafeERC20** - Uses OpenZeppelin's SafeERC20 to handle non-standard ERC20 implementations
3. **Input Validation** - Validates all inputs (addresses, amounts, arrays)
4. **Zero Address Check** - Prevents sending to address(0)
5. **Reentrancy Safe** - Uses SafeERC20 which protects against reentrancy
6. **No Admin Functions** - Contract has no privileged functions that could affect distributions

## Network Support

Works on all EVM-compatible blockchains:
- Binance Smart Chain (BSC)
- Ethereum
- Polygon
- Arbitrum
- Optimism
- And other EVM chains

## Contract Size

The TokenDistributor contract is optimized for deployment size and stays well within the EVM contract size limit.

## License

MIT

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## Support

For questions or issues, please check:
- [Foundry Documentation](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [BSC Documentation](https://docs.bnbchain.org/)
