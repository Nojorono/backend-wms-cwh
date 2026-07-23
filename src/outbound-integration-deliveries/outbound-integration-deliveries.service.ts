import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import {
  OutboundIntegrationDeliveries,
  ShipConfirmInternalTransactionType,
} from '../core/domain/entities/outbound-integration-deliveries.entity';
import { CreateOutboundIntegrationDeliveriesDto } from './dto/create-outbound-integration-deliveries.dto';
import { UpdateOutboundIntegrationDeliveriesDto } from './dto/update-outbound-integration-deliveries.dto';
import { PollShipConfirmStatusResponseDto } from './dto/poll-ship-confirm-status-response.dto';
import { PollShipConfirmByMemoQueryDto } from './dto/poll-ship-confirm-by-memo-query.dto';
import { OutboundIntegrationDeliveriesRepository } from './outbound-integration-deliveries.repository';
import { ShipConfirmStatusCheckerService } from '../outbound-do/integration/ship-confirm-status-checker.service';
import { OutboundJobProcessStatus } from '../outbound-do/integration/outbound-integration-queue.types';
import { OutboundIntegrationDeliveriesPaginationQueryDto } from './dto/outbound-integration-deliveries-pagination.dto';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { PaginationService } from '../core/services/pagination.service';

@Injectable()
export class OutboundIntegrationDeliveriesService {
  constructor(
    private readonly repository: OutboundIntegrationDeliveriesRepository,
    @Inject(forwardRef(() => ShipConfirmStatusCheckerService))
    private readonly shipConfirmStatusChecker: ShipConfirmStatusCheckerService,
    private readonly paginationService: PaginationService,
  ) {}

  async create(dto: CreateOutboundIntegrationDeliveriesDto): Promise<OutboundIntegrationDeliveries> {
    return await this.repository.create(dto);
  }

  async findAll(): Promise<OutboundIntegrationDeliveries[]> {
    return await this.repository.findAll();
  }

  async findAllPaginated(
    query: OutboundIntegrationDeliveriesPaginationQueryDto,
  ): Promise<PaginatedResponseDto<OutboundIntegrationDeliveries>> {
    const { data, total } = await this.repository.findAllPaginated(query);
    return this.paginationService.createPaginatedResponse(data, query, total);
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
   * Poll Oracle for an outbound DO, filtered by transaction_type.
   * shipconfirm.find uses source_header_id (= memo id) + transaction_type per memo group.
   */
  async pollStatusByOutboundDoId(
    outboundDoId: string,
    query: PollShipConfirmByMemoQueryDto,
  ): Promise<PollShipConfirmStatusResponseDto> {
    const scoped = await this.repository.findByOutboundDoIdAndTransactionTypes(outboundDoId, [
      query.transaction_type,
    ]);

    if (!scoped.length) {
      throw new NotFoundException(
        `No outbound integration deliveries for outbound DO ${outboundDoId} and transaction_type ${query.transaction_type}`,
      );
    }

    const result = await this.shipConfirmStatusChecker.checkOutboundDoStatus(
      {
        outboundDoId,
        retryCount: 0,
        maxRetry: 20,
        jobType: 'SHIP_CONFIRM',
      },
      query.transaction_type,
    );

    const refreshed = await this.repository.findByOutboundDoIdAndTransactionTypes(outboundDoId, [
      query.transaction_type,
    ]);

    return this.buildPollStatusResponse(outboundDoId, result, refreshed);
  }

  private buildPollStatusResponse(
    outboundDoId: string,
    result: {
      status: OutboundJobProcessStatus;
      reason: string;
      deliveriesUpdated: number;
      hasError: boolean;
    },
    deliveries: OutboundIntegrationDeliveries[],
  ): PollShipConfirmStatusResponseDto {
    return {
      status: result.status,
      reason: result.reason,
      outbound_do_id: outboundDoId,
      deliveries_updated: result.deliveriesUpdated,
      has_error: result.hasError,
      source_headers: this.buildSourceHeaderSummaries(deliveries),
      outbound_integration_deliveries: deliveries,
    };
  }

  private buildSourceHeaderSummaries(
    deliveries: OutboundIntegrationDeliveries[],
  ): PollShipConfirmStatusResponseDto['source_headers'] {
    const byMemoId = new Map<string, OutboundIntegrationDeliveries[]>();

    for (const delivery of deliveries) {
      const memoId = delivery.outbound_memo_id?.trim() || delivery.source_header_id?.trim();
      if (!memoId) {
        continue;
      }
      const list = byMemoId.get(memoId) ?? [];
      list.push(delivery);
      byMemoId.set(memoId, list);
    }

    return [...byMemoId.entries()].map(([memoId, rows]) => {
      const processStatus = this.deriveProcessStatusForDeliveries(rows);
      return {
        source_header_id: memoId,
        outbound_memo_id: memoId,
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
