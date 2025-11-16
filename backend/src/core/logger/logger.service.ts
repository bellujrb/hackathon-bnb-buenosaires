import { Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class CustomLoggerService implements LoggerService {
  private context?: string;

  constructor(context?: string) {
    if (context) {
      this.context = context;
    }
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, context?: string) {
    const ctx = context || this.context || 'Application';
    console.log(`[${ctx}] ${message}`);
  }

  error(message: any, trace?: string, context?: string) {
    const ctx = context || this.context || 'Application';
    console.error(`[${ctx}] ERROR: ${message}`, trace || '');
  }

  warn(message: any, context?: string) {
    const ctx = context || this.context || 'Application';
    console.warn(`[${ctx}] WARN: ${message}`);
  }

  debug(message: any, context?: string) {
    const ctx = context || this.context || 'Application';
    console.debug(`[${ctx}] DEBUG: ${message}`);
  }

  verbose(message: any, context?: string) {
    const ctx = context || this.context || 'Application';
    console.log(`[${ctx}] VERBOSE: ${message}`);
  }
}

