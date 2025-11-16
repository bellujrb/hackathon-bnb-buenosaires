# Hackathon BNB Buenos Aires — Whitepaper

## 1. Resumo executivo
Este projeto entrega um assistente conversacional para análise de wallets na BNB Chain. Usuários interagem em linguagem natural, enviam listas de endereços (CSV/XLS/XLSX) e obtêm relatórios estruturados com filtros específicos (protocolo, período, stablecoins, idade da conta, etc.). A solução combina:
- Frontend Next.js para chat e visualização de artefatos.
- Backend NestJS com LangGraph/LangChain para um pipeline de raciocínio e execução com streaming (SSE).
- Extração estruturada de filtros e integração pronta para ferramentas de busca on‑chain/off‑chain.

O foco é reduzir a fricção da análise on‑chain: do upload de dados ao insight contextualizado, tudo num fluxo conversacional.

## 2. Problema
Analisar grandes listas de endereços on‑chain é complexo:
- Heterogeneidade de dados, qualidade irregular e formatos diferentes.
- Definição de filtros relevantes exige conhecimento técnico.
- Ferramentas tradicionais são pouco acessíveis a usuários não‑técnicos.

Impacto: analistas, growth/BD, equipes de grants e airdrops perdem tempo em tarefas manuais (normalização, triagem, queries) e correm risco de vieses e erros.

## 3. Proposta de valor
**Conversational-first**: o usuário descreve o que deseja; o sistema guia elicitação de filtros e gera relatórios claros.
**Upload inteligente**: planilhas comuns são aceitas e endereços BNB são extraídos e deduplicados automaticamente.
**Pipeline confiável**: nós bem definidos para validação, extração estruturada, execução de busca e formatação de resultados.
**Extensível**: acopla facilmente novas “tools” de dados (explorers, indexers, data lakes), modelos e prompts.

KPIs esperados:
- Redução de 60–80% no tempo para chegar a um relatório inicial.
- Diminuição de erros de formatação/entrada.
- Aumento de adoção por times não‑técnicos.

## 4. Arquitetura
Monorepo com dois serviços:
- `frontend-ai` (Next.js, React 19, Tailwind v4): UI de chat, upload, artefatos.
- `backend` (NestJS, LangGraph/LangChain, SSE, Swagger): API e orquestração de LLMs.
- `blockchain` (Solidity + Foundry): contrato `TokenDistributor` e scripts de airdrop.

Comunicação: o frontend chama `POST /api/langgraph/message/stream` com histórico e, opcionalmente, endereços. O backend emite tokens por SSE até o término.

### 4.1 Pipeline LangGraph
Nós principais (ver `backend/src/modules/langgraph/nodes/pipeline.nodes.ts`):
1) Validate Addresses (não‑agêntico)  
   - Normaliza, valida e deduplica endereços BNB (\`0x\` + 40 hex). Se vazio, tenta extrair da última mensagem humana (regex).
2) Ask Filters (agêntico/LLM)  
   - Se não houver endereços, pede de forma natural. Caso haja, confirma a recepção e solicita filtros (protocolo, janela de tempo, stablecoins, idade da conta, etc.).
3) Extract Filters (agêntico com structured output)  
   - Usa prompt com \`structured output\` para retornar um objeto tipado (\`ExtractedFilters\`) com campos como \`protocol\`, \`period\`, \`stablecoins\`, \`minAccountAge\`, \`userWantsToSearch\`, \`hasAllRequiredInfo\`.
4) Call Backend (não‑agêntico/tool)  
   - Chama uma função de busca configurável com \`addresses\` e \`filters\`. Retorna \`BackendResponse\` com \`success\`, \`data\` e métricas.
5) Format Response (agêntico/LLM)  
   - Gera relatório natural e completo com base nos resultados da busca e filtros aplicados, pronto para exibição no chat.

### 4.2 Backend
- Controller: `langgraph.controller.ts`
  - `POST /message` e `POST /message/stream` (principal com SSE).
  - Rotas de saúde e rotas específicas para análise de listas explícitas.
- Services: `openai-model.service.ts`, `conversation-state.service.ts`.
- Tipos/Constantes: prompts e modelos de tipos para estado e filtros.

### 4.3 Frontend
- Página de chat: `app/chat/page.tsx`
  - Mantém \`messages\`, faz streaming com \`fetch\` + \`ReadableStream\`.
  - Upload e parsing de CSV/XLS/XLSX (com \`xlsx\`), detecção de delimitador, deduplicação de endereços.
  - Ações do usuário (retry/like/dislike/share/copy).
  - Artefatos custom (ex.: exibir “tabela de exemplo” quando solicitado).

### 4.4 Blockchain
- Contrato: `TokenDistributor.sol` para distribuição de tokens ERC20:
  - `distribute(token, recipients, amountPerWallet)` para valores iguais.
  - `distributeBatch(token, recipients, amounts)` para valores variáveis.
- Segurança: SafeERC20, validação de entradas, eventos de log, otimizações de gas.
- Ferramentas: Foundry (\`forge\`/\`anvil\`) para build/test/deploy; ver \`blockchain/README.md\`.
- Uso típico:
  - Aprovar previamente o total (ERC20 \`approve\`) ao contrato distribuidor.
  - Executar a distribuição em lote (igual ou variável).

## 5. Fluxo de dados
1. Usuário envia mensagem (com ou sem planilha de endereços).  
2. Backend valida/extrai endereços e elicita filtros.  
3. LLM retorna filtros estruturados; se incompletos, volta a dialogar.  
4. Quando pronto, tool de busca é chamada com filtros e endereços.  
5. Dados retornam e LLM formata o relatório final.  
6. Tokens são enviados via SSE; frontend renderiza gradualmente.  

## 6. Segurança e privacidade
- Endereços e mensagens trafegam via HTTPS (recomendado em produção).
- Chave OpenAI somente no backend, nunca no frontend.
- Logs: evitar armazenar payloads completos em produção; anonimizar quando necessário.
- CORS restrito ao domínio do frontend.
- Sem PII por padrão; se coletado, seguir LGPD/GDPR.

## 7. Integrações e extensões
- Tools de dados: explorers (BscScan/OKLink), indexadores (The Graph), data providers comerciais, ou pipelines internos.
- Modelos: swap fácil do provedor LLM ou ajuste de prompts por domínio (compliance, risk, growth).
- Artefatos: gráficos, tabelas, CSV export, dashboards.

## 8. Governança e operações
- Versionamento e CI/CD para \`frontend-ai\` e \`backend\`.
- Observabilidade: métricas (tempo por nó, tokens, erros), tracing por requisição, logs estruturados.
- Gestão de prompts: versionar templates, controlar variações por ambiente.

## 9. Roadmap
Curto prazo:
- Tool real de busca on‑chain (agora placeholder), conectando a uma API indexada.
- Export de resultados (CSV/JSON) e visualizações (charts).
- Afinar prompts para diferentes personas (BD, grants, compliance).

Médio prazo:
- Enriquecimento com heurísticas anti‑sybil e classificação por risco.
- Cache e replays de conversas com estado.
- Fine‑tuning de modelos e avaliação automática (LLM-as-judge).

Longo prazo:
- Integrações multi‑cadeia e enriquecimento cross‑chain.
- Marketplace de “playbooks” de análise reutilizáveis.
- Controles de acesso e auditoria granular.

## 10. Métricas de sucesso
- Tempo até o primeiro insight (TTFI).
- % de conversas que chegam a \`hasAllRequiredInfo = true\`.
- Taxa de sucesso do tool backend e latência média por nó.
- Satisfação (Like/Dislike) e retenção de usuários.

## 11. Considerações de compliance
- Evitar aconselhamento financeiro automatizado.
- Transparência sobre fontes de dados e limitações de LLMs.
- Regras de uso para dados sensíveis do usuário (se houver).

## 12. Conclusão
Este projeto entrega uma base sólida para análise conversacional de wallets na BNB Chain, com arquitetura modular, UX acessível e um pipeline LLM robusto. A extensão para novas fontes, modelos e artefatos é direta, permitindo evolução rápida conforme necessidades de produto e do ecossistema.


