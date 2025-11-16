import { Injectable } from '@nestjs/common';
import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
const { HumanMessage } = require('@langchain/core/messages');
import type { BaseMessage } from '@langchain/core/dist/messages';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

import { OpenAIModelService } from '../services/openai-model.service';
import { CustomLoggerService } from '../../../core/logger';
import { PipelineState } from '../types/pipeline.types';
import { searchWalletData } from '../tools/wallet-search.tool';
import {
  validateAddressesNode,
  askFiltersNode,
  extractFiltersNode,
  callBackendNode,
  formatResponseNode,
} from '../nodes/pipeline.nodes';

// ============================================================================
// State Annotation para LangGraph
// ============================================================================

const PipelineStateAnnotation = Annotation.Root({
  addresses: Annotation<string[]>,
  addressCount: Annotation<number>,
  validAddresses: Annotation<string[]>,
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => {
      // Concatenar novas mensagens e manter apenas as últimas 30 para preservar contexto adequado
      const combined = current.concat(update);
      return combined.slice(-30);
    },
    default: () => [],
  }),
  filters: Annotation<any>({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({}),
  }),
  filtersComplete: Annotation<boolean>,
  missingFilters: Annotation<string[]>,
  backendResponse: Annotation<any>,
  backendError: Annotation<string>,
  formattedReport: Annotation<string>,
  currentStep: Annotation<string>,
  needsUserInput: Annotation<boolean>,
  retryCount: Annotation<number>,
  maxRetries: Annotation<number>,
});

// ============================================================================
// Pipeline Agent
// ============================================================================

@Injectable()
export class PipelineAgent {
  private readonly logger = new CustomLoggerService(PipelineAgent.name);
  private workflow: any;
  private llm: ChatOpenAI;
  private llmWithStructuredOutput: ChatOpenAI;

  constructor(private readonly openAIService: OpenAIModelService) {
    this.llm = this.openAIService.getGPT4oMini();
    this.llm.temperature = 0.7;

    // LLM com structured output para extrair filtros
    this.llmWithStructuredOutput = this.openAIService.getGPT4oMini();
    this.llmWithStructuredOutput.temperature = 0;

    this.initializeWorkflow();
  }

  /**
   * Inicializa o workflow LangGraph
   */
  private initializeWorkflow() {
    this.logger.log('Initializing Pipeline workflow...');

    // Definir schema para structured output
    const filtersSchema = z.object({
      protocol: z.string().nullable().optional(),
      startDate: z.string().nullable().optional(),
      endDate: z.string().nullable().optional(),
      stablecoins: z.boolean().nullable().optional(),
      minAccountAge: z.number().nullable().optional(),
      hasAllRequiredInfo: z.boolean(),
      userWantsToSearch: z.boolean(),
    });

    // Bind structured output ao LLM
    this.llmWithStructuredOutput = this.llmWithStructuredOutput.withStructuredOutput(filtersSchema);

    // Criar workflow
    const workflow = new StateGraph(PipelineStateAnnotation)
      // Adicionar nodes
      .addNode('validate', validateAddressesNode)
      .addNode('ask_filters', (state: PipelineState) => askFiltersNode(state, this.llm))
      .addNode('extract_filters', (state: PipelineState) =>
        extractFiltersNode(state, this.llmWithStructuredOutput),
      )
      .addNode('call_backend', (state: PipelineState) => callBackendNode(state, searchWalletData))
      .addNode('format_response', (state: PipelineState) => formatResponseNode(state, this.llm))

      // Definir edges
      // Conditional START: se currentStep === 'extract_filters', pula direto para lá
      .addConditionalEdges(START, (state: PipelineState) => {
        if (state.currentStep === 'extract_filters') {
          return 'extract_filters';
        }
        return 'validate';
      })
      .addEdge('validate', 'ask_filters')

      // ask_filters termina o workflow para esperar input do usuário
      .addConditionalEdges('ask_filters', (state: PipelineState) => {
        // Se precisa de input do usuário, termina o workflow aqui
        if (state.needsUserInput) {
          return END;
        }
        return 'extract_filters';
      })

      // Conditional edge após extract_filters
      .addConditionalEdges('extract_filters', (state: PipelineState) => {
        if (state.currentStep === 'call_backend') {
          return 'call_backend';
        }
        return END; // Termina para esperar mais input ao invés de fazer loop
      })

      .addEdge('call_backend', 'format_response')
      .addEdge('format_response', END);

    this.workflow = workflow.compile();
    this.logger.log('Pipeline workflow initialized successfully');
  }

  /**
   * Analisa wallets com o pipeline
   */
  async analyze(
    addresses: string[],
    initialMessage?: string,
  ): Promise<any> {
    this.logger.log(`Starting analysis for ${addresses.length} addresses`);

    const initialState: Partial<PipelineState> = {
      addresses,
      addressCount: addresses.length,
      validAddresses: [],
      messages: initialMessage ? [new HumanMessage(initialMessage)] : [],
      filters: {},
      filtersComplete: false,
      currentStep: 'validate',
      needsUserInput: false,
      retryCount: 0,
      maxRetries: 3,
    };

    try {
      const result = await this.workflow.invoke(initialState);

      this.logger.log(`Analysis completed at step: ${result.currentStep}, has report: ${!!result.formattedReport}`);

      return {
        success: result.currentStep === 'completed',
        report: result.formattedReport,
        backendResponse: result.backendResponse,
        filters: result.filters,
        addressCount: result.addressCount,
        messages: result.messages,
      };
    } catch (error) {
      this.logger.error('Error in analysis pipeline:', error);
      throw error;
    }
  }

  /**
   * Continua uma análise existente com nova mensagem do usuário
   */
  async continueAnalysis(
    currentState: Partial<PipelineState>,
    userMessage: string,
  ): Promise<any> {
    this.logger.log('Continuing analysis with user message');

    const updatedState: Partial<PipelineState> = {
      ...currentState,
      messages: [...(currentState.messages || []), new HumanMessage(userMessage)],
      // Define currentStep para extract_filters para pular validate e ask_filters
      currentStep: 'extract_filters',
      needsUserInput: false,
    };

    try {
      const result = await this.workflow.invoke(updatedState);

      return {
        success: result.currentStep === 'completed',
        report: result.formattedReport,
        backendResponse: result.backendResponse,
        filters: result.filters,
        needsUserInput: result.needsUserInput,
        currentStep: result.currentStep,
        messages: result.messages,
      };
    } catch (error) {
      this.logger.error('Error continuing analysis:', error);
      throw error;
    }
  }

  /**
   * Análise com streaming
   */
  async analyzeStreaming(
    addresses: string[],
    initialMessage: string | undefined,
    onToken: (token: string) => void,
  ): Promise<any> {
    this.logger.log(`Starting streaming analysis for ${addresses.length} addresses`);

    const initialState: Partial<PipelineState> = {
      addresses,
      addressCount: addresses.length,
      validAddresses: [],
      messages: initialMessage ? [new HumanMessage(initialMessage)] : [],
      filters: {},
      filtersComplete: false,
      currentStep: 'validate',
      needsUserInput: false,
      retryCount: 0,
      maxRetries: 3,
    };

    try {
      const stream = await this.workflow.stream(initialState, {
        streamMode: 'values',
      });

      let finalState: any = null;
      let lastMessageCount = 0;

      for await (const chunk of stream) {
        console.log('[Streaming] Chunk received:', {
          currentStep: chunk.currentStep,
          messageCount: chunk.messages?.length,
          lastMessageCount,
          hasReport: !!chunk.formattedReport,
        });

        finalState = chunk;

        // Enviar apenas mensagens novas (não duplicar)
        if (chunk.messages && chunk.messages.length > lastMessageCount) {
          // Pegar apenas as mensagens novas desde a última iteração
          const newMessages = chunk.messages.slice(lastMessageCount);

          console.log('[Streaming] Sending', newMessages.length, 'new messages');

          for (const msg of newMessages) {
            if (msg._getType() === 'ai' && msg.content) {
              console.log('[Streaming] Sending AI message, length:', String(msg.content).length);
              onToken(String(msg.content));
            }
          }

          lastMessageCount = chunk.messages.length;
        }

        // Enviar report final se disponível (apenas uma vez)
        if (chunk.formattedReport && finalState?.formattedReport !== chunk.formattedReport) {
          console.log('[Streaming] Sending final report');
          onToken('\n\n' + chunk.formattedReport);
        }
      }

      return {
        success: finalState?.currentStep === 'completed',
        report: finalState?.formattedReport,
        backendResponse: finalState?.backendResponse,
        filters: finalState?.filters,
        addressCount: finalState?.addressCount,
      };
    } catch (error) {
      this.logger.error('Error in streaming analysis:', error);
      throw error;
    }
  }

  /**
   * Verifica se o agente está disponível
   */
  isAvailable(): boolean {
    return this.workflow !== null;
  }

  /**
   * Obtém informações do agente
   */
  getInfo() {
    return {
      type: 'pipeline',
      description: 'Pipeline conversacional para análise de wallets BNB Chain',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      enabled: true,
      nodes: ['validate', 'ask_filters', 'extract_filters', 'call_backend', 'format_response'],
      tools: ['search_wallet_data'],
    };
  }
}
