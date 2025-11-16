import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { CustomLoggerService } from '../../../core/logger';

@Injectable()
export class OpenAIModelService {
  private readonly logger = new CustomLoggerService(OpenAIModelService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Create a ChatOpenAI instance with a specific model
   */
  createLLM(model: string = 'gpt-4o'): ChatOpenAI {
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!openaiApiKey) {
      this.logger.warn('OPENAI_API_KEY not found in environment variables');
    }

    // LangSmith configuration via environment variables (optional)
    const langsmithConfig = {
      tracingV2: this.configService.get<string>('LANGCHAIN_TRACING_V2') === 'true',
      endpoint: this.configService.get<string>('LANGCHAIN_ENDPOINT'),
      apiKey: this.configService.get<string>('LANGCHAIN_API_KEY'),
      project: this.configService.get<string>('LANGCHAIN_PROJECT'),
    };

    if (langsmithConfig.tracingV2 && langsmithConfig.apiKey) {
      this.logger.log('LangSmith tracing enabled');

      // Set LangSmith environment variables for automatic tracing
      process.env.LANGCHAIN_TRACING_V2 = 'true';
      process.env.LANGCHAIN_ENDPOINT = langsmithConfig.endpoint || 'https://api.smith.langchain.com';
      process.env.LANGCHAIN_API_KEY = langsmithConfig.apiKey;
      process.env.LANGCHAIN_PROJECT = langsmithConfig.project || 'langgraph-backend';
    }

    return new ChatOpenAI({
      model,
      apiKey: openaiApiKey || '<your_openai_key>',
      temperature: 0.7,
      maxTokens: 4000,
    });
  }

  /**
   * Get GPT-4o model
   */
  getGPT4o(): ChatOpenAI {
    return this.createLLM('gpt-4o');
  }

  /**
   * Get GPT-4 Turbo model
   */
  getGPT4Turbo(): ChatOpenAI {
    return this.createLLM('gpt-4-turbo');
  }

  /**
   * Get GPT-3.5 Turbo model
   */
  getGPT35Turbo(): ChatOpenAI {
    return this.createLLM('gpt-3.5-turbo');
  }

  /**
   * Get GPT-4o Mini model (faster and cheaper)
   */
  getGPT4oMini(): ChatOpenAI {
    return this.createLLM('gpt-4o-mini');
  }

  /**
   * Get available OpenAI models
   */
  getAvailableModels(): string[] {
    return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
  }
}

