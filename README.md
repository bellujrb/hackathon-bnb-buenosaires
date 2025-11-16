## Hackathon BNB Buenos Aires — Monorepo

Aplicação full‑stack para análise conversacional de wallets na BNB Chain. O frontend (Next.js) oferece uma interface de chat com upload de listas (CSV/XLS/XLSX) e visualização de artefatos; o backend (NestJS + LangGraph/LangChain) orquestra um pipeline multi‑etapas com streaming (SSE) e integração com modelos OpenAI.

### Estrutura do repositório
```
.
├── frontend-ai/        # App Next.js (chat, UI, upload, artefatos)
├── backend/            # API NestJS (LangGraph, SSE, validação, prompts)
└── blockchain/         # Contratos Solidity + Foundry (TokenDistributor, scripts)
```

### Principais recursos
- Chat com IA e streaming em tempo real (SSE).
- Upload de planilhas (.csv, .xls, .xlsx) com extração automática de endereços BNB.
- Pipeline LangGraph com nós: validação, elicitação de filtros, extração estruturada, execução de busca e formatação de relatório.
- Renderização de artefatos (por ex. “tabela de exemplo”) no frontend.
- Integrações Web3 (Privy/viem) e UI moderna (Tailwind, componentes custom).
- Módulo blockchain com contrato `TokenDistributor` para airdrops (igual e em lote) e toolchain Foundry (build, test, deploy).

---

## Como rodar localmente

Pré‑requisitos:
- Node.js 18+ e npm
- Chave da OpenAI (`OPENAI_API_KEY`) para o backend

1) Backend
```bash
cd backend
npm install
cp .env.example .env   # se existir; caso contrário, crie .env
# Edite .env e defina:
# OPENAI_API_KEY=sk-...
npm run start:dev
# Servirá em http://localhost:3000
```

2) Frontend
```bash
cd frontend-ai
npm install
cp .env.local.example .env.local  # se existir; caso contrário, crie .env.local
# Edite .env.local e defina:
# NEXT_PUBLIC_API_URL=http://localhost:3000
npm run dev
# Acesse http://localhost:3000
```

Observação: se a porta do frontend conflitar com o backend, ajuste a porta do Next (ex.: 3001) e mantenha `NEXT_PUBLIC_API_URL` apontando para o backend.

---

## Fluxo de uso (end‑to‑end)
1. Abra `http://localhost:3000` (frontend) e vá para a página de chat (`/chat`).
2. Opcional: importe uma planilha com endereços BNB (a UI faz a extração e deduplicação).
3. Envie uma mensagem. O frontend inicia streaming para `POST /api/langgraph/message/stream` no backend.
4. O backend executa o pipeline:
   - Valida/infere endereços (regex 0x...40 hex).
   - Elicita filtros (protocolo, período, stablecoins, idade da conta etc.).
   - Extrai filtros como saída estruturada (LangChain structured output).
   - Chama função de busca (tool) e agrega dados.
   - Formata relatório final via LLM e envia por SSE.
5. O frontend renderiza a resposta e, quando pertinente, artefatos (ex.: tabela).

---

## Detalhes técnicos

### Frontend (`frontend-ai/`)
- Next.js (App Router), React 19, Tailwind v4.
- Componentes em `components/ui` e `components/chat`.
- Página principal de chat em `app/chat/page.tsx`:
  - Streaming SSE via `fetch` para `${NEXT_PUBLIC_API_URL}/api/langgraph/message/stream`.
  - Upload/parse de CSV/XLS/XLSX com extração de endereços e deduplicação.
  - UI de mensagens, ações (retry/like/dislike/share/copy) e artefatos.

Variáveis:
- `NEXT_PUBLIC_API_URL` — base da API do backend.

Scripts úteis:
```bash
npm run dev
npm run build
npm start
```

### Backend (`backend/`)
- NestJS, LangChain/LangGraph, SSE, Swagger.
- Módulo principal: `modules/langgraph/` com:
  - `nodes/pipeline.nodes.ts` (válida endereços, pergunta/extrai filtros, chama tool de busca, formata relatório).
  - `langgraph.controller.ts` (rotas `message`, `message/stream`, `analyze-wallets`, health).
  - `services/*` (OpenAIModelService, estado da conversa).

Variáveis:
- `OPENAI_API_KEY` — chave OpenAI.

Scripts úteis:
```bash
npm run start:dev
npm run build
npm run start:prod
```

Endpoints (prefixo `/api/langgraph`):
- `POST /message/stream` — streaming SSE da conversa (principal).
- `POST /message` — resposta não‑streaming.
- `POST /analyze-wallets` e `/analyze-wallets/stream` — execução com lista explícita.
- `GET /health` — status do agente.

### Blockchain (`blockchain/`)
- Contrato principal: `TokenDistributor.sol` (airdrop igualitário e em lote) com SafeERC20 e otimizações de gas.
- Tooling: Foundry (`forge`, `anvil`) para build, teste, gas-report e deploy.
- Documentos úteis: `AIRDROP_SCRIPTS.md`, `AIRDROP_TOKEN_GUIDE.md`, `QUICK_START_AIRDROP.md`, `USAGE.md`, `PROJECT_SUMMARY.md`, `CHECKLIST.md`.

Comandos básicos:
```bash
cd blockchain
forge install
forge build
forge test --gas-report
# Local
anvil
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

---

## Deploy (resumo)
- Backend: containerize (Node 18+), expor porta 3000, definir `OPENAI_API_KEY`. Habilitar CORS para o domínio do frontend e usar proxy reverso (NGINX/Cloudflare) para SSE.
- Frontend: build Next.js e hospedar (Vercel/Netlify) com `NEXT_PUBLIC_API_URL` apontando para a API pública do backend.
 - Blockchain: usar Foundry para deploy (testnet/mainnet). Ver `blockchain/README.md` e `blockchain/AIRDROP_SCRIPTS.md`.

---

## Licença
Defina a licença do projeto (ex.: MIT) conforme a necessidade do hackathon/organização.

---

## Whitepaper
Conteúdo completo do whitepaper está em `WHITEPAPER.md`.


