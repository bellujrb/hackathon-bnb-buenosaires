const { AIMessage, HumanMessage, SystemMessage } = require('@langchain/core/messages');
import { PipelineState, ExtractedFilters, BackendResponse } from '../types/pipeline.types';
import { LANGGRAPH_SYSTEM_PROMPTS } from '../constants/langgraph.constants';

// ============================================================================
// Node 1: Validate Addresses (não-agêntico)
// ============================================================================

export const validateAddressesNode = (state: PipelineState): Partial<PipelineState> => {
  const { addresses, validAddresses: existingValid, messages } = state;

  // Se já foi validado, apenas passa adiante
  if (existingValid && existingValid.length > 0) {
    console.log('[ValidateAddresses] Already validated, skipping');
    return {};
  }

  // Se não houver endereços, tentar extrair da mensagem do usuário
  if (!addresses || addresses.length === 0) {
    // Pegar a última mensagem do usuário
    const lastUserMessage = messages
      ?.slice()
      .reverse()
      .find((m) => m._getType() === 'human');

    if (lastUserMessage) {
      const messageContent = String(lastUserMessage.content);
      const addressRegex = /0x[a-fA-F0-9]{40}/g;
      const extractedAddresses = messageContent.match(addressRegex) || [];

      if (extractedAddresses.length > 0) {
        console.log('[ValidateAddresses] Found addresses in message:', extractedAddresses.length);

        // Validar e adicionar ao estado
        const validAddrs = Array.from(new Set(extractedAddresses.map(a => a.toLowerCase())));

        return {
          addresses: validAddrs,
          validAddresses: validAddrs,
          addressCount: validAddrs.length,
          currentStep: 'ask_filters',
        };
      }
    }

    console.log('[ValidateAddresses] No addresses provided, will ask user for addresses');
    return {
      validAddresses: [],
      addressCount: 0,
      currentStep: 'ask_filters',
    };
  }

  // Validar formato de endereços BNB Chain (0x + 40 caracteres hexadecimais)
  const validAddresses = addresses.filter((addr) => {
    if (typeof addr !== 'string') return false;
    const cleaned = addr.trim().toLowerCase();
    return /^0x[a-f0-9]{40}$/.test(cleaned);
  });

  // Remove duplicatas
  const uniqueAddresses = Array.from(new Set(validAddresses));

  console.log('[ValidateAddresses]', {
    total: addresses.length,
    valid: validAddresses.length,
    unique: uniqueAddresses.length,
    invalid: addresses.length - validAddresses.length,
  });

  return {
    validAddresses: uniqueAddresses,
    addressCount: uniqueAddresses.length,
    currentStep: 'ask_filters',
  };
};

// ============================================================================
// Node 2: Ask Filters (agêntico com LLM)
// ============================================================================

export const askFiltersNode = async (
  state: PipelineState,
  llm: any,
): Promise<Partial<PipelineState>> => {
  const { addressCount, validAddresses, messages, currentStep } = state;

  // Se já estamos além de ask_filters (em extract_filters), pular este node
  if (currentStep === 'extract_filters' || currentStep === 'call_backend' || currentStep === 'format_response') {
    console.log('[AskFilters] Skipping, already at step:', currentStep);
    return { needsUserInput: false };
  }

  // Se não tiver endereços, pedir ao usuário
  if (addressCount === 0) {
    const prompt = `Você é um assistente especializado em análise de wallets da BNB Chain.

O usuário entrou em contato, mas não forneceu endereços de wallets ainda.

Seja amigável e peça ao usuário que forneça os endereços de wallets da BNB Chain que deseja analisar.
Explique que os endereços devem estar no formato 0x seguido de 40 caracteres hexadecimais.

Seja conversacional e natural.`;

    const systemMsg = new SystemMessage(prompt);
    const conversationMessages = [systemMsg, ...messages];

    // Invocar LLM
    const response = await llm.invoke(conversationMessages);

    console.log('[AskFilters] Asking user for addresses');

    return {
      messages: [...messages, new AIMessage(response.content)],
      currentStep: 'ask_filters',
      needsUserInput: true,
    };
  }

  // Criar prompt personalizado mostrando os endereços recebidos
  const sampleAddresses = validAddresses.slice(0, 3).join('\n- ');
  const prompt = `${LANGGRAPH_SYSTEM_PROMPTS.ASK_FILTERS_PROMPT}

CONTEXTO IMPORTANTE:
Você JÁ RECEBEU ${addressCount} endereços de wallets válidos.
Primeiros endereços:
- ${sampleAddresses}
${addressCount > 3 ? `... e mais ${addressCount - 3} endereços` : ''}

CONFIRME que recebeu os endereços e pergunte sobre os filtros de forma natural.`.replace('{count}', addressCount.toString());

  const systemMsg = new SystemMessage(prompt);
  const conversationMessages = [systemMsg, ...messages];

  // Invocar LLM
  const response = await llm.invoke(conversationMessages);

  console.log('[AskFilters] LLM response generated for', addressCount, 'addresses');

  return {
    messages: [...messages, new AIMessage(response.content)],
    currentStep: 'extract_filters',
    needsUserInput: true,
  };
};

// ============================================================================
// Node 3: Extract Filters (agêntico com structured output)
// ============================================================================

export const extractFiltersNode = async (
  state: PipelineState,
  llmWithStructuredOutput: any,
): Promise<Partial<PipelineState>> => {
  const { messages, addressCount, validAddresses } = state;

  // Pegar a última mensagem do usuário
  const lastUserMessage = messages
    .slice()
    .reverse()
    .find((m) => m._getType() === 'human');

  if (!lastUserMessage) {
    console.log('[ExtractFilters] No user message found, waiting for input');
    return {
      needsUserInput: true,
      currentStep: 'extract_filters',
    };
  }

  // Se não houver endereços, tentar extrair da mensagem do usuário
  if (addressCount === 0) {
    const messageContent = String(lastUserMessage.content);
    const addressRegex = /0x[a-fA-F0-9]{40}/g;
    const extractedAddresses = messageContent.match(addressRegex) || [];

    if (extractedAddresses.length > 0) {
      console.log('[ExtractFilters] Found addresses in message:', extractedAddresses.length);

      // Validar e adicionar ao estado
      const validAddrs = Array.from(new Set(extractedAddresses.map(a => a.toLowerCase())));

      return {
        addresses: validAddrs,
        validAddresses: validAddrs,
        addressCount: validAddrs.length,
        currentStep: 'ask_filters',
        needsUserInput: false,
      };
    } else {
      console.log('[ExtractFilters] No addresses found in message');
      // Voltar para pedir endereços
      return {
        currentStep: 'ask_filters',
        needsUserInput: true,
      };
    }
  }

  const systemMsg = new SystemMessage(LANGGRAPH_SYSTEM_PROMPTS.EXTRACT_FILTERS_PROMPT);

  try {
    // Invocar LLM com structured output
    const response = await llmWithStructuredOutput.invoke([systemMsg, lastUserMessage]);

    // Com withStructuredOutput, o response já é o objeto extraído, não precisa JSON.parse
    const extracted: ExtractedFilters = response;

    console.log('[ExtractFilters] Extracted:', extracted);

    // Atualizar filtros no estado
    const filters: any = {};
    if (extracted.protocol) filters.protocol = extracted.protocol;
    if (extracted.stablecoins !== null) filters.stablecoins = extracted.stablecoins;
    if (extracted.minAccountAge) filters.minAccountAge = extracted.minAccountAge;
    if (extracted.startDate || extracted.endDate) {
      filters.period = {};
      if (extracted.startDate) filters.period.startDate = extracted.startDate;
      if (extracted.endDate) filters.period.endDate = extracted.endDate;
    }

    // Verificar se usuário quer fazer busca
    if (!extracted.userWantsToSearch) {
      // Usuário ainda está explorando, voltar para perguntar mais
      return {
        filters,
        filtersComplete: false,
        currentStep: 'ask_filters',
        needsUserInput: true,
      };
    }

    return {
      filters,
      filtersComplete: extracted.hasAllRequiredInfo,
      currentStep: extracted.hasAllRequiredInfo ? 'call_backend' : 'ask_filters',
      needsUserInput: !extracted.hasAllRequiredInfo,
    };
  } catch (error) {
    console.error('[ExtractFilters] Error:', error);
    return {
      currentStep: 'ask_filters',
      needsUserInput: true,
    };
  }
};

// ============================================================================
// Node 4: Call Backend (não-agêntico, executa tool)
// ============================================================================

export const callBackendNode = async (
  state: PipelineState,
  searchFunction: any,
): Promise<Partial<PipelineState>> => {
  const { validAddresses, filters } = state;

  console.log('[CallBackend] Executing search with filters:', filters);

  try {
    // Executar função de busca
    const backendResponse: BackendResponse = await searchFunction({
      addresses: validAddresses,
      protocol: filters.protocol,
      startDate: filters.period?.startDate,
      endDate: filters.period?.endDate,
      stablecoins: filters.stablecoins,
      minAccountAge: filters.minAccountAge,
    });

    console.log('[CallBackend] Backend response:', {
      success: backendResponse.success,
      analyzedWallets: backendResponse.data?.analyzedWallets,
    });

    return {
      backendResponse,
      currentStep: 'format_response',
      needsUserInput: false,
    };
  } catch (error) {
    console.error('[CallBackend] Error:', error);

    const errorResponse: BackendResponse = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };

    return {
      backendResponse: errorResponse,
      backendError: error instanceof Error ? error.message : String(error),
      currentStep: 'error',
      needsUserInput: false,
    };
  }
};

// ============================================================================
// Node 5: Format Response (agêntico com LLM)
// ============================================================================

export const formatResponseNode = async (
  state: PipelineState,
  llm: any,
): Promise<Partial<PipelineState>> => {
  const { backendResponse, filters, addressCount } = state;

  if (!backendResponse?.success) {
    const errorMessage = `❌ Erro ao buscar dados: ${backendResponse?.error || 'Erro desconhecido'}`;
    return {
      formattedReport: errorMessage,
      messages: [...state.messages, new AIMessage(errorMessage)],
      currentStep: 'completed',
      needsUserInput: false,
    };
  }

  // Criar prompt com contexto
  const contextPrompt = `
${LANGGRAPH_SYSTEM_PROMPTS.FORMAT_RESPONSE_PROMPT}

DADOS DA ANÁLISE:
- Total de wallets analisadas: ${addressCount}
- Filtros aplicados: ${JSON.stringify(filters, null, 2)}
- Resultados do backend: ${JSON.stringify(backendResponse.data, null, 2)}

Gere o relatório completo e detalhado.
  `.trim();

  const systemMsg = new SystemMessage(contextPrompt);

  try {
    const response = await llm.invoke([systemMsg]);

    const formattedReport = String(response.content);

    console.log('[FormatResponse] Report generated, length:', formattedReport.length);

    return {
      formattedReport,
      messages: [...state.messages, new AIMessage(formattedReport)],
      currentStep: 'completed',
      needsUserInput: false,
    };
  } catch (error) {
    console.error('[FormatResponse] Error:', error);

    const fallbackReport = `
📊 Análise concluída para ${addressCount} wallets.

Os dados foram processados com sucesso, mas ocorreu um erro na formatação do relatório.

Dados brutos: ${JSON.stringify(backendResponse.data?.summary, null, 2)}
    `.trim();

    return {
      formattedReport: fallbackReport,
      messages: [...state.messages, new AIMessage(fallbackReport)],
      currentStep: 'completed',
      needsUserInput: false,
    };
  }
};
