## Hackathon BNB Buenos Aires — Monorepo

Full‑stack application for conversational analysis of BNB Chain wallets. The frontend (Next.js) provides a chat interface with spreadsheet upload (CSV/XLS/XLSX) and artifact visualization; the backend (NestJS + LangGraph/LangChain) orchestrates a multi‑step pipeline with real‑time streaming (SSE) and OpenAI integration.

### Repository structure
```
.
├── frontend-ai/        # Next.js app (chat, UI, uploads, artifacts)
├── backend/            # NestJS API (LangGraph, SSE, validation, prompts)
└── blockchain/         # Solidity + Foundry (TokenDistributor, scripts)
```

### Key features
- AI chat with real‑time streaming (SSE).
- Spreadsheet upload (.csv, .xls, .xlsx) with automatic BNB address extraction and deduplication.
- LangGraph pipeline nodes: address validation, filter elicitation, structured extraction, backend tool call, and report formatting.
- Artifact rendering in the frontend (e.g., “example table”).
- Web3 integrations (Privy/viem) and modern UI (Tailwind, custom components).
- Blockchain module with `TokenDistributor` for equal and batch airdrops using Foundry toolchain.

---

## Run locally

Prerequisites:
- Node.js 18+ and npm
- OpenAI key (`OPENAI_API_KEY`) for the backend

1) Backend
```bash
cd backend
npm install
cp .env.example .env   # if available; otherwise, create .env
# Set your OpenAI key:
# OPENAI_API_KEY=sk-...
npm run start:dev
# Serves at http://localhost:3000
```

2) Frontend
```bash
cd frontend-ai
npm install
cp .env.local.example .env.local  # if available; otherwise, create .env.local
# Set the backend URL:
# NEXT_PUBLIC_API_URL=http://localhost:3000
npm run dev
# Open http://localhost:3000
```

Note: if the frontend port conflicts with the backend, run Next on a different port (e.g., 3001) and keep `NEXT_PUBLIC_API_URL` pointing to the backend.

---

## End‑to‑end usage
1. Open `http://localhost:3000` (frontend) and go to `/chat`.
2. Optional: import a spreadsheet with BNB addresses (the UI extracts & deduplicates).
3. Send a message. The frontend streams to `POST /api/langgraph/message/stream`.
4. The backend runs the pipeline:
   - Validates/infers addresses (0x + 40 hex).
   - Elicits filters (protocol, time window, stablecoins, account age, etc.).
   - Extracts filters as structured output (LangChain).
   - Calls a search tool with the filters and addresses.
   - Formats the final report with the LLM and streams it back via SSE.
5. The frontend renders the response and, when relevant, artifacts (e.g., tables).

---

## Technical details

### Frontend (`frontend-ai/`)
- Next.js (App Router), React 19, Tailwind v4.
- Components in `components/ui` and `components/chat`.
- Main chat page at `app/chat/page.tsx`:
  - SSE streaming via `fetch` to `${NEXT_PUBLIC_API_URL}/api/langgraph/message/stream`.
  - CSV/XLS/XLSX upload/parse with address extraction & deduplication.
  - Message UI, actions (retry/like/dislike/share/copy), and artifacts.

Environment:
- `NEXT_PUBLIC_API_URL` — backend API base URL.

Useful scripts:
```bash
npm run dev
npm run build
npm start
```

### Backend (`backend/`)
- NestJS, LangChain/LangGraph, SSE, Swagger.
- Main module: `modules/langgraph/` with:
  - `nodes/pipeline.nodes.ts` (validate addresses, ask/extract filters, call search tool, format report).
  - `langgraph.controller.ts` (routes: `message`, `message/stream`, `analyze-wallets`, `health`).
  - `services/*` (OpenAIModelService, conversation state).

Environment:
- `OPENAI_API_KEY` — OpenAI key.

Useful scripts:
```bash
npm run start:dev
npm run build
npm run start:prod
```

Endpoints (prefix `/api/langgraph`):
- `POST /message/stream` — main SSE streaming endpoint.
- `POST /message` — non‑streaming response.
- `POST /analyze-wallets` and `/analyze-wallets/stream` — explicit list execution.
- `GET /health` — agent status.

### Blockchain (`blockchain/`)
- Main contract: `TokenDistributor.sol` (equal and batch airdrops) with SafeERC20 and gas optimizations.
- Tooling: Foundry (`forge`, `anvil`) for build, test, gas report and deploy.
- Useful docs: `AIRDROP_SCRIPTS.md`, `AIRDROP_TOKEN_GUIDE.md`, `QUICK_START_AIRDROP.md`, `USAGE.md`, `PROJECT_SUMMARY.md`, `CHECKLIST.md`.

Basic commands:
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

## Deployment

### Backend (NestJS)
Options:
- Node on VM/container, or Docker.
- Ensure CORS is enabled for the frontend domain and a reverse proxy supports SSE (e.g., NGINX/Cloudflare).

Environment:
- `OPENAI_API_KEY`

Node example:
```bash
cd backend
npm ci
NODE_ENV=production OPENAI_API_KEY=sk-... npm run build
OPENAI_API_KEY=sk-... npm run start:prod
```

Docker example (minimal):
```Dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend ./
RUN npm run build

FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["npm","run","start:prod"]
```

### Frontend (Next.js)
Options:
- Vercel/Netlify or any Node hosting.

Environment:
- `NEXT_PUBLIC_API_URL` pointing to the public backend (e.g., `https://api.example.com`)

Vercel example:
- Set `NEXT_PUBLIC_API_URL` in Project Settings → Environment Variables.
- Deploy via Git integration or `vercel --prod`.

Self-hosted Node:
```bash
cd frontend-ai
npm ci
npm run build
NEXT_PUBLIC_API_URL=https://api.example.com npm start
```

### Blockchain (Foundry)
Testnet deployment:
```bash
cd blockchain
export PRIVATE_KEY=0x...            # use a secure method in production
forge script script/Deploy.s.sol \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545 \
  --broadcast
``]

Mainnet deployment:
```bash
cd blockchain
export PRIVATE_KEY=0x...
forge script script/Deploy.s.sol \
  --rpc-url https://bsc-dataseed1.bnbchain.org:443 \
  --broadcast
```

Verification (if supported):
```bash
forge verify-contract <contract-address> <contract-name> \
  --chain bsc \
  --etherscan-api-key <BSCSCAN_API_KEY>
```

---

## License
Choose the license that fits your needs (e.g., MIT).

---

## Whitepaper
See `WHITEPAPER.md` for a full technical overview.


