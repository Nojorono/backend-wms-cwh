import { Injectable, Logger } from '@nestjs/common';
import { MoveOrderIntegrationPollService } from './move-order-integration-poll.service';
import { MoveOrderIntegrationPollJobPayload } from './move-order-integration-queue.types';

@Injectable()
export class MoveOrderIntegrationPollConsumer {
  private readonly logger = new Logger(MoveOrderIntegrationPollConsumer.name);

  constructor(private readonly pollService: MoveOrderIntegrationPollService) {}

  async handlePollProcess(data: MoveOrderIntegrationPollJobPayload): Promise<void> {
    if (!data?.moveOrderIntegrationId) {
      this.logger.error('Move order poll payload is invalid: missing moveOrderIntegrationId');
      return;
    }

    await this.pollService.processPollJob(data);
  }
}
