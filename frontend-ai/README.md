## Frontend (Next.js)

App Next.js para interface de chat com IA. Conecta no backend via variável `NEXT_PUBLIC_API_URL` e consome o endpoint de streaming de mensagens.

### Tecnologias
- Next.js (App Router)
- React 19
- Tailwind (v4 config) e componentes custom
- Privy (auth) e integrações Web3 (conectores/viem)

### Como rodar
1) Instale as dependências:
```bash
npm install
```
2) Crie `.env.local` com a URL do backend:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```
3) Desenvolvimento:
```bash
npm run dev
```
Abrir: `http://localhost:3000`

### Fluxo de uso
- Página de chat: `app/chat/page.tsx`
- Faz `fetch` para: `POST {NEXT_PUBLIC_API_URL}/api/langgraph/message/stream`
- Renderiza mensagens, artefatos e execução de funções no UI

### Estrutura (resumo)
```
app/
  ├─ chat/                # Tela de chat
  ├─ pricing/ solutions/ team/ ...
  └─ providers.tsx        # Providers do app
components/
  ├─ chat/                # UI de execução de funções/artefatos
  └─ ui/                  # Botões, cards, conversa, etc.
lib/
  ├─ privy-viem.ts        # Integração Privy/Web3
  └─ utils.ts
contexts/
  └─ artifact-context.tsx # Contexto de artefatos
```

### Notas
- Configure `NEXT_PUBLIC_API_URL` apontando para o backend em execução.
- Verifique CORS no backend se for acessar de outra origem.
