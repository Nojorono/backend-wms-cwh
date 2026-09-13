import { Injectable, Logger } from '@nestjs/common';
import { ScheduledTaskCallbackHandler } from './interfaces/scheduled-task-callback.handler.interface';

@Injectable()
export class ScheduledTaskCallbackRegistry {
  private readonly logger = new Logger(ScheduledTaskCallbackRegistry.name);
  private readonly handlers = new Map<string, ScheduledTaskCallbackHandler>();

  register(handler: ScheduledTaskCallbackHandler): void {
    if (this.handlers.has(handler.callbackType)) {
      this.logger.warn(`Replacing scheduled task handler for "${handler.callbackType}"`);
    }
    this.handlers.set(handler.callbackType, handler);
    this.logger.log(`Registered scheduled task handler "${handler.callbackType}"`);
  }

  get(callbackType: string): ScheduledTaskCallbackHandler | undefined {
    return this.handlers.get(callbackType);
  }

  getCallbackTypes(): string[] {
    return [...this.handlers.keys()];
  }

  has(callbackType: string): boolean {
    return this.handlers.has(callbackType);
  }
}
