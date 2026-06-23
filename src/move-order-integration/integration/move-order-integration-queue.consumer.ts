import { Injectable, Logger } from '@nestjs/common';
import { MoveOrderIntegrationRepository } from '../move-order-integration.repository';
import { IntegrationMoveOrderService } from './integration-move-order.service';
import { MoveOrderIntegrationPollProducer } from './move-order-integration-poll.producer';
import { MoveOrderIntegrationInsertJobPayload } from './move-order-integration-queue.types';
import { mapMoveOrderIntegrationEntityToOracle } from './move-order-integration.mapper';

@Injectable()
export class MoveOrderIntegrationQueueConsumer {
  private readonly logger = new Logger(MoveOrderIntegrationQueueConsumer.name);

  constructor(
    private readonly repository: MoveOrderIntegrationRepository,
    private readonly integrationMoveOrderService: IntegrationMoveOrderService,
    private readonly pollProducer: MoveOrderIntegrationPollProducer,
  ) {}

  async handleInsertJob(data: MoveOrderIntegrationInsertJobPayload): Promise<void> {
    const moveOrderIntegrationId = data?.moveOrderIntegrationId;

    if (!moveOrderIntegrationId) {
      this.logger.error('Move order insert queue payload is invalid: missing moveOrderIntegrationId');
      return;
    }

    this.logger.log(
      `Move order insert queue processing id=${moveOrderIntegrationId} request_number=${data.request_number}`,
    );

    const header = await this.repository.findHeaderById(moveOrderIntegrationId);
    if (!header) {
      this.logger.warn(`Move order integration not found id=${moveOrderIntegrationId}`);
      return;
    }

    const lines = await this.repository.findLinesByHeaderId(moveOrderIntegrationId);
    if (!lines.length) {
      await this.repository.updateHeader(moveOrderIntegrationId, {
        iface_status: 'ERROR',
        iface_message: 'No lines to submit to Oracle',
      });
      return;
    }

    const createDto = mapMoveOrderIntegrationEntityToOracle(header, lines);
    const createResult = await this.integrationMoveOrderService.createMoveOrderWithLines(
      createDto,
      data.userId,
      data.userName,
    );

    if (!createResult.status) {
      await this.repository.updateHeader(moveOrderIntegrationId, {
        iface_status: 'ERROR',
        iface_message: createResult.message,
      });
      this.logger.error(
        `Move order create_with_lines failed id=${moveOrderIntegrationId}: ${createResult.message}`,
      );
      return;
    }

    const requestNumber = data.request_number || header.request_number || createDto.REQUEST_NUMBER;
    const sourceSystem = data.source_system ?? header.source_system ?? createDto.SOURCE_SYSTEM;

    await this.repository.updateHeader(moveOrderIntegrationId, {
      iface_status: 'PROCESSING',
      iface_message: createResult.message,
    });

    await this.pollProducer.publish({
      moveOrderIntegrationId,
      request_number: requestNumber,
      source_system: sourceSystem,
      retryCount: 0,
      maxRetry: 20,
    });
  }
}
