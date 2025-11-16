import { Controller, Post, Body, Get, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PipelineAgent } from './agents/pipeline.agent';
import { Response } from 'express';

class MessageDto {
  message: string;
  addresses?: string[];
  currentState?: any; // Estado anterior para continuar conversa
}

class AnalyzeWalletsDto {
  addresses: string[];
  message?: string;
}

@ApiTags('langgraph')
@Controller('langgraph')
export class LangGraphController {
  constructor(
    private readonly pipelineAgent: PipelineAgent,
  ) {}

  @Post('message')
  @ApiOperation({ summary: 'Envia uma mensagem para o agente com pipeline' })
  @ApiResponse({ status: 200, description: 'Resposta do agente retornada com sucesso' })
  async sendMessage(@Body() body: MessageDto) {
    // Se tiver currentState, continua a conversa existente
    if (body.currentState) {
      const result = await this.pipelineAgent.continueAnalysis(body.currentState, body.message);
      return {
        ...result,
        currentState: result,
      };
    }

    // Nova conversa
    const addresses = body.addresses || [];
    const result = await this.pipelineAgent.analyze(addresses, body.message);

    return {
      ...result,
      currentState: result,
    };
  }

  @Post('message/stream')
  @ApiOperation({ summary: 'Streaming de resposta do agente com pipeline (SSE)' })
  @ApiResponse({ status: 200, description: 'Stream iniciado' })
  async streamMessage(@Body() body: MessageDto, @Res() res: Response) {
    try {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      const onToken = (token: string) => {
        res.write(`data: ${JSON.stringify({ text: token })}\n\n`);
      };

      let result;

      if (body.currentState) {
        // Continua conversa existente
        result = await this.pipelineAgent.continueAnalysis(body.currentState, body.message);
        // Enviar o resultado de uma vez
        if (result.report) {
          onToken(result.report);
        } else {
          // Enviar última mensagem do agente
          const lastAiMsg = result.messages?.slice().reverse().find((m: any) => m._getType?.() === 'ai');
          if (lastAiMsg) {
            onToken(String(lastAiMsg.content));
          }
        }
      } else {
        // Nova conversa
        const addresses = body.addresses || [];
        result = await this.pipelineAgent.analyzeStreaming(
          addresses,
          body.message,
          onToken,
        );
      }

      res.write(`event: done\n`);
      res.write(`data: ${JSON.stringify({ ...result, currentState: result })}\n\n`);
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

  @Post('analyze-wallets')
  @ApiOperation({ summary: 'Analisa wallets com pipeline conversacional' })
  @ApiResponse({ status: 200, description: 'Análise iniciada com sucesso' })
  async analyzeWallets(@Body() body: AnalyzeWalletsDto) {
    if (!body.addresses || body.addresses.length === 0) {
      return {
        success: false,
        error: 'Nenhum endereço fornecido',
      };
    }

    const result = await this.pipelineAgent.analyze(body.addresses, body.message);

    return result;
  }

  @Post('analyze-wallets/stream')
  @ApiOperation({ summary: 'Analisa wallets com streaming (SSE)' })
  @ApiResponse({ status: 200, description: 'Stream iniciado' })
  async analyzeWalletsStream(@Body() body: AnalyzeWalletsDto, @Res() res: Response) {
    try {
      if (!body.addresses || body.addresses.length === 0) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Nenhum endereço fornecido',
        });
        return;
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      const onToken = (token: string) => {
        res.write(`data: ${JSON.stringify({ text: token })}\n\n`);
      };

      const result = await this.pipelineAgent.analyzeStreaming(
        body.addresses,
        body.message,
        onToken,
      );

      res.write(`event: done\n`);
      res.write(`data: ${JSON.stringify(result)}\n\n`);
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
      agent: this.pipelineAgent.getInfo(),
      available: this.pipelineAgent.isAvailable(),
    };
  }
}

