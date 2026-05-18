import { Injectable, Logger } from '@nestjs/common';
import { OutboundIntegrationQueueProducer } from './outbound-integration-queue.producer';
import { OutboundJobPayload } from './outbound-integration-queue.types';
import { PoInternalReqStatusCheckerService } from './po-internal-req-status-checker.service';
import {
  OutboundIntegrationIrReqService,
  OutboundIntegrationIrReqHeaderWithLines,
} from 'src/outbound-integration-ir-req/outbound-integration-ir-req.service';

@Injectable()
export class OutboundIntegrationQueueConsumer {
  private readonly logger = new Logger(OutboundIntegrationQueueConsumer.name);
  private readonly terminalStatuses = new Set(['S', 'E', 'SUCCESS', 'COMPLETED', 'ERROR', 'FAILED']);

  constructor(
    private readonly outboundIntegrationIrReqService: OutboundIntegrationIrReqService,
    private readonly producer: OutboundIntegrationQueueProducer,
    private readonly statusChecker: PoInternalReqStatusCheckerService,
  ) {}

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
        this.logger.log(
          `Outbound integration already terminal outboundDoId=${outboundDoId} retryCount=${retryCount}`,
        );
        return;
      }

      if (retryCount >= maxRetry) {
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
