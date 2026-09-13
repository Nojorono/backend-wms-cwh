import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { MoveOrderIntegrationQueueConsumer } from './move-order-integration-queue.consumer';
import {
  getMoveOrderIntegrationQueueKey,
  getMoveOrderIntegrationRedisOptions,
} from './move-order-integration-redis.config';
import { MoveOrderIntegrationInsertJobPayload } from './move-order-integration-queue.types';

@Injectable()
export class MoveOrderIntegrationQueueWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MoveOrderIntegrationQueueWorker.name);
  private redis: Redis | null = null;
  private running = false;
  private readonly queueKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly consumer: MoveOrderIntegrationQueueConsumer,
  ) {
    this.queueKey = getMoveOrderIntegrationQueueKey(configService);
  }

  async onModuleInit(): Promise<void> {
    this.redis = new Redis(getMoveOrderIntegrationRedisOptions(this.configService));
    this.running = true;
    void this.pollLoop();
    this.logger.log(`Move order insert Redis worker started queue=${this.queueKey}`);
  }

  async onModuleDestroy(): Promise<void> {
    this.running = false;
    await this.redis?.quit().catch(() => undefined);
    this.redis = null;
  }

  private async pollLoop(): Promise<void> {
    while (this.running && this.redis) {
      try {
        const result = await this.redis.brpop(this.queueKey, 5);
        if (!result) {
          continue;
        }

        const [, rawPayload] = result;
        const payload = this.parsePayload(rawPayload);
        if (!payload) {
          this.logger.warn('Move order insert worker ignored invalid payload');
          continue;
        }

        await this.consumer.handleInsertJob(payload);
      } catch (error) {
        this.logger.error(
          `Move order insert worker failed: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  private parsePayload(raw: string): MoveOrderIntegrationInsertJobPayload | null {
    try {
      const parsed = JSON.parse(raw) as Partial<MoveOrderIntegrationInsertJobPayload>;
      if (
        typeof parsed.moveOrderIntegrationId !== 'string' ||
        parsed.moveOrderIntegrationId.trim() === ''
      ) {
        return null;
      }

      return {
        moveOrderIntegrationId: parsed.moveOrderIntegrationId,
        request_number: parsed.request_number ?? '',
        source_system: parsed.source_system,
        userId: parsed.userId,
        userName: parsed.userName,
      };
    } catch {
      return null;
    }
  }
}
