# DROPit Token - Quick Start Guide

## Startup rápido para fazer deploy e airdrop

### ⚡ 60 Segundos: Deploy Local

```bash
# Terminal 1: Start Anvil
anvil

# Terminal 2: Deploy tudo (token + distribuidor + airdrop)
forge script script/DeployAndAirdrop.s.sol:DeployAndAirdrop \
  --rpc-url http://localhost:8545 \
  --broadcast

# ✅ Pronto! Você agora tem:
# - 1,000,000 DROPit em sua wallet
# - 100 DROPit enviados para cada uma das 10 wallets de exemplo
```

---

## 🎯 Casos de Uso

### Caso 1: Quero apenas o token (sem distribuição)

```bash
forge script script/DeployAirdropToken.s.sol:DeployAirdropToken \
  --rpc-url http://localhost:8545 \
  --broadcast
```

Você recebe 1,000,000 DROPit na sua wallet.

---

### Caso 2: Quero fazer airdrop com wallets reais

**Passo 1:** Edite as wallets no script

```bash
vim script/DeployAndAirdrop.s.sol

# Encontre a seção:
# address[] private recipients = [
#     0x0000000000000000000000000000000000000001,
#     ...

# Substitua pelos seus endereços reais:
# 0xSuaWallet1,
# 0xSuaWallet2,
# ... etc
```

**Passo 2:** Execute

```bash
forge script script/DeployAndAirdrop.s.sol:DeployAndAirdrop \
  --rpc-url http://localhost:8545 \
  --broadcast
```

---

### Caso 3: Quero fazer distribuição customizada (montantes diferentes)

**Passo 1:** Edite o script para custom amounts

```bash
vim script/DeployAndAirdrop.s.sol

# Encontre CustomAirdrop e edite:
# address[] private recipients = [
#     0xWallet1,
#     0xWallet2,
# ];
#
# uint256[] private amounts = [
#     100 * 10 ** 18,  // 100 DROPit para wallet1
#     500 * 10 ** 18,  // 500 DROPit para wallet2
# ];
```

**Passo 2:** Execute

```bash
forge script script/DeployAndAirdrop.s.sol:CustomAirdrop \
  --rpc-url http://localhost:8545 \
  --broadcast
```

---

### Caso 4: Deploy em BSC Testnet

```bash
# Set sua private key
export PRIVATE_KEY=0x...

# Deploy
forge script script/DeployAndAirdrop.s.sol:DeployAndAirdrop \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545 \
  --broadcast
```

---

### Caso 5: Usar com distribuidor existente

Se já tem um TokenDistributor deployado:

```bash
# No script, altere:
address constant DISTRIBUTOR_ADDRESS = 0xYourAddress;

# Execute:
forge script script/DeployAndAirdrop.s.sol:DeployAndAirdropWithExistingDistributor \
  --rpc-url http://localhost:8545 \
  --broadcast
```

---

## 💡 Comandos Úteis

### Verificar saldo do token

```bash
cast call \
  --rpc-url http://localhost:8545 \
  0x<TOKEN_ADDRESS> \
  "balanceOf(address)" \
  0x<YOUR_ADDRESS> \
  | cast to-dec
```

### Transferir tokens manualmente

```bash
cast send \
  --rpc-url http://localhost:8545 \
  --private-key $PRIVATE_KEY \
  0x<TOKEN_ADDRESS> \
  "transfer(address,uint256)" \
  0x<RECIPIENT> \
  100000000000000000000
```

### Fazer mint de novos tokens

```bash
cast send \
  --rpc-url http://localhost:8545 \
  --private-key $PRIVATE_KEY \
  0x<TOKEN_ADDRESS> \
  "mint(address,uint256)" \
  0x<RECIPIENT> \
  1000000000000000000
```

---

## 🚨 Checklist

- [ ] Editou as wallets para valores reais (não use 0x0000...)?
- [ ] RPC URL está correto?
- [ ] Tem suficiente gas?
- [ ] Private key está setada corretamente?

---

## 📊 O que Você Vai Receber

### Depois do Deploy:

```
AirdropToken (DROPit)
├── Seu saldo: 1,000,000 DROPit (initial supply - distribuído)
├── Wallet 1: 100 DROPit
├── Wallet 2: 100 DROPit
├── Wallet 3: 100 DROPit
├── ... (10 wallets total)
└── TokenDistributor: Contrato para gerenciar distribuições

Total distribuído: 1,000 DROPit
Seu saldo restante: 999,000 DROPit
```

---

## 🔗 Próximas Steps

1. ✅ Deploy token (você está aqui)
2. Verificar saldos no Block Explorer
3. Integrar com seu projeto
4. (Opcional) Fazer listing em DEX
5. (Opcional) Criar comunidade ao redor do token

---

## 📞 Help

- Erro de compilação? → `forge build`
- Quer testar antes? → Use `anvil` (local network)
- Precisa de gas? → Use testnet faucet
- Quer fazer burn de tokens? → `cast send ... "burn(uint256)" ...`

---

**Bom airdrop! 🚀**
