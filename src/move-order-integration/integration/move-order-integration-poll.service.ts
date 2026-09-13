import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MoveOrderIntegration } from '../../core/domain/entities/move-order-integration.entity';
import { MoveOrderLineIntegration } from '../../core/domain/entities/move-order-integration-lines.entity';
import { DoSuggestionRepository } from '../../do-suggestion/do-suggestion.repository';
import {
  MoveOrderIntegrationPollResponseDto,
  MoveOrderIntegrationPollStatus,
} from '../dto/move-order-integration-poll-response.dto';
import { MoveOrderIntegrationRepository } from '../move-order-integration.repository';
import { IntegrationMoveOrderService } from './integration-move-order.service';
import { MoveOrderIntegrationPollProducer } from './move-order-integration-poll.producer';
import {
  MoveOrderIntegrationCheckResult,
  MoveOrderIntegrationPollJobPayload,
} from './move-order-integration-queue.types';
import { MoveOrderIntegrationSyncService } from './move-order-integration-sync.service';
import { MoveOrderIntegrationLogService } from './move-order-integration-log.service';
import { resolveOracleIfaceStatus, normalizeMoveOrderFindData } from './move-order-oracle-sync.mapper';

type PollOptions = {
  scheduleRetry?: boolean;
  retryCount?: number;
  maxRetry?: number;
};

@Injectable()
export class MoveOrderIntegrationPollService {
  constructor(
    private readonly repository: MoveOrderIntegrationRepository,
    private readonly integrationMoveOrderService: IntegrationMoveOrderService,
    private readonly syncService: MoveOrderIntegrationSyncService,
    private readonly pollProducer: MoveOrderIntegrationPollProducer,
    private readonly integrationLog: MoveOrderIntegrationLogService,
    @Inject(forwardRef(() => DoSuggestionRepository))
    private readonly doSuggestionRepository: DoSuggestionRepository,
  ) {}

  async pollByIntegrationId(id: string): Promise<MoveOrderIntegrationPollResponseDto> {
    const record = await this.findHeaderWithLines(id);
    const sourceHeaderId = record.source_header_id?.trim();

    if (!sourceHeaderId) {
      return this.buildResponse(
        record,
        this.resolveStagingStatus(record.iface_status),
        record.iface_message || 'source_header_id is required for Oracle polling',
      );
    }

    return this.executePoll(
      {
        moveOrderIntegrationId: record.id,
        source_header_id: sourceHeaderId,
        request_number: record.request_number,
        source_system: record.source_system,
        retryCount: 0,
        maxRetry: 0,
      },
      { scheduleRetry: false },
    );
  }

  async processPollJob(data: MoveOrderIntegrationPollJobPayload): Promise<void> {
    await this.executePoll(data, {
      scheduleRetry: true,
      retryCount: data.retryCount ?? 0,
      maxRetry: data.maxRetry ?? 20,
    });
  }

  private async executePoll(
    data: MoveOrderIntegrationPollJobPayload,
    options: PollOptions,
  ): Promise<MoveOrderIntegrationPollResponseDto> {
    const moveOrderIntegrationId = data.moveOrderIntegrationId;
    const retryCount = options.retryCount ?? data.retryCount ?? 0;
    const maxRetry = options.maxRetry ?? data.maxRetry ?? 20;
    const scheduleRetry = options.scheduleRetry ?? false;

    const sourceHeaderId = await this.resolveSourceHeaderId(data);
    if (!sourceHeaderId) {
      await this.repository.updateHeader(moveOrderIntegrationId, {
        iface_status: 'ERROR',
        iface_message: 'source_header_id is required for Oracle polling',
      });
      const record = await this.findHeaderWithLines(moveOrderIntegrationId);
      return this.buildResponse(record, 'ERROR', 'source_header_id is required for Oracle polling');
    }

    this.integrationLog.info('poll', 'Processing poll job', {
      move_order_integration_id: moveOrderIntegrationId,
      source_header_id: sourceHeaderId,
      request_number: data.request_number,
      retry_count: retryCount,
      max_retry: maxRetry,
    });

    if (scheduleRetry && retryCount >= maxRetry) {
      await this.repository.updateHeader(moveOrderIntegrationId, {
        iface_status: 'TIMEOUT',
        iface_message: `Oracle polling timeout after ${retryCount} retries`,
      });
      this.integrationLog.error('poll', 'Polling timeout', {
        move_order_integration_id: moveOrderIntegrationId,
        source_header_id: sourceHeaderId,
        retry_count: retryCount,
      });
      const record = await this.findHeaderWithLines(moveOrderIntegrationId);
      return this.buildResponse(
        record,
        'TIMEOUT',
        `Oracle polling timeout after ${retryCount} retries`,
      );
    }

    const findResult = await this.integrationMoveOrderService.findMoveOrderWithLinesBySourceHeaderId({
      source_header_id: sourceHeaderId,
      source_system: data.source_system,
    });

    const normalizedData = normalizeMoveOrderFindData(
      findResult.data as Record<string, unknown> | null | undefined,
    );

    if (!findResult.status || !normalizedData?.header) {
      const reason = findResult.message || 'Oracle move order not ready yet';
      if (scheduleRetry) {
        const delay = this.pollProducer.scheduleRetry({
          ...data,
          source_header_id: sourceHeaderId,
          retryCount,
          maxRetry,
        });
        this.integrationLog.info('poll', 'Oracle not ready, retry scheduled', {
          move_order_integration_id: moveOrderIntegrationId,
          source_header_id: sourceHeaderId,
          retry_count: retryCount,
          delay_ms: delay,
          reason,
        });
      }
      const record = await this.findHeaderWithLines(moveOrderIntegrationId);
      return this.buildResponse(record, 'PENDING', reason);
    }

    await this.syncService.syncFromOracleFindResponse(moveOrderIntegrationId, findResult);
    const check = this.evaluateFindResult(findResult);

    if (check.status === 'PENDING') {
      await this.repository.updateHeader(moveOrderIntegrationId, {
        iface_status: 'PROCESSING',
        iface_message: check.reason,
      });
      if (scheduleRetry) {
        const delay = this.pollProducer.scheduleRetry({
          ...data,
          source_header_id: sourceHeaderId,
          retryCount,
          maxRetry,
        });
        this.integrationLog.info('poll', 'Still processing, retry scheduled', {
          move_order_integration_id: moveOrderIntegrationId,
          source_header_id: sourceHeaderId,
          retry_count: retryCount,
          delay_ms: delay,
          reason: check.reason,
        });
      }
      const record = await this.findHeaderWithLines(moveOrderIntegrationId);
      return this.buildResponse(record, 'PROCESSING', check.reason);
    }

    if (check.status === 'ERROR') {
      await this.repository.updateHeader(moveOrderIntegrationId, {
        iface_status: 'ERROR',
        iface_message: check.reason,
      });
      this.integrationLog.error('poll', 'Oracle integration failed', {
        move_order_integration_id: moveOrderIntegrationId,
        source_header_id: sourceHeaderId,
        reason: check.reason,
      });
      const record = await this.findHeaderWithLines(moveOrderIntegrationId);
      return this.buildResponse(record, 'ERROR', check.reason);
    }

    await this.repository.updateHeader(moveOrderIntegrationId, {
      iface_status: 'INTEGRATED',
      iface_message: findResult.message || check.reason,
    });
    await this.completeDoSuggestionVoidIfApplicable(sourceHeaderId);
    this.integrationLog.info('poll', 'Integration completed', {
      move_order_integration_id: moveOrderIntegrationId,
      source_header_id: sourceHeaderId,
      request_number: data.request_number,
      line_count: normalizedData.lines?.length ?? 0,
    });
    const record = await this.findHeaderWithLines(moveOrderIntegrationId);
    return this.buildResponse(record, 'INTEGRATED', findResult.message || check.reason);
  }

  private async completeDoSuggestionVoidIfApplicable(
    sourceHeaderId: string,
  ): Promise<void> {
    try {
      const updated = await this.doSuggestionRepository.completeVoidAfterBackToKecil(
        sourceHeaderId,
      );
      if (updated?.status) {
        this.integrationLog.info('poll', 'DO suggestion void finalized after back-to-kecil', {
          source_header_id: sourceHeaderId,
          do_suggestion_id: updated.id,
          status: updated.status,
        });
      }
    } catch (error) {
      this.integrationLog.error('poll', 'Failed to finalize DO suggestion void status', {
        source_header_id: sourceHeaderId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async findHeaderWithLines(
    id: string,
  ): Promise<MoveOrderIntegration & { lines: MoveOrderLineIntegration[] }> {
    const header = await this.repository.findHeaderById(id);
    if (!header) {
      throw new NotFoundException(`Move order integration with ID ${id} not found`);
    }
    const lines = await this.repository.findLinesByHeaderId(id);
    return { ...header, lines };
  }

  private async resolveSourceHeaderId(
    data: MoveOrderIntegrationPollJobPayload,
  ): Promise<string | undefined> {
    const fromPayload = data.source_header_id?.trim();
    if (fromPayload) {
      return fromPayload;
    }

    const header = await this.repository.findHeaderById(data.moveOrderIntegrationId);
    return header?.source_header_id?.trim() || undefined;
  }

  private evaluateFindResult(
    response: Awaited<
      ReturnType<IntegrationMoveOrderService['findMoveOrderWithLinesBySourceHeaderId']>
    >,
  ): MoveOrderIntegrationCheckResult {
    const normalized = normalizeMoveOrderFindData(
      response.data as Record<string, unknown> | null | undefined,
    );

    if (!response.status || !normalized?.header) {
      return {
        status: 'PENDING',
        reason: response.message || 'Oracle move order not ready yet',
      };
    }

    const ifaceStatus = resolveOracleIfaceStatus(normalized.header);
    if (ifaceStatus === 'PENDING') {
      return {
        status: 'PENDING',
        reason: response.message || 'Oracle move order iface status is still pending',
      };
    }
    if (ifaceStatus === 'ERROR') {
      return {
        status: 'ERROR',
        reason: response.message || 'Oracle move order integration failed',
      };
    }

    return {
      status: 'SUCCESS',
      reason: response.message || 'Oracle move order integrated',
    };
  }

  private resolveStagingStatus(ifaceStatus?: string | null): MoveOrderIntegrationPollStatus {
    const normalized = (ifaceStatus ?? '').trim().toUpperCase();
    if (normalized === 'INTEGRATED') {
      return 'INTEGRATED';
    }
    if (normalized === 'ERROR') {
      return 'ERROR';
    }
    if (normalized === 'TIMEOUT') {
      return 'TIMEOUT';
    }
    if (normalized === 'READY') {
      return 'READY';
    }
    if (normalized === 'PROCESSING') {
      return 'PROCESSING';
    }
    return 'PENDING';
  }

  private buildResponse(
    record: MoveOrderIntegration & { lines: MoveOrderLineIntegration[] },
    status: MoveOrderIntegrationPollStatus,
    message: string,
  ): MoveOrderIntegrationPollResponseDto {
    const terminal = status === 'INTEGRATED' || status === 'ERROR' || status === 'TIMEOUT';
    const { lines, ...header } = record;
    return {
      success: terminal && status === 'INTEGRATED',
      status,
      message,
      move_order_integration_id: record.id,
      source_header_id: record.source_header_id,
      request_number: record.request_number,
      header,
      lines,
    };
  }
}
