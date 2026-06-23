import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { computeMoveOrderIntegrationRetryDelayMs } from './move-order-integration-retry.helper';
import { MOVE_ORDER_INTEGRATION_RMQ } from './move-order-integration-rmq.config';
import { MoveOrderIntegrationPollJobPayload } from './move-order-integration-queue.types';

@Injectable()
export class MoveOrderIntegrationPollProducer {
  private readonly logger = new Logger(MoveOrderIntegrationPollProducer.name);
  static readonly ROUTING_KEY = MOVE_ORDER_INTEGRATION_RMQ.routingKey;

  constructor(
    @Inject('MOVE_ORDER_INTEGRATION_QUEUE_CLIENT')
    private readonly queueClient: ClientProxy,
  ) {}

  async publish(payload: MoveOrderIntegrationPollJobPayload): Promise<void> {
    await firstValueFrom(
      this.queueClient.emit<void>(MoveOrderIntegrationPollProducer.ROUTING_KEY, payload),
    );
    this.logger.log(
      `Published move order poll job id=${payload.moveOrderIntegrationId} request_number=${payload.request_number} retryCount=${payload.retryCount}`,
    );
  }

  scheduleRetry(payload: MoveOrderIntegrationPollJobPayload): number {
    const delay = computeMoveOrderIntegrationRetryDelayMs(payload.retryCount);
    this.logger.log(
      `Scheduling move order poll retry id=${payload.moveOrderIntegrationId} retryCount=${payload.retryCount} delayMs=${delay}`,
    );
    setTimeout(() => {
      this.queueClient.emit<void>(MoveOrderIntegrationPollProducer.ROUTING_KEY, {
        ...payload,
        retryCount: payload.retryCount + 1,
      });
    }, delay);
    return delay;
  }
}
