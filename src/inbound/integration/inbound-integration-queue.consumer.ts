import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InboundRepository } from '../repositories/inbound.repository';
import { InboundDoRepository } from '../repositories/inbound-do.repository';
import { InboundStatus } from 'src/core/domain/entities/inbound.entity';
import { IntegrationStatus } from 'src/core/domain/entities/inbound-do.entity';
import { InboundIntegrationQueueProducer } from './inbound-integration-queue.producer';
import { InboundJobPayload } from './inbound-integration-queue.types';
import { OracleInboundStatusCheckerService } from './oracle-inbound-status-checker.service';
import { InboundIntegrationService } from 'src/inbound-integration/inbound-integration.service';
import { InboundService } from '../inbound.service';

@Injectable()
export class InboundIntegrationQueueConsumer {
  private readonly logger = new Logger(InboundIntegrationQueueConsumer.name);

  constructor(
    private readonly inboundRepo: InboundRepository,
    private readonly inboundDoRepo: InboundDoRepository,
    private readonly inboundIntegrationService: InboundIntegrationService,
    private readonly producer: InboundIntegrationQueueProducer,
    private readonly statusChecker: OracleInboundStatusCheckerService,
    private readonly inboundService: InboundService,
  ) { }

  async handleInboundProcess(data: InboundJobPayload): Promise<void> {
    try {
      const inboundId = data?.inboundId;
      const requestId = data?.requestId;
      const retryCount = data?.retryCount ?? 0;
      const maxRetry = data?.maxRetry ?? 20;

      if (!inboundId) {
        this.logger.error('Inbound queue payload is invalid: missing inboundId');
        return;
      }

      this.logger.log(
        `Inbound queue processing inboundId=${inboundId} requestId=${requestId ?? 'N/A'} retryCount=${retryCount}/${maxRetry}`,
      );

      const alreadyProcessedStatus = await this.getAlreadyProcessedStatus(inboundId);
      if (alreadyProcessedStatus) {
        if (alreadyProcessedStatus === InboundStatus.INTEGRATED) {
          const result = await this.statusChecker.checkInboundStatus({
            inboundId,
            requestId,
            retryCount,
            maxRetry,
          });
          await this.updateInboundDoIntegrationStatusByInboundId(
            inboundId,
            this.mapToDoIntegrationStatus(result.status),
          );
          if (result.status === 'SUCCESS') {
            await this.updateInventoryReadyIfAllDoSuccess(inboundId);
          }
          this.logger.log(
            `Inbound retry check on INTEGRATED status inboundId=${inboundId} requestId=${requestId ?? 'N/A'} resultStatus=${result.status} reason=${result.reason}`,
          );
          return;
        }
        this.logger.warn(
          `Inbound already in terminal status; skip inboundId=${inboundId} status=${alreadyProcessedStatus} requestId=${requestId ?? 'N/A'} retryCount=${retryCount}`,
        );
        return;
      }

      if (retryCount >= maxRetry) {
        await this.inboundRepo.update(inboundId, {
          status: InboundStatus.TIMEOUT,
          notes: `Oracle integration timeout after ${retryCount} retries`,
        });
        await this.updateInboundDoIntegrationStatusByInboundId(
          inboundId,
          IntegrationStatus.FAILED,
        );
        this.logger.error(
          `Inbound queue timeout inboundId=${inboundId} requestId=${requestId ?? 'N/A'} retryCount=${retryCount}`,
        );
        return;
      }

      const result = await this.statusChecker.checkInboundStatus({
        inboundId,
        requestId,
        retryCount,
        maxRetry,
      });

      if (result.status === 'SUCCESS') {
        await this.inboundRepo.update(inboundId, {
          status: InboundStatus.INTEGRATED,
          notes: result.reason,
        });
        await this.updateInboundDoIntegrationStatusByInboundId(
          inboundId,
          IntegrationStatus.SUCCESS,
        );
        await this.updateInventoryReadyIfAllDoSuccess(inboundId);
        this.logger.log(
          `Inbound queue status=SUCCESS inboundId=${inboundId} requestId=${requestId ?? 'N/A'} retryCount=${retryCount}`,
        );
        return;
      }

      if (result.status === 'ERROR') {
        await this.inboundIntegrationService.markHeadersPollResult(
          inboundId,
          'E',
          result.reason,
        );
        await this.inboundRepo.update(inboundId, {
          status: InboundStatus.FAILED,
          notes: result.reason,
        });
        await this.updateInboundDoIntegrationStatusByInboundId(
          inboundId,
          IntegrationStatus.FAILED,
        );
        this.logger.error(
          `Inbound queue status=ERROR inboundId=${inboundId} requestId=${requestId ?? 'N/A'} retryCount=${retryCount} reason=${result.reason}`,
        );
        return;
      }

      const delay = this.producer.scheduleRetry({
        inboundId,
        requestId,
        retryCount,
        maxRetry,
      });
      await this.updateInboundDoIntegrationStatusByInboundId(
        inboundId,
        IntegrationStatus.PENDING,
      );
      this.logger.log(
        `Inbound queue status=PENDING inboundId=${inboundId} requestId=${requestId ?? 'N/A'} retryCount=${retryCount} delayMs=${delay}`,
      );
    } catch (error) {
      this.logger.error(
        `Inbound queue processing failed inboundId=${data?.inboundId ?? 'N/A'}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (data?.inboundId && (data?.retryCount ?? 0) < (data?.maxRetry ?? 20)) {
        const delay = this.producer.scheduleRetry({
          inboundId: data.inboundId,
          requestId: data.requestId,
          retryCount: data.retryCount ?? 0,
          maxRetry: data.maxRetry ?? 20,
        });
        this.logger.warn(
          `Inbound queue rescheduled after failure inboundId=${data.inboundId} retryCount=${data.retryCount ?? 0} delayMs=${delay}`,
        );
      }
    }
  }

  private async getAlreadyProcessedStatus(inboundId: string): Promise<InboundStatus | null> {
    const inbound = await this.inboundRepo.findOne(inboundId);
    if (!inbound) {
      return InboundStatus.FAILED;
    }
    const isTerminal = [InboundStatus.INTEGRATED, InboundStatus.FAILED, InboundStatus.TIMEOUT].includes(
      inbound.status as InboundStatus,
    );
    return isTerminal ? (inbound.status as InboundStatus) : null;
  }

  private mapToDoIntegrationStatus(
    status: 'SUCCESS' | 'ERROR' | 'PENDING',
  ): IntegrationStatus {
    if (status === 'SUCCESS') {
      return IntegrationStatus.SUCCESS;
    }
    if (status === 'ERROR') {
      return IntegrationStatus.FAILED;
    }
    return IntegrationStatus.PENDING;
  }

  private async updateInboundDoIntegrationStatusByInboundId(
    inboundId: string,
    targetStatus: IntegrationStatus,
  ): Promise<void> {
    const headers = await this.inboundIntegrationService.findAllByInboundActiveDos(inboundId);
    const inboundDoIds = Array.from(
      new Set(
        headers
          .map((h) => h.inbound_do_id)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    for (const inboundDoId of inboundDoIds) {
      try {
        await this.inboundDoRepo.update(inboundDoId, {
          integration_status: targetStatus,
        });
      } catch (error) {
        if (this.isInboundDoMissingError(error)) {
          // Keep queue progressing when stale inbound_integration rows reference deleted DOs.
          this.logger.warn(
            `Skip missing inbound_do_id=${inboundDoId} while updating integration_status=${targetStatus} for inboundId=${inboundId}`,
          );
          continue;
        }
        throw error;
      }
    }

    if (inboundDoIds.length === 0) {
      this.logger.warn(
        `No inbound_do_id found in inbound_integration headers for inboundId=${inboundId}; skip inbound_do integration_status update`,
      );
    }
  }

  private isInboundDoMissingError(error: unknown): boolean {
    if (error instanceof NotFoundException) {
      return true;
    }
    const message = error instanceof Error ? error.message : String(error);
    return /inbound do not found/i.test(message);
  }

  private async updateInventoryReadyIfAllDoSuccess(inboundId: string): Promise<void> {
    const inboundDos = await this.inboundDoRepo.findAllByInbound(inboundId);
    if (!inboundDos.length) {
      return;
    }
    const allSuccess = inboundDos.every((item) => item.integration_status === IntegrationStatus.SUCCESS);
    if (!allSuccess) {
      return;
    }

    await this.inboundService.updateStatusInventoryReadyByInboundId(inboundId);
    this.logger.log(
      `All inbound_dos are SUCCESS, inventory status set to READY for inboundId=${inboundId}`,
    );
  }
}
