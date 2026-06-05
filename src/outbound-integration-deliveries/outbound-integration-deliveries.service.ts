import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import {
  OutboundIntegrationDeliveries,
  ShipConfirmInternalTransactionType,
} from '../core/domain/entities/outbound-integration-deliveries.entity';
import { CreateOutboundIntegrationDeliveriesDto } from './dto/create-outbound-integration-deliveries.dto';
import { UpdateOutboundIntegrationDeliveriesDto } from './dto/update-outbound-integration-deliveries.dto';
import { PollShipConfirmStatusResponseDto } from './dto/poll-ship-confirm-status-response.dto';
import { OutboundIntegrationDeliveriesRepository } from './outbound-integration-deliveries.repository';
import { ShipConfirmStatusCheckerService } from '../outbound-do/integration/ship-confirm-status-checker.service';
import { OutboundJobProcessStatus } from '../outbound-do/integration/outbound-integration-queue.types';

@Injectable()
export class OutboundIntegrationDeliveriesService {
  constructor(
    private readonly repository: OutboundIntegrationDeliveriesRepository,
    @Inject(forwardRef(() => ShipConfirmStatusCheckerService))
    private readonly shipConfirmStatusChecker: ShipConfirmStatusCheckerService,
  ) {}

  async create(dto: CreateOutboundIntegrationDeliveriesDto): Promise<OutboundIntegrationDeliveries> {
    return await this.repository.create(dto);
  }

  async findAll(): Promise<OutboundIntegrationDeliveries[]> {
    return await this.repository.findAll();
  }

  async findByOutboundDoId(outboundDoId: string): Promise<OutboundIntegrationDeliveries[]> {
    return await this.repository.findByOutboundDoId(outboundDoId);
  }

  async findByOutboundMemoId(outboundMemoId: string): Promise<OutboundIntegrationDeliveries[]> {
    return await this.repository.findByOutboundMemoId(outboundMemoId);
  }

  async findOne(id: string): Promise<OutboundIntegrationDeliveries> {
    const row = await this.repository.findById(id);
    if (!row) {
      throw new NotFoundException(`Outbound integration delivery with ID ${id} not found`);
    }
    return row;
  }

  async update(
    id: string,
    dto: UpdateOutboundIntegrationDeliveriesDto,
  ): Promise<OutboundIntegrationDeliveries> {
    await this.findOne(id);
    await this.repository.update(id, dto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }

  /**
   * Poll Oracle ship confirm / pick release status via shipconfirm.find,
   * sync to outbound_integration_deliveries (per source_header_id = memo.id for subdist).
   */
  async pollStatusByOutboundDoId(outboundDoId: string): Promise<PollShipConfirmStatusResponseDto> {
    const existing = await this.repository.findByOutboundDoId(outboundDoId);
    if (!existing.length) {
      throw new NotFoundException(
        `No outbound integration deliveries found for outbound DO ${outboundDoId}`,
      );
    }

    const result = await this.shipConfirmStatusChecker.checkOutboundDoStatus({
      outboundDoId,
      retryCount: 0,
      maxRetry: 20,
      jobType: 'SHIP_CONFIRM',
    });

    const refreshed = await this.repository.findByOutboundDoId(outboundDoId);

    return {
      status: result.status,
      reason: result.reason,
      outbound_do_id: outboundDoId,
      deliveries_updated: result.deliveriesUpdated,
      has_error: result.hasError,
      source_headers: this.buildSourceHeaderSummaries(refreshed),
      outbound_integration_deliveries: refreshed,
    };
  }

  private buildSourceHeaderSummaries(
    deliveries: OutboundIntegrationDeliveries[],
  ): PollShipConfirmStatusResponseDto['source_headers'] {
    const bySourceHeader = new Map<string, OutboundIntegrationDeliveries[]>();

    for (const delivery of deliveries) {
      if (!delivery.source_header_id) {
        continue;
      }
      const list = bySourceHeader.get(delivery.source_header_id) ?? [];
      list.push(delivery);
      bySourceHeader.set(delivery.source_header_id, list);
    }

    return [...bySourceHeader.entries()].map(([sourceHeaderId, rows]) => {
      const processStatus = this.deriveProcessStatusForDeliveries(rows);
      return {
        source_header_id: sourceHeaderId,
        outbound_memo_id: rows[0]?.outbound_memo_id ?? undefined,
        status: processStatus,
        reason: this.buildSourceHeaderReason(rows, processStatus),
        delivery_count: rows.length,
      };
    });
  }

  private deriveProcessStatusForDeliveries(
    deliveries: OutboundIntegrationDeliveries[],
  ): OutboundJobProcessStatus {
    if (!deliveries.length) {
      return 'PENDING';
    }

    const pending = deliveries.filter((d) => !this.shipConfirmStatusChecker.areAllOracleStatusesTerminal(d));
    if (pending.length > 0) {
      return 'PENDING';
    }

    const hasError = deliveries.some((d) =>
      this.shipConfirmStatusChecker
        .getRequiredOracleStatusFields(d.transaction_type)
        .some((field) => this.normalizeDeliveryStatus(d[field]) === 'E'),
    );

    return hasError ? 'ERROR' : 'SUCCESS';
  }

  private buildSourceHeaderReason(
    deliveries: OutboundIntegrationDeliveries[],
    processStatus: OutboundJobProcessStatus,
  ): string {
    if (processStatus === 'PENDING') {
      const pendingCount = deliveries.filter(
        (d) => !this.shipConfirmStatusChecker.areAllOracleStatusesTerminal(d),
      ).length;
      return `${pendingCount} delivery row(s) still have non-terminal Oracle status`;
    }
    if (processStatus === 'ERROR') {
      return 'All required Oracle statuses are terminal; at least one field is E';
    }
    const types = [
      ...new Set(
        deliveries
          .map((d) => d.transaction_type)
          .filter((t): t is ShipConfirmInternalTransactionType => t != null),
      ),
    ];
    return `All required Oracle statuses are terminal (S) for ${types.join(', ') || 'delivery'}`;
  }

  private normalizeDeliveryStatus(value?: string | null): string {
    if (typeof value !== 'string') {
      return '';
    }
    return value.trim().toUpperCase();
  }
}
