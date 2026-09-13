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
   * Uses the same find process as the background worker:
   *  - PICK_RELEASE → per-row find by source_line_id
   *  - SHIP_CONFIRM → per-row find by delivery_id
   *  - MUTASI → header-level find by source_header_id + iso_header_id
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

    return this.buildPollStatusResponse(
      outboundDoId,
      result,
      refreshed,
      query.transaction_type,
    );
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
    transactionType: ShipConfirmInternalTransactionType,
  ): PollShipConfirmStatusResponseDto {
    return {
      status: result.status,
      reason: result.reason,
      outbound_do_id: outboundDoId,
      deliveries_updated: result.deliveriesUpdated,
      has_error: result.hasError,
      source_headers: this.buildSourceHeaderSummaries(deliveries),
      find_keys: this.buildFindKeySummaries(deliveries, transactionType),
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

  /**
   * Mirror the find process keys used by ShipConfirmStatusCheckerService:
   *  - PICK_RELEASE → source_line_id
   *  - SHIP_CONFIRM → delivery_id
   *  - MUTASI → source_header_id (+ iso_header_id)
   */
  private buildFindKeySummaries(
    deliveries: OutboundIntegrationDeliveries[],
    transactionType: ShipConfirmInternalTransactionType,
  ): PollShipConfirmStatusResponseDto['find_keys'] {
    return deliveries.map((delivery) => {
      const sourceHeaderId =
        delivery.outbound_memo_id?.trim() || delivery.source_header_id?.trim() || undefined;
      const sourceLineId =
        delivery.source_line_id?.trim() || delivery.outbound_memo_item_id?.trim() || undefined;
      const deliveryId =
        delivery.delivery_id != null ? String(delivery.delivery_id) : undefined;
      const isoHeaderId =
        delivery.iso_header_id != null ? Number(delivery.iso_header_id) : undefined;

      const rowStatus = this.deriveProcessStatusForDeliveries([delivery]);

      if (
        transactionType ===
        ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_PICK_RELEASE
      ) {
        if (!sourceLineId) {
          return {
            delivery_row_id: delivery.id,
            source_header_id: sourceHeaderId,
            source_line_id: undefined,
            iso_header_id: isoHeaderId,
            status: 'SKIPPED' as const,
            reason: 'Missing source_line_id — shipconfirm.find skipped for this row',
          };
        }
        if (isoHeaderId == null) {
          return {
            delivery_row_id: delivery.id,
            source_header_id: sourceHeaderId,
            source_line_id: sourceLineId,
            iso_header_id: undefined,
            status: 'SKIPPED' as const,
            reason: 'Missing iso_header_id — shipconfirm.find skipped for this row',
          };
        }
        return {
          delivery_row_id: delivery.id,
          source_header_id: sourceHeaderId,
          source_line_id: sourceLineId,
          iso_header_id: isoHeaderId,
          status: rowStatus,
          reason: this.buildFindKeyReason(rowStatus, 'source_line_id', sourceLineId),
        };
      }

      if (
        transactionType ===
        ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_SHIP_CONFIRM
      ) {
        if (!deliveryId) {
          return {
            delivery_row_id: delivery.id,
            source_header_id: sourceHeaderId,
            delivery_id: undefined,
            status: 'SKIPPED' as const,
            reason:
              'Missing delivery_id — shipconfirm.find skipped until pick-release populates it',
          };
        }
        return {
          delivery_row_id: delivery.id,
          source_header_id: sourceHeaderId,
          delivery_id: deliveryId,
          status: rowStatus,
          reason: this.buildFindKeyReason(rowStatus, 'delivery_id', deliveryId),
        };
      }

      // MUTASI / default — header-level find
      if (!sourceHeaderId || isoHeaderId == null) {
        return {
          delivery_row_id: delivery.id,
          source_header_id: sourceHeaderId,
          iso_header_id: isoHeaderId,
          status: 'SKIPPED' as const,
          reason: 'Missing source_header_id or iso_header_id — shipconfirm.find skipped',
        };
      }
      return {
        delivery_row_id: delivery.id,
        source_header_id: sourceHeaderId,
        iso_header_id: isoHeaderId,
        status: rowStatus,
        reason: this.buildFindKeyReason(rowStatus, 'source_header_id', sourceHeaderId),
      };
    });
  }

  private buildFindKeyReason(
    status: OutboundJobProcessStatus,
    keyName: string,
    keyValue: string,
  ): string {
    if (status === 'PENDING') {
      return `Find by ${keyName}=${keyValue}: still non-terminal Oracle status`;
    }
    if (status === 'ERROR') {
      return `Find by ${keyName}=${keyValue}: terminal with at least one E`;
    }
    return `Find by ${keyName}=${keyValue}: all required Oracle statuses terminal (S)`;
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
