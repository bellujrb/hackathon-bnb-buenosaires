import type { BaseMessage } from '@langchain/core/dist/messages';

// ============================================================================
// Search Filters - Filtros de busca para wallets
// ============================================================================

export interface SearchFilters {
  /** Protocol específico (ex: 'pancakeswap', 'venus', 'biswap') */
  protocol?: string;

  /** Período de busca */
  period?: {
    startDate?: string; // ISO 8601 format
    endDate?: string; // ISO 8601 format
  };

  /** Filtrar apenas transações com stablecoins */
  stablecoins?: boolean;

  /** Idade mínima da conta em meses */
  minAccountAge?: number;
}

// ============================================================================
// Backend Response - Resposta do backend de busca
// ============================================================================

export interface BackendResponse {
  success: boolean;
  data?: {
    totalWallets: number;
    analyzedWallets: number;
    results: WalletAnalysisResult[];
    summary?: {
      averageScore?: number;
      eligibleWallets?: number;
      totalTransactions?: number;
    };
  };
  error?: string;
  message?: string;
}

export interface WalletAnalysisResult {
  address: string;
  score?: number;
  transactions?: number;
  protocols?: string[];
  accountAge?: number; // em dias
  hasStablecoins?: boolean;
  lastActivity?: string; // ISO 8601
  eligible?: boolean;
  tags?: string[];
}

// ============================================================================
// Pipeline State - Estado do pipeline LangGraph
// ============================================================================

export type PipelineStep =
  | 'validate'
  | 'ask_filters'
  | 'extract_filters'
  | 'validate_filters'
  | 'call_backend'
  | 'format_response'
  | 'completed'
  | 'error';

export interface PipelineState {
  // Input - Endereços fornecidos
  addresses: string[];
  addressCount: number;
  validAddresses: string[];

  // Conversação
  messages: BaseMessage[];

  // Filtros de busca
  filters: SearchFilters;
  filtersComplete: boolean;
  missingFilters: string[];

  // Backend integration
  backendResponse?: BackendResponse;
  backendError?: string;

  // Output
  formattedReport?: string;

  // Controle de fluxo
  currentStep: PipelineStep;
  needsUserInput: boolean;
  retryCount: number;
  maxRetries: number;

  // Context adicional
  userId?: string;
  chatId?: string;
}

// ============================================================================
// Configurações do Pipeline
// ============================================================================

export interface PipelineConfig {
  backendUrl: string;
  backendTimeout?: number;
  maxRetries?: number;
  streamingEnabled?: boolean;
}

// ============================================================================
// Structured Output para extração de filtros
// ============================================================================

export interface ExtractedFilters {
  protocol?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  stablecoins?: boolean | null;
  minAccountAge?: number | null;
  hasAllRequiredInfo: boolean;
  userWantsToSearch: boolean;
}
