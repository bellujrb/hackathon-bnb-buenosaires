import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { CustomLoggerService } from '../../../core/logger';
import { OpenAIModelService } from '../services/openai-model.service';
import { LANGGRAPH_SYSTEM_PROMPTS, LANGGRAPH_AI_MODELS } from '../constants/langgraph.constants';
import { AgentContext, AgentResponse, AgentMetric, AgentType } from '../types/multi-agent.types';

@Injectable()
export class GeneralAgent {
  private readonly logger = new CustomLoggerService(GeneralAgent.name);
  private readonly llm: ChatOpenAI;

  constructor(private readonly openAIService: OpenAIModelService) {
    this.llm = this.openAIService.createLLM(LANGGRAPH_AI_MODELS.CONTEXT_GENERATION);
    this.llm.temperature = 0.7;
  }

  /**
   * Processa uma mensagem e retorna a resposta do OpenAI
   */
  async process(input: string, context: AgentContext): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      // Validação básica
      if (!input || input.trim().length < 1) {
        return {
          success: false,
          agentType: 'general' as AgentType,
          response: 'Entrada vazia. Forneça uma mensagem.',
          metrics: [this.createMetric('validation_error', 0)],
          error: 'Entrada vazia',
        };
      }

      // Monta as mensagens
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        {
          role: 'system',
          content: LANGGRAPH_SYSTEM_PROMPTS.BASE_IDENTITY,
        },
      ];

      // Adiciona histórico de conversa se houver
      if (context.conversationHistory && context.conversationHistory.length > 0) {
        const recentHistory = context.conversationHistory.slice(-10);
        messages.push(...recentHistory);
      }

      // Adiciona mensagem do usuário
      messages.push({
        role: 'user',
        content: input,
      });

      // Invoca o modelo OpenAI
      const llmResponse = await this.llm.invoke(messages);

      const executionTime = Date.now() - startTime;

      this.logger.log(`Processed message in ${executionTime}ms`);

      return {
        success: true,
        agentType: 'general' as AgentType,
        response: String(llmResponse.content),
        metrics: [this.createMetric('message_processing', executionTime)],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error processing message:', errorMessage);
      return {
        success: false,
        agentType: 'general' as AgentType,
        response: `Erro no processamento: ${errorMessage}`,
        metrics: [this.createMetric('error', Date.now() - startTime)],
        error: errorMessage,
      };
    }
  }

  /**
   * Processamento com streaming de texto (token/char por token/char)
   * onToken é chamado conforme o modelo gera saída
   */
  async processStreaming(
    input: string,
    context: AgentContext,
    onToken: (token: string) => void,
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    try {
      if (!input || input.trim().length < 1) {
        const resp: AgentResponse = {
          success: false,
          agentType: 'general' as AgentType,
          response: 'Entrada vazia. Forneça uma mensagem.',
          metrics: [this.createMetric('validation_error', 0)],
          error: 'Entrada vazia',
        };
        return resp;
      }

      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: LANGGRAPH_SYSTEM_PROMPTS.BASE_IDENTITY },
      ];

      if (context.conversationHistory && context.conversationHistory.length > 0) {
        const recentHistory = context.conversationHistory.slice(-10);
        messages.push(...recentHistory);
      }

      messages.push({ role: 'user', content: input });

      // Streaming via LangChain
      // Observação: versões recentes retornam AIMessageChunk com content acumulável
      // Fallback: se stream não disponível, faz invoke e envia por caracteres
      try {
        const stream = await (this.llm as any).stream(messages);
        let finalText = '';
        for await (const chunk of stream) {
          const piece = typeof chunk?.content === 'string' ? chunk.content : String(chunk?.content ?? '');
          if (piece) {
            finalText += piece;
            onToken(piece);
          }
        }
        const executionTime = Date.now() - startTime;
        return {
          success: true,
          agentType: 'general' as AgentType,
          response: finalText,
          metrics: [this.createMetric('message_processing_stream', executionTime)],
        };
      } catch {
        // Fallback: sem stream nativo, gera resposta completa e envia letra a letra
        const llmResponse = await this.llm.invoke(messages);
        const full = String(llmResponse.content ?? '');
        for (const ch of full) {
          onToken(ch);
          await new Promise((r) => setTimeout(r, 2));
        }
        const executionTime = Date.now() - startTime;
        return {
          success: true,
          agentType: 'general' as AgentType,
          response: full,
          metrics: [this.createMetric('message_processing_stream_fallback', executionTime)],
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error processing message (stream):', errorMessage);
      return {
        success: false,
        agentType: 'general' as AgentType,
        response: `Erro no processamento: ${errorMessage}`,
        metrics: [this.createMetric('error_stream', Date.now() - startTime)],
        error: errorMessage,
      };
    }
  }

  /**
   * Cria métrica de execução
   */
  private createMetric(operation: string, executionTime: number): AgentMetric {
    return {
      agentType: 'general' as AgentType,
      operation,
      executionTime,
      tokensUsed: 0,
      toolsCalled: 0,
      validationPassed: true,
      timestamp: new Date(),
    };
  }

  /**
   * Verifica se o agente está disponível
   */
  isAvailable(): boolean {
    return true;
  }

  /**
   * Obtém informações do agente
   */
  getInfo() {
    return {
      type: 'general',
      model: LANGGRAPH_AI_MODELS.CONTEXT_GENERATION,
      temperature: 0.7,
      enabled: true,
    };
  }
}
