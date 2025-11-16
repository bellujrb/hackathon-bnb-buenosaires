# AirdropToken (DROPit) - Deployment Guide

Guia completo para fazer deploy do seu token ERC20 customizado "Airdrop Token" (DROPit).

## 📋 Token Details

- **Nome**: Airdrop Token
- **Symbol**: DROPit
- **Decimals**: 18
- **Supply Inicial**: 1,000,000 DROPit
- **Owner**: Você (msg.sender no deploy)

## 🚀 Deployment

### 1. Deploy Local (Anvil)

```bash
# Terminal 1 - Start Anvil
anvil

# Terminal 2 - Deploy token
forge script script/DeployAirdropToken.s.sol:DeployAirdropToken \
  --rpc-url http://localhost:8545 \
  --broadcast
```

**Output esperado:**
```
Deployed to: 0x<TOKEN_ADDRESS>
Owner: 0x<YOUR_ADDRESS>
```

Salve o endereço do token para usar com o TokenDistributor.

### 2. Deploy em BSC Testnet

```bash
# Set your private key
export PRIVATE_KEY=0x<sua_chave_privada>

# Deploy
forge script script/DeployAirdropToken.s.sol:DeployAirdropToken \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545 \
  --broadcast \
  --verify \
  --etherscan-api-key <BSCSCAN_API_KEY>
```

### 3. Deploy em BSC Mainnet

```bash
export PRIVATE_KEY=0x<sua_chave_privada>

forge script script/DeployAirdropToken.s.sol:DeployAirdropToken \
  --rpc-url https://bsc-dataseed1.bnbchain.org:443 \
  --broadcast \
  --verify \
  --etherscan-api-key <BSCSCAN_API_KEY>
```

### 4. Deploy em Ethereum

```bash
export PRIVATE_KEY=0x<sua_chave_privada>

forge script script/DeployAirdropToken.s.sol:DeployAirdropToken \
  --rpc-url https://eth.llamarpc.com \
  --broadcast
```

## 🔐 Security Considerations

- **Initial Supply**: Minted 100% para você (o deployer)
- **Owner**: Apenas você pode fazer mint de novos tokens
- **Burn**: Qualquer um pode queimar seus próprios tokens
- **Transferências**: Funciona como um ERC20 padrão

## 💰 Funções do Token

### Transferir tokens

```bash
# Transferir 100 DROPit para um endereço
cast send \
  --rpc-url http://localhost:8545 \
  --private-key $PRIVATE_KEY \
  0x<TOKEN_ADDRESS> \
  "transfer(address,uint256)" \
  0x<RECIPIENT_ADDRESS> \
  100000000000000000000
```

### Verificar saldo

```bash
cast call \
  --rpc-url http://localhost:8545 \
  0x<TOKEN_ADDRESS> \
  "balanceOf(address)" \
  0x<YOUR_ADDRESS> \
  | cast to-dec
```

### Fazer mint de novos tokens (apenas owner)

```bash
cast send \
  --rpc-url http://localhost:8545 \
  --private-key $PRIVATE_KEY \
  0x<TOKEN_ADDRESS> \
  "mint(address,uint256)" \
  0x<RECIPIENT_ADDRESS> \
  1000000000000000000
```

### Queimar tokens

```bash
cast send \
  --rpc-url http://localhost:8545 \
  --private-key $PRIVATE_KEY \
  0x<TOKEN_ADDRESS> \
  "burn(uint256)" \
  1000000000000000000
```

## 📱 Usando com TokenDistributor

Depois de fazer deploy do token DROPit, use-o com o TokenDistributor:

### 1. Aprove tokens para distribuição

```bash
# Approve 100,000 DROPit para o TokenDistributor
cast send \
  --rpc-url http://localhost:8545 \
  --private-key $PRIVATE_KEY \
  0x<AIRDROP_TOKEN_ADDRESS> \
  "approve(address,uint256)" \
  0x<DISTRIBUTOR_ADDRESS> \
  100000000000000000000000
```

### 2. Distribuir usando TokenDistributor

```bash
cast send \
  --rpc-url http://localhost:8545 \
  --private-key $PRIVATE_KEY \
  0x<DISTRIBUTOR_ADDRESS> \
  "distribute(address,address[],uint256)" \
  0x<AIRDROP_TOKEN_ADDRESS> \
  "[0x1111...,0x2222...,0x3333...]" \
  100000000000000000000
```

## 🔍 Verificar no Block Explorer

Depois do deploy, você pode verificar o token em:

- **BSC Testnet**: https://testnet.bscscan.com/token/0x<TOKEN_ADDRESS>
- **BSC Mainnet**: https://bscscan.com/token/0x<TOKEN_ADDRESS>
- **Ethereum**: https://etherscan.io/token/0x<TOKEN_ADDRESS>

## 📊 Script Solidity Avançado

Se preferir usar um script Solidity mais avançado:

```solidity
// script/DeployAndDistribute.s.sol
pragma solidity ^0.8.13;

import {Script} from "lib/forge-std/src/Script.sol";
import {AirdropToken} from "../src/AirdropToken.sol";
import {TokenDistributor} from "../src/TokenDistributor.sol";
import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract DeployAndDistribute is Script {
    function run() public {
        address[] memory recipients = new address[](5);
        // ... populate recipients

        vm.startBroadcast();

        // Deploy token
        AirdropToken token = new AirdropToken();

        // Approve for distribution
        token.approve(address(distributor), 500 * 10**18);

        // Use existing distributor to distribute
        // TokenDistributor(distributor_address).distribute(address(token), recipients, 100 * 10**18);

        vm.stopBroadcast();
    }
}
```

## ❓ Troubleshooting

### Erro: "Private key not provided"
```bash
export PRIVATE_KEY=0x<sua_chave_privada>
```

### Erro: "RPC URL not reachable"
- Verifique se a URL do RPC está correta
- Verifique sua conexão de internet
- Tente outra URL de RPC (há sempre alternativas)

### Erro: "Insufficient balance"
- Você precisa de BNB (ou ETH) para pagar gas
- Obtenha tokens de testnet em: https://testnet.binance.org/faucet-smart

### Erro: "Nonce too low"
- Aguarde alguns segundos entre transações
- Ou use `--nonce` no comando cast

## 📝 Exemplo Completo: Deploy + Distribuição

```bash
#!/bin/bash

# Configuração
RPC_URL="https://data-seed-prebsc-1-s1.binance.org:8545"
PRIVATE_KEY="0x..."
DISTRIBUTOR_ADDRESS="0x..."
RECIPIENTS=("0x1111..." "0x2222..." "0x3333...")

# 1. Deploy do token
echo "Deployando AirdropToken..."
TOKEN_ADDRESS=$(forge script script/DeployAirdropToken.s.sol:DeployAirdropToken \
  --rpc-url $RPC_URL \
  --broadcast | grep "Token Address" | awk '{print $NF}')

echo "Token deployado: $TOKEN_ADDRESS"

# 2. Approve
echo "Aprovando tokens para distribuição..."
cast send \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  $TOKEN_ADDRESS \
  "approve(address,uint256)" \
  $DISTRIBUTOR_ADDRESS \
  500000000000000000000

# 3. Distribuir
echo "Distribuindo tokens..."
cast send \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  $DISTRIBUTOR_ADDRESS \
  "distribute(address,address[],uint256)" \
  $TOKEN_ADDRESS \
  "[${RECIPIENTS[*]}]" \
  100000000000000000000

echo "Distribuição completa!"
```

## 🔗 Recursos Úteis

- [OpenZeppelin ERC20](https://docs.openzeppelin.com/contracts/4.x/erc20)
- [BSC Docs](https://docs.bnbchain.org/)
- [Foundry Docs](https://book.getfoundry.sh/)
- [Cast CLI Docs](https://book.getfoundry.sh/cast/)

---

**Tudo pronto para fazer deploy do seu token DROPit!** 🎉
