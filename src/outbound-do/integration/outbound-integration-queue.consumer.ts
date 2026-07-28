import { Injectable, Logger } from '@nestjs/common';
import { OutboundIntegrationQueueProducer } from './outbound-integration-queue.producer';
import {
  OutboundJobPayload,
  OutboundJobProcessStatus,
  OutboundMemoCheckResult,
  OutboundIntegrationJobType,
} from './outbound-integration-queue.types';
import { PoInternalReqStatusCheckerService } from './po-internal-req-status-checker.service';
import { ShipConfirmStatusCheckerService } from './ship-confirm-status-checker.service';
import {
  OutboundIntegrationIrReqService,
  OutboundIntegrationIrReqHeaderWithLines,
} from 'src/outbound-integration-ir-req/outbound-integration-ir-req.service';
import { OutboundDoRepository } from '../outbound-do.repository';
import { OutboundMemoStatus } from 'src/core/domain/entities/outbound-memo.entity';
import { OutboundDoType } from 'src/core/domain/entities/outbound-do.entity';

@Injectable()
export class OutboundIntegrationQueueConsumer {
  private readonly logger = new Logger(OutboundIntegrationQueueConsumer.name);
  private readonly terminalStatuses = new Set(['S', 'E', 'SUCCESS', 'COMPLETED', 'ERROR', 'FAILED']);

  constructor(
    private readonly outboundIntegrationIrReqService: OutboundIntegrationIrReqService,
    private readonly producer: OutboundIntegrationQueueProducer,
    private readonly statusChecker: PoInternalReqStatusCheckerService,
    private readonly shipConfirmStatusChecker: ShipConfirmStatusCheckerService,
    private readonly outboundDoRepository: OutboundDoRepository,
  ) { }

  async handleOutboundProcess(data: OutboundJobPayload): Promise<void> {
    try {
      const outboundDoId = data?.outboundDoId;
      const retryCount = data?.retryCount ?? 0;
      const maxRetry = data?.maxRetry ?? 20;

      if (!outboundDoId) {
        this.logger.error('Outbound queue payload is invalid: missing outboundDoId');
        return;
      }

      const jobType = await this.resolveJobType(outboundDoId, data?.jobType);

      if (jobType === 'SHIP_CONFIRM') {
        await this.handleShipConfirmProcess({ ...data, outboundDoId, jobType: 'SHIP_CONFIRM' });
        return;
      }

      this.logger.log(
        `Outbound queue processing outboundDoId=${outboundDoId} retryCount=${retryCount}/${maxRetry} jobType=${jobType}`,
      );

      const headers =
        (await this.outboundIntegrationIrReqService.findAllByOutboundDoId(outboundDoId)) ?? [];
      if (headers.length === 0) {
        this.logger.warn(`No integration IR req headers for outboundDoId=${outboundDoId}`);
        return;
      }

      if (retryCount >= maxRetry) {
        const result = await this.statusChecker.checkOutboundDoStatus({
          outboundDoId,
          retryCount,
          maxRetry,
        });
        await this.applyMemoStatusUpdates(result.memos);

        const refreshedHeaders =
          (await this.outboundIntegrationIrReqService.findAllByOutboundDoId(outboundDoId)) ?? [];
        await this.applyMemoTimeoutForPendingMemos(refreshedHeaders);
        this.logger.error(
          `Outbound queue timeout outboundDoId=${outboundDoId} retryCount=${retryCount}`,
        );
        return;
      }

      const result = await this.statusChecker.checkOutboundDoStatus({
        outboundDoId,
        retryCount,
        maxRetry,
      });

      await this.applyMemoStatusUpdates(result.memos);

      if (result.status === 'SUCCESS') {
        this.logger.log(
          `Outbound queue status=SUCCESS outboundDoId=${outboundDoId} retryCount=${retryCount}`,
        );
        return;
      }

      if (result.status === 'ERROR') {
        this.logger.error(
          `Outbound queue status=ERROR outboundDoId=${outboundDoId} retryCount=${retryCount} reason=${result.reason}`,
        );
        return;
      }

      const delay = this.producer.scheduleRetry({
        outboundDoId,
        retryCount,
        maxRetry,
        jobType: 'PO_INTERNAL_REQ',
      });
      this.logger.log(
        `Outbound queue status=PENDING outboundDoId=${outboundDoId} retryCount=${retryCount} delayMs=${delay}`,
      );
    } catch (error) {
      this.logger.error(
        `Outbound queue processing failed outboundDoId=${data?.outboundDoId ?? 'N/A'}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (data?.outboundDoId && (data?.retryCount ?? 0) < (data?.maxRetry ?? 20)) {
        const retryJobType = await this.resolveJobType(data.outboundDoId, data.jobType);
        const delay = this.producer.scheduleRetry({
          outboundDoId: data.outboundDoId,
          retryCount: data.retryCount ?? 0,
          maxRetry: data.maxRetry ?? 20,
          jobType: retryJobType,
          // Must preserve type scope — dropping it mixes pick-release / ship-confirm polls
          // and can route AMO ship-confirm into PO_INTERNAL_REQ path.
          transactionType: data.transactionType,
        });
        this.logger.warn(
          `Outbound queue rescheduled after failure outboundDoId=${data.outboundDoId} retryCount=${data.retryCount ?? 0} jobType=${retryJobType} transactionType=${data.transactionType ?? 'ALL'} delayMs=${delay}`,
        );
      }
    }
  }

  private async handleShipConfirmProcess(data: OutboundJobPayload): Promise<void> {
    const outboundDoId = data.outboundDoId;
    const retryCount = data.retryCount ?? 0;
    const maxRetry = data.maxRetry ?? 20;

    const transactionType = data.transactionType;

    this.logger.log(
      `Ship confirm queue processing outboundDoId=${outboundDoId} retryCount=${retryCount}/${maxRetry} transactionType=${transactionType ?? 'ALL'}`,
    );

    if (retryCount >= maxRetry) {
      const result = await this.shipConfirmStatusChecker.checkOutboundDoStatus(
        {
          outboundDoId,
          retryCount,
          maxRetry,
          jobType: 'SHIP_CONFIRM',
          transactionType,
        },
        transactionType,
      );
      this.logger.error(
        `Ship confirm queue timeout outboundDoId=${outboundDoId} retryCount=${retryCount} transactionType=${transactionType ?? 'ALL'} reason=${result.reason}`,
      );
      return;
    }

    const result = await this.shipConfirmStatusChecker.checkOutboundDoStatus(
      {
        outboundDoId,
        retryCount,
        maxRetry,
        jobType: 'SHIP_CONFIRM',
        transactionType,
      },
      transactionType,
    );

    if (result.status === 'SUCCESS') {
      this.logger.log(
        `Ship confirm queue status=SUCCESS outboundDoId=${outboundDoId} retryCount=${retryCount} transactionType=${transactionType ?? 'ALL'} deliveriesUpdated=${result.deliveriesUpdated}`,
      );
      return;
    }

    if (result.status === 'ERROR') {
      this.logger.error(
        `Ship confirm queue status=ERROR outboundDoId=${outboundDoId} retryCount=${retryCount} transactionType=${transactionType ?? 'ALL'} reason=${result.reason}`,
      );
      return;
    }

    const delay = this.producer.scheduleRetry({
      outboundDoId,
      retryCount,
      maxRetry,
      jobType: 'SHIP_CONFIRM',
      transactionType,
    });
    this.logger.log(
      `Ship confirm queue status=PENDING outboundDoId=${outboundDoId} retryCount=${retryCount} transactionType=${transactionType ?? 'ALL'} delayMs=${delay} reason=${result.reason} deliveriesUpdated=${result.deliveriesUpdated}`,
    );
  }

  /**
   * SUBDIST uses outbound_integration_deliveries (pick release / ship confirm), not IR req.
   */
  private async resolveJobType(
    outboundDoId: string,
    jobType?: OutboundIntegrationJobType,
  ): Promise<OutboundIntegrationJobType> {
    if (jobType === 'SHIP_CONFIRM') {
      return 'SHIP_CONFIRM';
    }

    const outboundType = await this.outboundDoRepository.findOutboundTypeById(outboundDoId);
    if (outboundType === OutboundDoType.SUBDIST) {
      return 'SHIP_CONFIRM';
    }

    // AMO / internal ship-confirm uses deliveries staging; if IR req jobType was dropped
    // on retry, detect deliveries and keep SHIP_CONFIRM routing.
    if (jobType == null || jobType === 'PO_INTERNAL_REQ') {
      const hasShipConfirmDeliveries =
        await this.shipConfirmStatusChecker.hasDeliveriesForOutboundDo(outboundDoId);
      if (hasShipConfirmDeliveries && outboundType === OutboundDoType.AMO) {
        return 'SHIP_CONFIRM';
      }
    }

    return jobType ?? 'PO_INTERNAL_REQ';
  }

  private async applyMemoStatusUpdates(memoResults: OutboundMemoCheckResult[]): Promise<void> {
    for (const memoResult of memoResults) {
      const memoStatus = this.mapProcessStatusToMemoStatus(memoResult.status);
      if (!memoStatus) {
        continue;
      }

      const memo = await this.outboundDoRepository.findMemoById(memoResult.outboundMemoId);
      if (!memo) {
        this.logger.warn(
          `Skip memo status update; memo not found outboundMemoId=${memoResult.outboundMemoId}`,
        );
        continue;
      }

      if (!this.shouldUpdateMemoStatus(memo.status, memoStatus)) {
        continue;
      }

      await this.outboundDoRepository.updateMemoStatus(memoResult.outboundMemoId, memoStatus);
      this.logger.log(
        `Outbound memo status updated outboundMemoId=${memoResult.outboundMemoId} status=${memoStatus} reason=${memoResult.reason}`,
      );
    }
  }

  private async applyMemoTimeoutForPendingMemos(
    headers: OutboundIntegrationIrReqHeaderWithLines[],
  ): Promise<void> {
    for (const header of headers) {
      if (!header.outbound_memo_id) {
        continue;
      }

      const memo = await this.outboundDoRepository.findMemoById(header.outbound_memo_id);
      if (!memo) {
        continue;
      }

      const processStatus = this.statusChecker.deriveProcessStatusFromHeader(header);
      const memoStatus =
        processStatus === 'SUCCESS'
          ? OutboundMemoStatus.INTEGRATED
          : processStatus === 'ERROR'
            ? OutboundMemoStatus.FAILED
            : OutboundMemoStatus.TIMEOUT;

      if (!this.shouldUpdateMemoStatus(memo.status, memoStatus)) {
        continue;
      }

      if (memoStatus === OutboundMemoStatus.TIMEOUT) {
        await this.statusChecker.applyTimeoutToIntegrationHeader(header);
      }

      await this.outboundDoRepository.updateMemoStatus(header.outbound_memo_id, memoStatus);
      this.logger.warn(
        `Outbound memo timeout status updated outboundMemoId=${header.outbound_memo_id} status=${memoStatus} processStatus=${processStatus}`,
      );
    }
  }

  private mapProcessStatusToMemoStatus(
    status: OutboundJobProcessStatus,
  ): OutboundMemoStatus | null {
    if (status === 'SUCCESS') {
      return OutboundMemoStatus.INTEGRATED;
    }
    if (status === 'ERROR') {
      return OutboundMemoStatus.FAILED;
    }
    return null;
  }

  /**
   * Allow retries to recover FAILED/TIMEOUT -> INTEGRATED,
   * but never downgrade INTEGRATED back to non-integrated statuses.
   */
  private shouldUpdateMemoStatus(
    currentStatus: OutboundMemoStatus | null | undefined,
    nextStatus: OutboundMemoStatus,
  ): boolean {
    if (!currentStatus) {
      return true;
    }
    if (currentStatus === nextStatus) {
      return false;
    }
    if (currentStatus === OutboundMemoStatus.INTEGRATED) {
      return false;
    }
    return true;
  }

  private isAllHeadersTerminal(headers: OutboundIntegrationIrReqHeaderWithLines[]): boolean {
    return headers.every((header) => {
      const statuses = [
        header.iface_status_ir,
        header.iface_status_io,
        header.iface_status_oi,
        ...(header.lines ?? []).map((line) => line.iface_line_status_ir),
      ]
        .filter((s): s is string => typeof s === 'string' && s.trim() !== '')
        .map((s) => s.trim().toUpperCase());

      if (statuses.length === 0) {
        return false;
      }
      return statuses.every((s) => this.terminalStatuses.has(s));
    });
  }
}
