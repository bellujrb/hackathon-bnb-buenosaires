# LangGraph Backend

Backend NestJS com módulo LangGraph simplificado para envio de mensagens para OpenAI e retorno de respostas.

## Estrutura

```
src/
├── core/
│   └── logger/          # Serviço de logger simplificado
├── modules/
│   └── langgraph/       # Módulo LangGraph
│       ├── agents/      # Agentes (GeneralAgent)
│       ├── constants/   # Constantes e prompts
│       ├── services/    # Serviços (OpenAIModelService)
│       ├── types/       # Tipos TypeScript
│       ├── langgraph.controller.ts  # Controller para API
│       └── langgraph.module.ts      # Módulo NestJS
├── app.module.ts
└── main.ts
```

## Instalação

```bash
npm install
```

## Configuração

1. Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Configure a chave da OpenAI:
```
OPENAI_API_KEY=your_openai_api_key_here
```

## Executando

### Desenvolvimento
```bash
npm run start:dev
```

### Produção
```bash
npm run build
npm run start:prod
```

O servidor estará rodando em `http://localhost:3000`

## API

### Documentação Swagger
Acesse `http://localhost:3000/api/docs` para ver a documentação interativa da API.

### Endpoints

#### POST `/api/langgraph/message`
Envia uma mensagem para o agente e retorna a resposta.

**Body:**
```json
{
  "message": "Olá, como você está?",
  "userId": "user123",
  "chatId": "chat456",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Mensagem anterior"
    },
    {
      "role": "assistant",
      "content": "Resposta anterior"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Olá! Estou bem, obrigado por perguntar...",
  "metrics": [
    {
      "agentType": "general",
      "operation": "general_processing",
      "executionTime": 1234,
      "tokensUsed": 0,
      "toolsCalled": 0,
      "validationPassed": true,
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET `/api/langgraph/health`
Verifica a saúde do módulo LangGraph.

**Response:**
```json
{
  "status": "ok",
  "agent": {
    "type": "general",
    "priority": "medium",
    "model": "gpt-4o-mini",
    "temperature": 0.7,
    "enabled": true
  },
  "available": true
}
```

## Funcionalidades

- ✅ Comunicação com OpenAI via LangChain
- ✅ Agente General simplificado
- ✅ Suporte a histórico de conversa
- ✅ Métricas de execução
- ✅ Validação de entrada
- ✅ Documentação Swagger
- ✅ Logger customizado

## Tecnologias

- NestJS
- LangChain (OpenAI)
- TypeScript
- Swagger

