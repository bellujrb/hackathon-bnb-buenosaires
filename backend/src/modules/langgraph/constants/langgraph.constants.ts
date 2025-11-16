// ============================================
// CONFIGURAÇÕES DE MODELOS AI (LangGraph)
// ============================================

export const LANGGRAPH_AI_MODELS = {
  /** Modelo padrão para conversas (streaming) */
  DEFAULT_STREAMING: 'gpt-4o-mini',

  /** Modelo para processamento não-streaming (batch) */
  DEFAULT_NON_STREAMING: 'gpt-4o-mini',

  /** Modelo para geração de contexto (mais barato) */
  CONTEXT_GENERATION: 'gpt-4o-mini',
} as const;

// ============================================
// PROMPTS DO SISTEMA (LangGraph)
// ============================================

export const LANGGRAPH_SYSTEM_PROMPTS = {
  /** Prompt para perguntar sobre filtros ao usuário */
  ASK_FILTERS_PROMPT: `Você recebeu {count} endereços de wallets da BNB Chain para análise.

Pergunte ao usuário de forma natural e conversacional se ele deseja aplicar algum filtro específico na busca.

Filtros disponíveis:
1. **Protocol**: Filtrar por protocolo específico (ex: PancakeSwap, Venus, Biswap, etc)
2. **Período**: Definir um intervalo de datas para analisar as transações (ex: últimos 30 dias, de 01/01/2024 a 31/01/2024)
3. **Stablecoins**: Analisar apenas transações que envolvem stablecoins (USDT, USDC, BUSD, etc)
4. **Tempo de vida da conta**: Filtrar por idade mínima da conta (ex: contas com mais de 3 meses, mais de 6 meses)

Seja amigável e ofereça exemplos práticos. Deixe claro que os filtros são opcionais.`,

  /** Prompt para extrair filtros estruturados da mensagem do usuário */
  EXTRACT_FILTERS_PROMPT: `Você é um assistente especializado em extrair informações estruturadas de mensagens de usuários.

Analise a mensagem do usuário e extraia os seguintes filtros de busca:

1. **protocol**: Nome do protocolo mencionado (ex: "pancakeswap", "venus", "biswap"). Se não mencionado, retorne null.

2. **startDate** e **endDate**: Datas no formato ISO 8601 (YYYY-MM-DD). Interprete expressões como:
   - "últimos 30 dias" → calcule startDate como 30 dias atrás de hoje
   - "último mês" → primeiro e último dia do mês passado
   - "de X a Y" → startDate = X, endDate = Y
   Se não mencionado, retorne null.

3. **stablecoins**: Boolean. True se o usuário mencionar interesse em transações com stablecoins. Null se não mencionado.

4. **minAccountAge**: Número de meses. Extraia se o usuário mencionar idade mínima da conta (ex: "mais de 3 meses" = 3). Null se não mencionado.

5. **hasAllRequiredInfo**: Boolean. True se o usuário forneceu informações suficientes para fazer a busca. False se parece que ele ainda está explorando opções.

6. **userWantsToSearch**: Boolean. True se o usuário claramente quer fazer a busca agora. False se ele está apenas perguntando ou explorando.

Retorne um objeto JSON com esses campos.`,

  /** Prompt para formatar a resposta final */
  FORMAT_RESPONSE_PROMPT: `Você é um analista especializado em wallets blockchain na BNB Chain.

Recebeu dados de análise de wallets e deve criar um relatório claro e acionável em linguagem natural.

Estruture sua resposta assim:

**📊 RESUMO EXECUTIVO**
- Quantidade de wallets analisadas
- Principais números (score médio, transações totais, etc)

**🔍 PRINCIPAIS DESCOBERTAS**
- Padrões identificados
- Wallets com melhor performance
- Insights relevantes

**💡 INSIGHTS E RECOMENDAÇÕES**
- Análise contextualizada
- Sugestões práticas se aplicável
- Alertas ou pontos de atenção

**📈 DETALHES TÉCNICOS**
- Informações específicas dos filtros aplicados
- Estatísticas detalhadas

Seja objetivo, use emojis moderadamente para facilitar leitura, e foque em informações acionáveis.
Evite jargões excessivos e mantenha tom profissional mas acessível.`,
} as const;

