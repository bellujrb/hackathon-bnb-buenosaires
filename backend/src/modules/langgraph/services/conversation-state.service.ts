import { Injectable } from '@nestjs/common';

interface ConversationState {
  state: any;
  lastUpdated: number;
}

@Injectable()
export class ConversationStateService {
  private states = new Map<string, ConversationState>();
  private readonly TTL = 30 * 60 * 1000; // 30 minutos

  /**
   * Salva o estado de uma conversa
   */
  saveState(userId: string, chatId: string, state: any): void {
    const key = this.getKey(userId, chatId);
    this.states.set(key, {
      state,
      lastUpdated: Date.now(),
    });

    // Limpar estados expirados
    this.cleanExpiredStates();
  }

  /**
   * Recupera o estado de uma conversa
   */
  getState(userId: string, chatId: string): any | null {
    const key = this.getKey(userId, chatId);
    const conversation = this.states.get(key);

    if (!conversation) {
      return null;
    }

    // Verificar se expirou
    if (Date.now() - conversation.lastUpdated > this.TTL) {
      this.states.delete(key);
      return null;
    }

    return conversation.state;
  }

  /**
   * Limpa o estado de uma conversa
   */
  clearState(userId: string, chatId: string): void {
    const key = this.getKey(userId, chatId);
    this.states.delete(key);
  }

  /**
   * Gera chave única para userId + chatId
   */
  private getKey(userId: string, chatId: string): string {
    return `${userId || 'anonymous'}:${chatId || 'default'}`;
  }

  /**
   * Remove estados expirados (cleanup)
   */
  private cleanExpiredStates(): void {
    const now = Date.now();
    for (const [key, conversation] of this.states.entries()) {
      if (now - conversation.lastUpdated > this.TTL) {
        this.states.delete(key);
      }
    }
  }
}
