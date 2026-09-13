import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  getMoveOrderIntegrationQueueKey,
  getMoveOrderIntegrationRedisOptions,
} from './move-order-integration-redis.config';
import { MoveOrderIntegrationInsertJobPayload } from './move-order-integration-queue.types';
import { MoveOrderIntegrationLogService } from './move-order-integration-log.service';

@Injectable()
export class MoveOrderIntegrationQueueProducer implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly queueKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly integrationLog: MoveOrderIntegrationLogService,
  ) {
    this.redis = new Redis(getMoveOrderIntegrationRedisOptions(configService));
    this.queueKey = getMoveOrderIntegrationQueueKey(configService);
  }

  /** Enqueue Oracle insert job (create_with_lines). Polling is not queued — handled via RMQ in worker. */
  async publishInsert(payload: MoveOrderIntegrationInsertJobPayload): Promise<void> {
    await this.redis.lpush(this.queueKey, JSON.stringify(payload));
    this.integrationLog.info('queue', 'Insert job queued', {
      move_order_integration_id: payload.moveOrderIntegrationId,
      request_number: payload.request_number,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit().catch(() => undefined);
  }
}
