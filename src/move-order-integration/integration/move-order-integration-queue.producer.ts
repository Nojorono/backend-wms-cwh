import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  getMoveOrderIntegrationQueueKey,
  getMoveOrderIntegrationRedisOptions,
} from './move-order-integration-redis.config';
import { MoveOrderIntegrationInsertJobPayload } from './move-order-integration-queue.types';

@Injectable()
export class MoveOrderIntegrationQueueProducer implements OnModuleDestroy {
  private readonly logger = new Logger(MoveOrderIntegrationQueueProducer.name);
  private readonly redis: Redis;
  private readonly queueKey: string;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis(getMoveOrderIntegrationRedisOptions(configService));
    this.queueKey = getMoveOrderIntegrationQueueKey(configService);
  }

  /** Enqueue Oracle insert job (create_with_lines). Polling is not queued — handled via RMQ in worker. */
  async publishInsert(payload: MoveOrderIntegrationInsertJobPayload): Promise<void> {
    await this.redis.lpush(this.queueKey, JSON.stringify(payload));
    this.logger.log(
      `Queued move order insert job id=${payload.moveOrderIntegrationId} request_number=${payload.request_number}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit().catch(() => undefined);
  }
}
