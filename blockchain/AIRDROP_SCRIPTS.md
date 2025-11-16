# Scripts de Airdrop - Guia Completo

Este documento descreve os três scripts de airdrop disponíveis.

## 📋 Scripts Disponíveis

### 1. `DeployAirdropToken.s.sol` - Deploy Apenas do Token

**O que faz:**
- Deploy do AirdropToken (DROPit)
- Minta 1,000,000 DROPit para você

**Quando usar:**
- Quando você quer deploy apenas do token
- Para usar depois com um TokenDistributor já existente

**Comando:**
```bash
forge script script/DeployAirdropToken.s.sol:DeployAirdropToken \
  --rpc-url http://localhost:8545 \
  --broadcast
```

**Exemplo Local:**
```bash
# Terminal 1
anvil

# Terminal 2
forge script script/DeployAirdropToken.s.sol:DeployAirdropToken \
  --rpc-url http://localhost:8545 \
  --broadcast
```

---

### 2. `DeployAndAirdrop.s.sol` - Deploy Completo + Airdrop

Três variações disponíveis:

#### A. `DeployAndAirdrop` - Deploy Tudo + Airdrop para 10 Wallets

**O que faz:**
1. Deploy AirdropToken (DROPit)
2. Deploy TokenDistributor (novo)
3. Distribui 100 DROPit para cada uma das 10 wallets

**Wallets Padrão:**
```
0x1111111111111111111111111111111111111111
0x2222222222222222222222222222222222222222
0x3333333333333333333333333333333333333333
0x4444444444444444444444444444444444444444
0x5555555555555555555555555555555555555555
0x6666666666666666666666666666666666666666
0x7777777777777777777777777777777777777777
0x8888888888888888888888888888888888888888
0x9999999999999999999999999999999999999999
0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```

**Comando:**
```bash
forge script script/DeployAndAirdrop.s.sol:DeployAndAirdrop \
  --rpc-url http://localhost:8545 \
  --broadcast
```

---

#### B. `DeployAndAirdropWithExistingDistributor` - Deploy Token + Use Distributor Existente

**O que faz:**
1. Deploy AirdropToken (DROPit)
2. Usa TokenDistributor existente
3. Distribui 100 DROPit para 10 wallets

**Antes de usar:**
1. Modifique o endereço do distribuidor no script:
```solidity
address constant DISTRIBUTOR_ADDRESS = 0x...; // Seu distribuidor
```

2. Execute:
```bash
forge script script/DeployAndAirdrop.s.sol:DeployAndAirdropWithExistingDistributor \
  --rpc-url http://localhost:8545 \
  --broadcast
```

---

#### C. `CustomAirdrop` - Deploy + Distribuição Customizada

**O que faz:**
1. Deploy AirdropToken
2. Distribui montantes diferentes para cada wallet

**Customização:**
Modifique o script para suas wallets e montantes:

```solidity
// Substitua estas linhas no script:
address[] private recipients = [
    0x1234..., // Seu wallet 1
    0x5678..., // Seu wallet 2
    // ... mais wallets
];

uint256[] private amounts = [
    100 * 10 ** 18,  // 100 DROPit para wallet 1
    200 * 10 ** 18,  // 200 DROPit para wallet 2
    // ... mais montantes
];
```

**Comando:**
```bash
forge script script/DeployAndAirdrop.s.sol:CustomAirdrop \
  --rpc-url http://localhost:8545 \
  --broadcast
```

---

## 🚀 Exemplos Práticos

### Exemplo 1: Airdrop Simples (Tudo Novo)

```bash
# Terminal 1
anvil

# Terminal 2
export RPC_URL=http://localhost:8545

forge script script/DeployAndAirdrop.s.sol:DeployAndAirdrop \
  --rpc-url $RPC_URL \
  --broadcast

# Resultado:
# - AirdropToken deployado
# - TokenDistributor deployado
# - 1000 DROPit distribuídos (100 para cada uma das 10 wallets)
```

### Exemplo 2: Usar Distribuidor Existente

```bash
# Primeiro, pega o endereço do seu distribuidor existente
DISTRIBUTOR=0xYourDistributorAddress

# Edita o script:
sed -i '' "s/address(0)/$DISTRIBUIDOR/" script/DeployAndAirdrop.s.sol

# Executa:
forge script script/DeployAndAirdrop.s.sol:DeployAndAirdropWithExistingDistributor \
  --rpc-url http://localhost:8545 \
  --broadcast
```

### Exemplo 3: Airdrop Customizado com Tiering

Edite `script/DeployAndAirdrop.s.sol` e modifique `CustomAirdrop`:

```solidity
address[] private recipients = [
    0xVIP1,
    0xVIP2,
    0xCommunity1,
    0xCommunity2
];

uint256[] private amounts = [
    1000 * 10 ** 18,  // VIP: 1000 DROPit
    1000 * 10 ** 18,  // VIP: 1000 DROPit
    100 * 10 ** 18,   // Community: 100 DROPit
    100 * 10 ** 18    // Community: 100 DROPit
];
```

Execute:
```bash
forge script script/DeployAndAirdrop.s.sol:CustomAirdrop \
  --rpc-url http://localhost:8545 \
  --broadcast
```

---

## 🔧 Configuração por Rede

### BSC Testnet

```bash
export PRIVATE_KEY=0x...

forge script script/DeployAndAirdrop.s.sol:DeployAndAirdrop \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545 \
  --broadcast
```

### BSC Mainnet

```bash
export PRIVATE_KEY=0x...

forge script script/DeployAndAirdrop.s.sol:DeployAndAirdrop \
  --rpc-url https://bsc-dataseed1.bnbchain.org:443 \
  --broadcast
```

### Ethereum

```bash
export PRIVATE_KEY=0x...

forge script script/DeployAndAirdrop.s.sol:DeployAndAirdrop \
  --rpc-url https://eth.llamarpc.com \
  --broadcast
```

### Polygon

```bash
export PRIVATE_KEY=0x...

forge script script/DeployAndAirdrop.s.sol:DeployAndAirdrop \
  --rpc-url https://polygon-rpc.com \
  --broadcast
```

---

## 📊 Custo de Gas Estimado

### Deploy Completo + Airdrop (10 wallets)

```
Componentes:
- Deploy AirdropToken: ~150,000 gas
- Deploy TokenDistributor: ~670,000 gas
- Approval: ~50,000 gas
- Distribuição (10 wallets): ~400,000 gas
----------------------------------------------
Total: ~1,270,000 gas

Em BSC:
- Gas médio: 3-5 Gwei
- Custo estimado: 0.005-0.007 BNB (~$2-3)

Em Ethereum:
- Gas médio: 20-50 Gwei
- Custo estimado: 0.025-0.065 ETH (~$50-150)
```

---

## ✅ Checklist de Uso

### Antes de Executar

- [ ] RPC URL está correto
- [ ] Chave privada está setada (se não for local)
- [ ] Tem suficiente gas (BNB/ETH) para pagar
- [ ] Wallets destinatárias são válidas
- [ ] Montantes estão corretos

### Depois de Executar

- [ ] Verificar endereço do token deployado
- [ ] Verificar endereço do distribuidor
- [ ] Verificar saldos das wallets receptoras
- [ ] Guardar endereços em local seguro
- [ ] Verificar em block explorer (opcional)

---

## 🔍 Verificação em Block Explorer

### Verificar Token

```bash
# BSCScan
https://testnet.bscscan.com/token/0x<TOKEN_ADDRESS>

# Etherscan
https://etherscan.io/token/0x<TOKEN_ADDRESS>

# Polygonscan
https://polygonscan.com/token/0x<TOKEN_ADDRESS>
```

### Verificar Distribuições

```bash
# Procure por transferências com:
# From: TokenDistributor
# To: Recipients (0x1111..., 0x2222..., etc)
```

---

## ⚠️ Importante: Personalize as Wallets!

Os scripts vêm com wallets de exemplo **0x1111...**, **0x2222...**, etc.

**VOCÊ DEVE MODIFICAR ESSAS WALLETS COM AS WALLETS REAIS ANTES DE EXECUTAR!**

### Como Modificar:

**Opção 1: Editar o arquivo**
```bash
# Abra o arquivo em seu editor
vim script/DeployAndAirdrop.s.sol

# Encontre a seção de recipients e modifique
```

**Opção 2: Script de Substituição**
```bash
# Substitua as wallets
sed -i '' 's/0x1111111111111111111111111111111111111111/0xYourWallet1/g' script/DeployAndAirdrop.s.sol
sed -i '' 's/0x2222222222222222222222222222222222222222/0xYourWallet2/g' script/DeployAndAirdrop.s.sol
# ... etc
```

---

## 🐛 Troubleshooting

### Erro: "DISTRIBUTOR_ADDRESS not set"

**Problema**: Você usou `DeployAndAirdropWithExistingDistributor` sem configurar o endereço.

**Solução**:
```solidity
// No script, altere:
address constant DISTRIBUTOR_ADDRESS = 0x...; // Seu endereço aqui
```

### Erro: "arrays length mismatch"

**Problema**: Recipients e amounts têm tamanhos diferentes.

**Solução**: Verifique se estão iguais:
```solidity
address[] private recipients = new address[](5); // 5 wallets
uint256[] private amounts = new uint256[](5);    // 5 montantes
```

### Erro: "Insufficient balance"

**Problema**: Não tem suficiente gas.

**Solução**: Obtenha tokens de testnet:
- BSC Testnet: https://testnet.binance.org/faucet-smart
- Ethereum Testnet: Use Sepolia faucet

### Erro: "Invalid RPC URL"

**Problema**: URL do RPC está incorreta.

**Solução**: Verifique a URL:
```bash
# Teste a conexão
curl -s https://data-seed-prebsc-1-s1.binance.org:8545 \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

---

## 📚 Recursos

- [OpenZeppelin ERC20](https://docs.openzeppelin.com/contracts/5.x/erc20)
- [Foundry Script Docs](https://book.getfoundry.sh/forge/scripts)
- [BSC Docs](https://docs.bnbchain.org/)
- [Block Explorer Links](https://www.alchemy.com/list-of-rpc-endpoints)

---

**Tudo pronto para fazer seu airdrop DROPit!** 🎉
