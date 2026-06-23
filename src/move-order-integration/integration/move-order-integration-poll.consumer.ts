import { Injectable, Logger } from '@nestjs/common';
import { MoveOrderIntegrationRepository } from '../move-order-integration.repository';
import { IntegrationMoveOrderService } from './integration-move-order.service';
import { MoveOrderIntegrationSyncService } from './move-order-integration-sync.service';
import { MoveOrderIntegrationPollProducer } from './move-order-integration-poll.producer';
import {
  MoveOrderIntegrationCheckResult,
  MoveOrderIntegrationPollJobPayload,
} from './move-order-integration-queue.types';
import { resolveOracleIfaceStatus } from './move-order-oracle-sync.mapper';

@Injectable()
export class MoveOrderIntegrationPollConsumer {
  private readonly logger = new Logger(MoveOrderIntegrationPollConsumer.name);

  constructor(
    private readonly repository: MoveOrderIntegrationRepository,
    private readonly integrationMoveOrderService: IntegrationMoveOrderService,
    private readonly syncService: MoveOrderIntegrationSyncService,
    private readonly pollProducer: MoveOrderIntegrationPollProducer,
  ) {}

  async handlePollProcess(data: MoveOrderIntegrationPollJobPayload): Promise<void> {
    const moveOrderIntegrationId = data?.moveOrderIntegrationId;
    const retryCount = data?.retryCount ?? 0;
    const maxRetry = data?.maxRetry ?? 20;

    if (!moveOrderIntegrationId) {
      this.logger.error('Move order poll payload is invalid: missing moveOrderIntegrationId');
      return;
    }

    if (!data.request_number) {
      await this.repository.updateHeader(moveOrderIntegrationId, {
        iface_status: 'ERROR',
        iface_message: 'request_number is required for Oracle polling',
      });
      return;
    }

    this.logger.log(
      `Move order poll queue processing id=${moveOrderIntegrationId} request_number=${data.request_number} retryCount=${retryCount}/${maxRetry}`,
    );

    if (retryCount >= maxRetry) {
      await this.repository.updateHeader(moveOrderIntegrationId, {
        iface_status: 'TIMEOUT',
        iface_message: `Oracle polling timeout after ${retryCount} retries`,
      });
      this.logger.error(
        `Move order poll timeout id=${moveOrderIntegrationId} retryCount=${retryCount}`,
      );
      return;
    }

    const findResult = await this.integrationMoveOrderService.findMoveOrderWithLinesByRequestNumber({
      request_number: data.request_number,
      source_system: data.source_system,
    });

    const check = this.evaluateFindResult(findResult);

    if (check.status === 'PENDING') {
      const delay = this.pollProducer.scheduleRetry({
        ...data,
        retryCount,
        maxRetry,
      });
      this.logger.log(
        `Move order poll status=PENDING id=${moveOrderIntegrationId} retryCount=${retryCount} delayMs=${delay}`,
      );
      return;
    }

    if (check.status === 'ERROR') {
      await this.repository.updateHeader(moveOrderIntegrationId, {
        iface_status: 'ERROR',
        iface_message: check.reason,
      });
      this.logger.error(
        `Move order poll status=ERROR id=${moveOrderIntegrationId} reason=${check.reason}`,
      );
      return;
    }

    await this.syncService.syncFromOracleFindResponse(moveOrderIntegrationId, findResult);
    await this.repository.updateHeader(moveOrderIntegrationId, {
      iface_status: 'INTEGRATED',
      iface_message: findResult.message || check.reason,
    });
    this.logger.log(`Move order poll status=SUCCESS id=${moveOrderIntegrationId}`);
  }

  private evaluateFindResult(
    response: Awaited<
      ReturnType<IntegrationMoveOrderService['findMoveOrderWithLinesByRequestNumber']>
    >,
  ): MoveOrderIntegrationCheckResult {
    if (!response.status || !response.data?.header) {
      return {
        status: 'PENDING',
        reason: response.message || 'Oracle move order not ready yet',
      };
    }

    const ifaceStatus = resolveOracleIfaceStatus(response.data.header);
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
}
