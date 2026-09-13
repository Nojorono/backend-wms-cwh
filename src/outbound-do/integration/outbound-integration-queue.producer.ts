import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { computeOutboundRetryDelayMs } from './outbound-integration-retry.helper';
import { OUTBOUND_INTEGRATION_RMQ } from './outbound-integration-rmq.config';
import { OutboundJobPayload } from './outbound-integration-queue.types';

@Injectable()
export class OutboundIntegrationQueueProducer {
  private readonly logger = new Logger(OutboundIntegrationQueueProducer.name);
  static readonly ROUTING_KEY = OUTBOUND_INTEGRATION_RMQ.routingKey;

  constructor(
    @Inject('OUTBOUND_INTEGRATION_QUEUE_CLIENT')
    private readonly queueClient: ClientProxy,
  ) {}

  async publish(payload: OutboundJobPayload): Promise<void> {
    await firstValueFrom(
      this.queueClient.emit<void>(OutboundIntegrationQueueProducer.ROUTING_KEY, payload),
    );
  }

  scheduleRetry(payload: OutboundJobPayload): number {
    const delay = computeOutboundRetryDelayMs(payload.retryCount);
    this.logger.log(
      `Scheduling retry outboundDoId=${payload.outboundDoId} retryCount=${payload.retryCount} delayMs=${delay}`,
    );
    setTimeout(() => {
      this.queueClient.emit<void>(OutboundIntegrationQueueProducer.ROUTING_KEY, {
        ...payload,
        retryCount: payload.retryCount + 1,
      });
    }, delay);
    return delay;
  }
}
