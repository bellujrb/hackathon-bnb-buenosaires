import { Controller, Post, Body, Get, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GeneralAgent } from './agents/general.agent';
import { AgentContext } from './types';
import { Response } from 'express';

class MessageDto {
  message: string;
  userId?: string;
  chatId?: string;
  conversationHistory?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp?: Date;
  }>;
}

@ApiTags('langgraph')
@Controller('langgraph')
export class LangGraphController {
  constructor(private readonly generalAgent: GeneralAgent) {}

  @Post('message')
  @ApiOperation({ summary: 'Envia uma mensagem para o agente e retorna a resposta' })
  @ApiResponse({ status: 200, description: 'Resposta do agente retornada com sucesso' })
  async sendMessage(@Body() body: MessageDto) {
    const context: AgentContext = {
      userId: body.userId,
      chatId: body.chatId,
      conversationHistory: body.conversationHistory,
    };

    const response = await this.generalAgent.process(body.message, context);

    return {
      success: response.success,
      message: response.response,
      metrics: response.metrics,
      error: response.error,
    };
  }

  @Post('message/stream')
  @ApiOperation({ summary: 'Streaming de resposta do agente (SSE)' })
  @ApiResponse({ status: 200, description: 'Stream iniciado' })
  async streamMessage(@Body() body: MessageDto, @Res() res: Response) {
    try {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      const context: AgentContext = {
        userId: body.userId,
        chatId: body.chatId,
        conversationHistory: body.conversationHistory,
      };

      const onToken = (token: string) => {
        res.write(`data: ${JSON.stringify({ text: token })}\n\n`);
      };

      const final = await this.generalAgent.processStreaming(body.message, context, onToken);

      res.write(`event: done\n`);
      res.write(`data: ${JSON.stringify({ success: final.success, metrics: final.metrics })}\n\n`);
      res.end();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!res.headersSent) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, error: message });
      } else {
        res.write(`event: error\n`);
        res.write(`data: ${JSON.stringify({ message })}\n\n`);
        res.end();
      }
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Verifica a saúde do módulo LangGraph' })
  @ApiResponse({ status: 200, description: 'Módulo está funcionando' })
  async healthCheck() {
    return {
      status: 'ok',
      agent: this.generalAgent.getInfo(),
      available: this.generalAgent.isAvailable(),
    };
  }
}

