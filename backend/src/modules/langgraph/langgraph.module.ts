import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Services
import { OpenAIModelService } from './services/openai-model.service';

// Agents
import { GeneralAgent } from './agents/general.agent';

// Controllers
import { LangGraphController } from './langgraph.controller';

@Module({
  imports: [ConfigModule],
  controllers: [LangGraphController],
  providers: [
    // Core services
    OpenAIModelService,

    // Agents
    GeneralAgent,
  ],
  exports: [
    OpenAIModelService,
    GeneralAgent,
  ],
})
export class LangGraphModule {}

