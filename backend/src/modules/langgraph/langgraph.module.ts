import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Services
import { OpenAIModelService } from './services/openai-model.service';
import { ConversationStateService } from './services/conversation-state.service';

// Agents
import { PipelineAgent } from './agents/pipeline.agent';

// Controllers
import { LangGraphController } from './langgraph.controller';

@Module({
  imports: [ConfigModule],
  controllers: [LangGraphController],
  providers: [
    // Core services
    OpenAIModelService,
    ConversationStateService,

    // Agents
    PipelineAgent,
  ],
  exports: [
    OpenAIModelService,
    ConversationStateService,
    PipelineAgent,
  ],
})
export class LangGraphModule {}

