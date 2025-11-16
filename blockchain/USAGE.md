# TokenDistributor - Practical Usage Guide

Este arquivo contém exemplos práticos de como usar o TokenDistributor para diferentes cenários de airdrop.

## Índice

1. [Setup Inicial](#setup-inicial)
2. [Distribuição Simples](#distribuição-simples)
3. [Distribuição em Lote com Montantes Diferentes](#distribuição-em-lote-com-montantes-diferentes)
4. [Caso de Uso Real: Airdrop BSC](#caso-de-uso-real-airdrop-bsc)
5. [Troubleshooting](#troubleshooting)

## Setup Inicial

### 1. Deploy do Contrato

```bash
# Start local blockchain
anvil

# In another terminal
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

Você receberá um endereço do contrato deployado. Salve este endereço para usar nos próximos passos.

### 2. Obter um Token para Testar

Se estiver usando a rede local, pode usar o MockERC20 que foi deployado:

```bash
# Deploy com token mock
forge script script/Deploy.s.sol:DeployWithMockToken --rpc-url http://localhost:8545 --broadcast
```

Se estiver usando BSC Testnet/Mainnet, use um token real como USDT, USDC, etc.

## Distribuição Simples

### Scenario: Distribuir 100 tokens para 5 endereços

```solidity
// Usando Foundry Cast para interagir com o contrato

// 1. Approve tokens para o distribuidor
cast send \
  --rpc-url http://localhost:8545 \
  --private-key $PRIVATE_KEY \
  0x<TOKEN_ADDRESS> \
  "approve(address,uint256)" \
  0x<DISTRIBUTOR_ADDRESS> \
  500000000000000000000

// 2. Chamar a função distribute
cast send \
  --rpc-url http://localhost:8545 \
  --private-key $PRIVATE_KEY \
  0x<DISTRIBUTOR_ADDRESS> \
  "distribute(address,address[],uint256)" \
  0x<TOKEN_ADDRESS> \
  "[0x1111111111111111111111111111111111111111,0x2222222222222222222222222222222222222222,0x3333333333333333333333333333333333333333,0x4444444444444444444444444444444444444444,0x5555555555555555555555555555555555555555]" \
  100000000000000000000

// 3. Verificar o saldo de um recipient
cast call \
  --rpc-url http://localhost:8545 \
  0x<TOKEN_ADDRESS> \
  "balanceOf(address)" \
  0x1111111111111111111111111111111111111111
```

### Via Solidity Script

```solidity
// script/SimpleDistribute.s.sol
pragma solidity ^0.8.13;

import {Script} from "lib/forge-std/src/Script.sol";
import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {TokenDistributor} from "../src/TokenDistributor.sol";

contract SimpleDistribute is Script {
    function run() public {
        address tokenAddress = vm.envAddress("TOKEN_ADDRESS");
        address distributorAddress = vm.envAddress("DISTRIBUTOR_ADDRESS");

        address[] memory recipients = new address[](5);
        recipients[0] = 0x1111111111111111111111111111111111111111;
        recipients[1] = 0x2222222222222222222222222222222222222222;
        recipients[2] = 0x3333333333333333333333333333333333333333;
        recipients[3] = 0x4444444444444444444444444444444444444444;
        recipients[4] = 0x5555555555555555555555555555555555555555;

        uint256 amountPerWallet = 100 * 10**18;

        vm.startBroadcast();

        IERC20 token = IERC20(tokenAddress);
        token.approve(distributorAddress, amountPerWallet * recipients.length);

        TokenDistributor distributor = TokenDistributor(distributorAddress);
        distributor.distribute(tokenAddress, recipients, amountPerWallet);

        vm.stopBroadcast();
    }
}
```

Executar:
```bash
export TOKEN_ADDRESS=0x...
export DISTRIBUTOR_ADDRESS=0x...

forge script script/SimpleDistribute.s.sol \
  --rpc-url http://localhost:8545 \
  --broadcast
```

## Distribuição em Lote com Montantes Diferentes

### Scenario: Distribuir tokens com montantes variáveis baseado em tier

```solidity
// script/TieredDistribute.s.sol
pragma solidity ^0.8.13;

import {Script} from "lib/forge-std/src/Script.sol";
import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {TokenDistributor} from "../src/TokenDistributor.sol";

contract TieredDistribute is Script {
    function run() public {
        address tokenAddress = vm.envAddress("TOKEN_ADDRESS");
        address distributorAddress = vm.envAddress("DISTRIBUTOR_ADDRESS");

        // Bronze, Silver, Gold tiers
        address[] memory recipients = new address[](6);
        recipients[0] = 0x1111111111111111111111111111111111111111; // Gold
        recipients[1] = 0x2222222222222222222222222222222222222222; // Gold
        recipients[2] = 0x3333333333333333333333333333333333333333; // Silver
        recipients[3] = 0x4444444444444444444444444444444444444444; // Silver
        recipients[4] = 0x5555555555555555555555555555555555555555; // Bronze
        recipients[5] = 0x6666666666666666666666666666666666666666; // Bronze

        uint256[] memory amounts = new uint256[](6);
        amounts[0] = 1000 * 10**18; // Gold: 1000
        amounts[1] = 1000 * 10**18; // Gold: 1000
        amounts[2] = 500 * 10**18;  // Silver: 500
        amounts[3] = 500 * 10**18;  // Silver: 500
        amounts[4] = 250 * 10**18;  // Bronze: 250
        amounts[5] = 250 * 10**18;  // Bronze: 250

        uint256 totalAmount = 3500 * 10**18;

        vm.startBroadcast();

        IERC20 token = IERC20(tokenAddress);
        token.approve(distributorAddress, totalAmount);

        TokenDistributor distributor = TokenDistributor(distributorAddress);
        distributor.distributeBatch(tokenAddress, recipients, amounts);

        vm.stopBroadcast();
    }
}
```

Executar:
```bash
export TOKEN_ADDRESS=0x...
export DISTRIBUTOR_ADDRESS=0x...

forge script script/TieredDistribute.s.sol \
  --rpc-url http://localhost:8545 \
  --broadcast
```

## Caso de Uso Real: Airdrop BSC

### Distribuir USDT em BSC Testnet para múltiplos endereços

```bash
# Variáveis de ambiente
export PRIVATE_KEY=0x... # Sua chave privada
export DISTRIBUTOR_ADDRESS=0x... # Endereço do TokenDistributor deployado
export USDT_ADDRESS=0x337610d27c682E347C9cD60BD4b3b107C9d34dDd # USDT em BSC Testnet

# Step 1: Approve USDT para o distribuidor
cast send \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545 \
  --private-key $PRIVATE_KEY \
  $USDT_ADDRESS \
  "approve(address,uint256)" \
  $DISTRIBUTOR_ADDRESS \
  1000000000000 # 1 milhão USDT com 6 decimais

# Step 2: Chamar distribute
cast send \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545 \
  --private-key $PRIVATE_KEY \
  $DISTRIBUTOR_ADDRESS \
  "distribute(address,address[],uint256)" \
  $USDT_ADDRESS \
  "[0x1111...,0x2222...,0x3333...]" \
  100000000 # 100 USDT com 6 decimais

# Step 3: Verificar saldo de um recipient
cast call \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545 \
  $USDT_ADDRESS \
  "balanceOf(address)" \
  0x1111... \
  | cast to-dec
```

## Troubleshooting

### Erro: "TokenDistributor: insufficient allowance"

**Problema**: O montante aprovado é menor que o necessário.

**Solução**:
```bash
# Verifique a approval atual
cast call \
  --rpc-url http://localhost:8545 \
  0x<TOKEN_ADDRESS> \
  "allowance(address,address)" \
  0x<YOUR_ADDRESS> \
  0x<DISTRIBUTOR_ADDRESS> \
  | cast to-dec

# Re-approve com valor maior
cast send \
  --rpc-url http://localhost:8545 \
  --private-key $PRIVATE_KEY \
  0x<TOKEN_ADDRESS> \
  "approve(address,uint256)" \
  0x<DISTRIBUTOR_ADDRESS> \
  999999999999999999999999 # Max uint256
```

### Erro: "TokenDistributor: invalid recipient address"

**Problema**: Um dos endereços na lista é inválido (address(0) ou não-EVM).

**Solução**:
- Verifique que todos os endereços têm o formato `0x` com 40 caracteres hexadecimais
- Não inclua address(0) na lista
- Valide os endereços antes de criar a transação

### Erro: "arrays length mismatch"

**Problema**: No `distributeBatch`, o número de recipients não corresponde ao número de amounts.

**Solução**:
```solidity
// ❌ ERRADO
address[] memory recipients = new address[](3);
uint256[] memory amounts = new uint256[](5); // MISMATCH!

// ✅ CORRETO
address[] memory recipients = new address[](5);
uint256[] memory amounts = new uint256[](5); // MATCH!
```

### Alto Custo de Gas

Para distribuições muito grandes (>100 recipients), considere:

1. **Dividir em múltiplas transações**:
```bash
# Distribuir em grupos de 50
# Transação 1: recipients[0:50]
# Transação 2: recipients[50:100]
# Transação 3: recipients[100:150]
```

2. **Usar `distributeBatch` em vez de `distribute`**:
   - Pode ser mais barato para grandes volumes

3. **Aguardar períodos de baixa atividade da rede**:
   - Gás é mais barato durante períodos off-peak

## Estimativa de Gas

### Distribution Function Gas Usage

Baseado no relatório de testes:

- **10 recipients**: ~376,337 gas
- **50 recipients**: ~1,539,714 gas
- **100 recipients**: ~3,003,542 gas

Na BSC:
- Gas Price médio: 3-5 Gwei
- Custo estimado para 50 recipients: 3,003,542 × 5 Gwei ≈ 0.015 BNB (~$5)

## Links Úteis

- [BSC Faucet para Testnet](https://testnet.binance.org/faucet-smart)
- [BSCScan](https://bscscan.com/) - Block explorer
- [Cast Documentation](https://book.getfoundry.sh/cast/)
- [Foundry Script Documentation](https://book.getfoundry.sh/forge/scripts.html)
