# DROPit Token - Automated Deployment Script

Script bash automatizado que realiza deploy completo do token DROPit e distribuição para 1000 wallets.

## 🚀 Quick Start

```bash
# Terminal 1: Inicie Anvil (local network)
anvil

# Terminal 2: Configure e execute
cd TokenDistributor
export PRIVATE_KEY=0x... # Sua chave privada
export RPC_URL=http://localhost:8545

chmod +x scripts/deploy-and-distribute.sh
./scripts/deploy-and-distribute.sh
```

Resultado: Deploy completo + distribuição para 1000 wallets em minutos!

## 📋 Features

✅ **Deploy Automático**
  - AirdropToken (DROPit)
  - TokenDistributor
  - Approval automático

✅ **Distribuição em Massa**
  - Suporta até 1000+ wallets
  - Progress bar visual
  - Validação automática

✅ **Logs Coloridos**
  - ✓ Verde para sucesso
  - ✗ Vermelho para erros
  - ℹ Azul para informações
  - → Amarelo para avisos

✅ **Resumo Detalhado**
  - Endereços dos contratos
  - Total distribuído
  - Tempo de execução
  - Salvamento em JSON

✅ **Configuração Flexível**
  - Arquivo `config.env` para customização
  - Suporte para múltiplas redes
  - Dry-run para simulação

## 📁 Arquivos

```
scripts/
├── deploy-and-distribute.sh    (Script principal)
├── config.env                  (Configurações)
├── wallets.txt                (1000 wallets)
└── DEPLOYMENT_SCRIPT.md        (Esta documentação)
```

### deploy-and-distribute.sh

Script bash principal que orquestra todo o processo.

**Features:**
- Validação de pré-requisitos (forge, cast, jq)
- Logs coloridos com símbolos
- Progress bar durante distribuição
- Salvamento de resultados em JSON
- Suporte para dry-run (simulação)

### config.env

Arquivo de configuração com:
- Endereços de RPC para diferentes redes
- Montante por wallet
- Número de wallets
- Configurações de gas (opcionais)

### wallets.txt

Lista de 1000 endereços de carteira.

**⚠️ IMPORTANTE:** Substitua pelos seus endereços reais antes de fazer deploy em produção!

## 🎮 Uso

### Uso Básico

```bash
./scripts/deploy-and-distribute.sh
```

Executa com configuração padrão (local network via Anvil).

### Uso com Opções

```bash
# Dry-run (simula sem executar)
./scripts/deploy-and-distribute.sh --dry-run

# Deploy em testnet
./scripts/deploy-and-distribute.sh --network testnet

# Modo verbose (logs detalhados)
./scripts/deploy-and-distribute.sh --verbose

# Combinando opções
./scripts/deploy-and-distribute.sh --network testnet --dry-run
```

### Help

```bash
./scripts/deploy-and-distribute.sh --help
```

## 🔧 Configuração

### Variáveis de Ambiente

**Obrigatórias:**
```bash
export PRIVATE_KEY=0x...  # Sua chave privada
export RPC_URL=...        # URL do RPC endpoint
```

**Opcionais:**
```bash
export VERBOSE=true       # Logs detalhados
export DRY_RUN=true       # Simular sem executar
```

### Config File (config.env)

```bash
NETWORK="local"
RPC_URL="http://localhost:8545"
AMOUNT_PER_WALLET="100"
WALLET_COUNT="1000"
```

Edite `config.env` para customizar:
- Network (local, testnet, mainnet)
- RPC URL
- Montante por wallet
- Número de wallets

## 🌐 Redes Suportadas

### Local (Anvil)
```bash
export RPC_URL=http://localhost:8545
./scripts/deploy-and-distribute.sh
```

### BSC Testnet
```bash
export RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
./scripts/deploy-and-distribute.sh --network testnet
```

### BSC Mainnet
```bash
export RPC_URL=https://bsc-dataseed1.bnbchain.org:443
./scripts/deploy-and-distribute.sh --network mainnet
```

### Ethereum
```bash
export RPC_URL=https://eth.llamarpc.com
./scripts/deploy-and-distribute.sh
```

### Polygon
```bash
export RPC_URL=https://polygon-rpc.com
./scripts/deploy-and-distribute.sh
```

## 📊 Exemplo de Execução

```
╔════════════════════════════════════════════╗
║ DROPit Token - Automated Deploy & Dist...  ║
╚════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
★ Checking Prerequisites
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Foundry installed
✓ Cast CLI installed
✓ jq installed
✓ Config file found
✓ Wallets file found (1000 wallets)
✓ Private key loaded
✓ RPC URL configured: http://localhost:8545

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
★ Loading Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Configuration loaded
ℹ Network: local
ℹ Amount per wallet: 100 DROPit
ℹ Total wallets: 1000
ℹ Total to distribute: 100000 DROPit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
★ Deploying AirdropToken (DROPit)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ Executing forge script...
✓ Token deployed at: 0x...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
★ Deploying TokenDistributor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ Executing forge script...
✓ Distributor deployed at: 0x...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
★ Approving Tokens for Distribution
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ Approving 100000000000000000000000 wei (100000 DROPit)...
✓ Tokens approved successfully

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
★ Distributing Tokens to 1000 Wallets
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ Preparing distribution...
ℹ Starting distribution to 1000 wallets...
[==================================================] 100% (1000/1000)
✓ Distribution completed successfully

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
★ Saving Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Results saved to: scripts/results-20240116-102530.json

╔═══════════════════════════════════════════╗
║ DEPLOYMENT & DISTRIBUTION SUMMARY         ║
╚═══════════════════════════════════════════╝

╔═══════════════════════════════════════════╣
║ Token Information
╠═══════════════════════════════════════════╣
║ Name:                    Airdrop Token
║ Symbol:                  DROPit
║ Total Supply:            1,000,000
║ Decimals:                18
║ Address:                 0x...
╠═══════════════════════════════════════════╣
║ Distributor
╠═══════════════════════════════════════════╣
║ Address:                 0x...
╠═══════════════════════════════════════════╣
║ Distribution Details
╠═══════════════════════════════════════════╣
║ Total Wallets:           1000
║ Amount per Wallet:       100 DROPit
║ Total Distributed:       100000 DROPit
║ Network:                 local
║ Timestamp:               Wed Jan 16 10:25:30 UTC 2024
╚═══════════════════════════════════════════╝

✓ All operations completed successfully!

Next Steps:
  1. Verify contracts on block explorer
  2. Check wallet balances
  3. Save contract addresses for future reference

Results saved to: scripts/results-20240116-102530.json

ℹ Total execution time: 45s
```

## 📝 Resultados

O script salva resultados em arquivo JSON:

```json
{
  "deployment": {
    "timestamp": "2024-01-16T10:25:30Z",
    "network": "local",
    "token": {
      "address": "0x...",
      "name": "Airdrop Token",
      "symbol": "DROPit",
      "totalSupply": "1000000"
    },
    "distributor": {
      "address": "0x..."
    }
  },
  "distribution": {
    "totalWallets": 1000,
    "amountPerWallet": "100",
    "totalDistributed": "100000",
    "status": "completed"
  }
}
```

## 🧪 Testando

### 1. Dry-Run (Simulação)

```bash
./scripts/deploy-and-distribute.sh --dry-run
```

Mostra exatamente o que seria executado, sem fazer nada.

### 2. Local com Anvil

```bash
# Terminal 1
anvil

# Terminal 2
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb476cadccb01a7e0f84887a4b8c6
export RPC_URL=http://localhost:8545
./scripts/deploy-and-distribute.sh
```

Usa a chave privada padrão do Anvil.

### 3. Testnet

```bash
export PRIVATE_KEY=0x...
export RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
./scripts/deploy-and-distribute.sh --network testnet
```

## ⚠️ Importante

### Antes de Usar em Produção

1. **Editar wallets.txt**
   - Substitua os 1000 endereços de exemplo pelos seus reais
   - Um endereço por linha
   - Linhas começando com # são ignoradas

2. **Verificar Configuração**
   - Network correta em config.env
   - RPC URL correto
   - Chave privada segura (nunca commitar!)

3. **Testar em Testnet Primeiro**
   - Execute em testnet antes de mainnet
   - Verifique resultados em block explorer
   - Confirme saldos das wallets

4. **Gas Adequado**
   - Tenha suficiente gas (BNB, ETH, etc)
   - Para 1000 wallets: ~1.5-2 BNB em BSC

### Segurança

⚠️ **NUNCA:**
- Commitar sua PRIVATE_KEY ao git
- Colocar chave em arquivo de configuração
- Usar a mesma chave em múltiplas redes

✅ **FAÇA:**
- Use variáveis de ambiente para sensitive data
- Use .gitignore para arquivos sensíveis
- Use .env files que não são versionados

## 🐛 Troubleshooting

### Erro: "Command not found: forge"

```bash
# Instale Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Erro: "PRIVATE_KEY not set"

```bash
export PRIVATE_KEY=0x...
```

### Erro: "RPC endpoint not reachable"

- Verifique a URL do RPC
- Teste com curl: `curl -s $RPC_URL`
- Considere usar outra URL de RPC (há alternativas)

### Erro: "Insufficient gas"

- Obtenha tokens de testnet (faucet)
- Para mainnet, certifique-se de ter saldo

### Script muito lento

- Redes públicas são mais lentas
- Use local (Anvil) para testes rápidos
- Aumente timeout se necessário

## 📚 Recursos

- [Foundry Docs](https://book.getfoundry.sh/)
- [Cast CLI](https://book.getfoundry.sh/cast/)
- [Bash Scripting](https://www.gnu.org/software/bash/manual/)
- [Ethereum RPC Methods](https://ethereum.org/en/developers/docs/apis/json-rpc/)

## 📞 Help

Para ajuda com o script:

```bash
./scripts/deploy-and-distribute.sh --help
```

---

**Pronto para fazer deploy automatizado!** 🚀
