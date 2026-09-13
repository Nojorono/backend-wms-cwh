import { Injectable } from '@nestjs/common';
import { MoveOrderIntegrationRepository } from '../move-order-integration.repository';
import { IntegrationMoveOrderService } from './integration-move-order.service';
import { MoveOrderIntegrationPollProducer } from './move-order-integration-poll.producer';
import { MoveOrderIntegrationInsertJobPayload } from './move-order-integration-queue.types';
import { mapMoveOrderIntegrationEntityToOracle } from './move-order-integration.mapper';
import { MoveOrderIntegrationSyncService } from './move-order-integration-sync.service';
import { MoveOrderIntegrationLogService } from './move-order-integration-log.service';

@Injectable()
export class MoveOrderIntegrationQueueConsumer {
  constructor(
    private readonly repository: MoveOrderIntegrationRepository,
    private readonly integrationMoveOrderService: IntegrationMoveOrderService,
    private readonly pollProducer: MoveOrderIntegrationPollProducer,
    private readonly syncService: MoveOrderIntegrationSyncService,
    private readonly integrationLog: MoveOrderIntegrationLogService,
  ) {}

  async handleInsertJob(data: MoveOrderIntegrationInsertJobPayload): Promise<void> {
    const moveOrderIntegrationId = data?.moveOrderIntegrationId;

    if (!moveOrderIntegrationId) {
      this.integrationLog.error('insert', 'Invalid queue payload', {
        reason: 'missing moveOrderIntegrationId',
      });
      return;
    }

    this.integrationLog.info('insert', 'Processing queued job', {
      move_order_integration_id: moveOrderIntegrationId,
      request_number: data.request_number,
    });

    const header = await this.repository.findHeaderById(moveOrderIntegrationId);
    if (!header) {
      this.integrationLog.warn('insert', 'Header not found', {
        move_order_integration_id: moveOrderIntegrationId,
      });
      return;
    }

    const lines = await this.repository.findLinesByHeaderId(moveOrderIntegrationId);
    if (!lines.length) {
      await this.repository.updateHeader(moveOrderIntegrationId, {
        iface_status: 'ERROR',
        iface_message: 'No lines to submit to Oracle',
      });
      this.integrationLog.error('insert', 'No lines to submit', {
        move_order_integration_id: moveOrderIntegrationId,
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
      this.integrationLog.error('insert', 'Oracle create failed', {
        move_order_integration_id: moveOrderIntegrationId,
        request_number: data.request_number ?? createDto.REQUEST_NUMBER,
        source_header_id: header.source_header_id,
        line_count: lines.length,
        error: createResult.message,
      });
      return;
    }

    await this.syncService.syncFromCreateResponse(moveOrderIntegrationId, createResult.data);

    const requestNumber = data.request_number || header.request_number || createDto.REQUEST_NUMBER;
    const sourceHeaderId =
      header.source_header_id?.trim() || createDto.SOURCE_HEADER_ID?.trim();
    const sourceSystem = data.source_system ?? header.source_system ?? createDto.SOURCE_SYSTEM;

    if (!sourceHeaderId) {
      await this.repository.updateHeader(moveOrderIntegrationId, {
        iface_status: 'ERROR',
        iface_message: 'source_header_id is required for Oracle polling',
      });
      this.integrationLog.error('insert', 'Missing source_header_id for polling', {
        move_order_integration_id: moveOrderIntegrationId,
      });
      return;
    }

    await this.repository.updateHeader(moveOrderIntegrationId, {
      iface_status: 'PROCESSING',
      iface_message: createResult.message,
    });

    await this.pollProducer.publish({
      moveOrderIntegrationId,
      source_header_id: sourceHeaderId,
      request_number: requestNumber,
      source_system: sourceSystem,
      retryCount: 0,
      maxRetry: 20,
    });

    this.integrationLog.info('insert', 'Oracle create succeeded, poll scheduled', {
      move_order_integration_id: moveOrderIntegrationId,
      request_number: requestNumber,
      source_header_id: sourceHeaderId,
      line_count: lines.length,
    });
  }
}
