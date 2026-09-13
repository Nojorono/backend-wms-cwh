import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { computeMoveOrderIntegrationRetryDelayMs } from './move-order-integration-retry.helper';
import { MOVE_ORDER_INTEGRATION_RMQ } from './move-order-integration-rmq.config';
import { MoveOrderIntegrationPollJobPayload } from './move-order-integration-queue.types';
import { MoveOrderIntegrationLogService } from './move-order-integration-log.service';

@Injectable()
export class MoveOrderIntegrationPollProducer {
  static readonly ROUTING_KEY = MOVE_ORDER_INTEGRATION_RMQ.routingKey;

  constructor(
    @Inject('MOVE_ORDER_INTEGRATION_QUEUE_CLIENT')
    private readonly queueClient: ClientProxy,
    private readonly integrationLog: MoveOrderIntegrationLogService,
  ) {}

  async publish(payload: MoveOrderIntegrationPollJobPayload): Promise<void> {
    await firstValueFrom(
      this.queueClient.emit<void>(MoveOrderIntegrationPollProducer.ROUTING_KEY, payload),
    );
    this.integrationLog.info('poll-queue', 'Poll job published', {
      move_order_integration_id: payload.moveOrderIntegrationId,
      source_header_id: payload.source_header_id,
      request_number: payload.request_number,
      retry_count: payload.retryCount,
    });
  }

  scheduleRetry(payload: MoveOrderIntegrationPollJobPayload): number {
    const delay = computeMoveOrderIntegrationRetryDelayMs(payload.retryCount);
    this.integrationLog.info('poll-queue', 'Poll retry scheduled', {
      move_order_integration_id: payload.moveOrderIntegrationId,
      source_header_id: payload.source_header_id,
      retry_count: payload.retryCount,
      delay_ms: delay,
    });
    setTimeout(() => {
      void firstValueFrom(
        this.queueClient.emit<void>(MoveOrderIntegrationPollProducer.ROUTING_KEY, {
          ...payload,
          retryCount: payload.retryCount + 1,
        }),
      ).catch((error: unknown) => {
        this.integrationLog.error('poll-queue', 'Failed to publish poll retry', {
          move_order_integration_id: payload.moveOrderIntegrationId,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }, delay);
    return delay;
  }
}
