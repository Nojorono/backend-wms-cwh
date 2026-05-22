import { Injectable, Logger } from '@nestjs/common';
import { OutboundIntegrationQueueProducer } from './outbound-integration-queue.producer';
import {
  OutboundJobPayload,
  OutboundJobProcessStatus,
  OutboundMemoCheckResult,
} from './outbound-integration-queue.types';
import { PoInternalReqStatusCheckerService } from './po-internal-req-status-checker.service';
import {
  OutboundIntegrationIrReqService,
  OutboundIntegrationIrReqHeaderWithLines,
} from 'src/outbound-integration-ir-req/outbound-integration-ir-req.service';
import { OutboundDoRepository } from '../outbound-do.repository';
import { OutboundMemoStatus } from 'src/core/domain/entities/outbound-memo.entity';

@Injectable()
export class OutboundIntegrationQueueConsumer {
  private readonly logger = new Logger(OutboundIntegrationQueueConsumer.name);
  private readonly terminalStatuses = new Set(['S', 'E', 'SUCCESS', 'COMPLETED', 'ERROR', 'FAILED']);
  private readonly terminalMemoStatuses = new Set<OutboundMemoStatus>([
    OutboundMemoStatus.INTEGRATED,
    OutboundMemoStatus.FAILED,
    OutboundMemoStatus.TIMEOUT,
  ]);

  constructor(
    private readonly outboundIntegrationIrReqService: OutboundIntegrationIrReqService,
    private readonly producer: OutboundIntegrationQueueProducer,
    private readonly statusChecker: PoInternalReqStatusCheckerService,
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

      this.logger.log(
        `Outbound queue processing outboundDoId=${outboundDoId} retryCount=${retryCount}/${maxRetry}`,
      );

      const headers =
        (await this.outboundIntegrationIrReqService.findAllByOutboundDoId(outboundDoId)) ?? [];
      if (headers.length === 0) {
        this.logger.warn(`No integration IR req headers for outboundDoId=${outboundDoId}`);
        return;
      }

      if (this.isAllHeadersTerminal(headers)) {
        const memoResults = headers
          .filter((header) => Boolean(header.outbound_memo_id))
          .map((header) => ({
            outboundMemoId: header.outbound_memo_id as string,
            status: this.statusChecker.deriveProcessStatusFromHeader(header),
            reason: 'Synced integration header already terminal',
          }));
        await this.applyMemoStatusUpdates(memoResults);
        this.logger.log(
          `Outbound integration already terminal outboundDoId=${outboundDoId} retryCount=${retryCount}`,
        );
        return;
      }

      if (retryCount >= maxRetry) {
        await this.applyMemoTimeoutForPendingMemos(headers);
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
        const delay = this.producer.scheduleRetry({
          outboundDoId: data.outboundDoId,
          retryCount: data.retryCount ?? 0,
          maxRetry: data.maxRetry ?? 20,
        });
        this.logger.warn(
          `Outbound queue rescheduled after failure outboundDoId=${data.outboundDoId} retryCount=${data.retryCount ?? 0} delayMs=${delay}`,
        );
      }
    }
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

      if (memo.status && this.terminalMemoStatuses.has(memo.status)) {
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
      if (!memo || (memo.status && this.terminalMemoStatuses.has(memo.status))) {
        continue;
      }

      const processStatus = this.statusChecker.deriveProcessStatusFromHeader(header);
      const memoStatus =
        processStatus === 'SUCCESS'
          ? OutboundMemoStatus.INTEGRATED
          : processStatus === 'ERROR'
            ? OutboundMemoStatus.FAILED
            : OutboundMemoStatus.TIMEOUT;

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
