// ============================================================================
// Tipos de Agentes (simplificado - apenas um agente)
// ============================================================================

export type AgentType = 'general';

// ============================================================================
// Contexto e Estado dos Agentes
// ============================================================================

export interface AgentContext {
  userId?: string;
  chatId?: string;
  conversationHistory?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp?: Date;
  }>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingFields: string[];
  invalidFields: string[];
}

export interface AgentMetric {
  agentType: AgentType;
  operation: string;
  executionTime: number;
  tokensUsed: number;
  toolsCalled: number;
  validationPassed: boolean;
  timestamp: Date;
}

export interface AgentResponse {
  success: boolean;
  agentType: AgentType;
  response: string;
  requiresConfirmation?: boolean;
  confirmationData?: any;
  metrics: AgentMetric[];
  error?: string;
  suggestions?: string[];
}


export interface SystemResponse {
  response: string;
  metrics: AgentMetric[];
  requiresConfirmation?: boolean;
  confirmationData?: any;
}

