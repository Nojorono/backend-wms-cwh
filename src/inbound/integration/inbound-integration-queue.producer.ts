import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { computeInboundRetryDelayMs } from './inbound-integration-retry.helper';
import { INBOUND_INTEGRATION_RMQ } from './inbound-integration-rmq.config';
import { InboundJobPayload } from './inbound-integration-queue.types';

@Injectable()
export class InboundIntegrationQueueProducer {
  private readonly logger = new Logger(InboundIntegrationQueueProducer.name);
  static readonly ROUTING_KEY = INBOUND_INTEGRATION_RMQ.routingKey;

  constructor(
    @Inject('INBOUND_INTEGRATION_QUEUE_CLIENT')
    private readonly queueClient: ClientProxy,
  ) { }

  async publish(payload: InboundJobPayload): Promise<void> {
    await firstValueFrom(this.queueClient.emit<void>(InboundIntegrationQueueProducer.ROUTING_KEY, payload));
  }

  scheduleRetry(payload: InboundJobPayload): number {
    const delay = computeInboundRetryDelayMs(payload.retryCount);
    this.logger.log(
      `Scheduling retry inboundId=${payload.inboundId} requestId=${payload.requestId ?? 'N/A'} retryCount=${payload.retryCount} delayMs=${delay}`,
    );
    setTimeout(() => {
      this.queueClient.emit<void>(InboundIntegrationQueueProducer.ROUTING_KEY, {
        ...payload,
        retryCount: payload.retryCount + 1,
      });
    }, delay);
    return delay;
  }
}
