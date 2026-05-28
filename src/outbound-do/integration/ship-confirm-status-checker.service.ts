import { Injectable, Logger } from '@nestjs/common';
import { OutboundIntegrationDeliveriesRepository } from '../../outbound-integration-deliveries/outbound-integration-deliveries.repository';
import { OutboundIntegrationDeliveries } from '../../core/domain/entities/outbound-integration-deliveries.entity';
import { UpdateOutboundIntegrationDeliveriesDto } from '../../outbound-integration-deliveries/dto/update-outbound-integration-deliveries.dto';
import { ShipConfirmIntegrationService } from './ship-confirm.integration';
import { ShipConfirmInternalResponseDto } from './dto/ship-confirm-internal-response.dto';
import {
  OutboundJobPayload,
  OutboundJobProcessStatus,
  ShipConfirmDoCheckResult,
} from './outbound-integration-queue.types';

export const ORACLE_DELIVERY_STATUS_FIELDS = [
  'create_delivery_status',
  'update_delivery_status',
  'pick_release_status',
  'ship_confirm_status',
] as const;

export type OracleDeliveryStatusField = (typeof ORACLE_DELIVERY_STATUS_FIELDS)[number];

@Injectable()
export class ShipConfirmStatusCheckerService {
  private readonly logger = new Logger(ShipConfirmStatusCheckerService.name);
  private readonly terminalStatuses = new Set(['S', 'E']);

  constructor(
    private readonly deliveriesRepository: OutboundIntegrationDeliveriesRepository,
    private readonly shipConfirmIntegrationService: ShipConfirmIntegrationService,
  ) {}

  /** U = Unprocessed; terminal only when S or E. */
  isOracleStatusTerminal(value?: string | null): boolean {
    const normalized = this.normalizeStatus(value);
    return normalized === 'S' || normalized === 'E';
  }

  areAllOracleStatusesTerminal(delivery: OutboundIntegrationDeliveries): boolean {
    return ORACLE_DELIVERY_STATUS_FIELDS.every((field) =>
      this.isOracleStatusTerminal(delivery[field]),
    );
  }

  evaluateDeliveries(deliveries: OutboundIntegrationDeliveries[]): ShipConfirmDoCheckResult {
    if (!deliveries.length) {
      return {
        status: 'PENDING',
        reason: 'No outbound integration deliveries found',
        deliveriesUpdated: 0,
        hasError: false,
      };
    }

    const pending = deliveries.filter((d) => !this.areAllOracleStatusesTerminal(d));
    if (pending.length > 0) {
      return {
        status: 'PENDING',
        reason: `${pending.length} delivery row(s) still have non-terminal Oracle status (U or empty)`,
        deliveriesUpdated: deliveries.length - pending.length,
        hasError: false,
      };
    }

    const hasError = deliveries.some((d) =>
      ORACLE_DELIVERY_STATUS_FIELDS.some((field) => this.normalizeStatus(d[field]) === 'E'),
    );

    return {
      status: hasError ? 'ERROR' : 'SUCCESS',
      reason: hasError
        ? 'All Oracle delivery statuses are terminal; at least one field is E'
        : 'All Oracle delivery statuses are terminal (S)',
      deliveriesUpdated: deliveries.length,
      hasError,
    };
  }

  async checkOutboundDoStatus(payload: OutboundJobPayload): Promise<ShipConfirmDoCheckResult> {
    const deliveries = await this.deliveriesRepository.findByOutboundDoId(payload.outboundDoId);
    if (!deliveries.length) {
      return {
        status: 'PENDING',
        reason: 'No outbound integration deliveries for this outbound DO',
        deliveriesUpdated: 0,
        hasError: false,
      };
    }

    let updatedCount = 0;
    const headers = this.groupDeliveriesBySourceHeader(deliveries);

    for (const [sourceHeaderId, group] of headers) {
      const isoHeaderId = group[0]?.iso_header_id;
      if (isoHeaderId == null) {
        continue;
      }

      try {
        const response = await this.shipConfirmIntegrationService.find({
          source_header_id: sourceHeaderId,
          iso_header_id: Number(isoHeaderId),
        });
        updatedCount += await this.syncDeliveriesFromOracleResponse(group, response);
      } catch (error) {
        this.logger.warn(
          `shipconfirm.find failed sourceHeaderId=${sourceHeaderId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const refreshed = await this.deliveriesRepository.findByOutboundDoId(payload.outboundDoId);
    const result = this.evaluateDeliveries(refreshed);
    return {
      ...result,
      deliveriesUpdated: updatedCount,
    };
  }

  async syncDeliveriesFromCreateResponse(
    deliveries: OutboundIntegrationDeliveries[],
    response: ShipConfirmInternalResponseDto,
  ): Promise<number> {
    return this.syncDeliveriesFromOracleResponse(deliveries, response);
  }

  async syncDeliveriesFromOracleResponse(
    deliveries: OutboundIntegrationDeliveries[],
    response: ShipConfirmInternalResponseDto,
  ): Promise<number> {
    const rows = this.extractOracleRows(response);
    if (!rows.length) {
      return 0;
    }

    let updated = 0;
    for (const row of rows) {
      updated += await this.applyOracleRowToDeliveries(deliveries, row);
    }
    return updated;
  }

  private async applyOracleRowToDeliveries(
    deliveries: OutboundIntegrationDeliveries[],
    oracleRow: Record<string, unknown>,
  ): Promise<number> {
    const patch = this.mapOracleRowToStatusPatch(oracleRow);
    if (Object.keys(patch).length === 0) {
      return 0;
    }

    const sourceHeaderId = this.asString(oracleRow.SOURCE_HEADER_ID);
    const sourceLineId = this.asString(oracleRow.SOURCE_LINE_ID);

    if (!sourceHeaderId) {
      return 0;
    }

    const targets = deliveries.filter((delivery) => {
      if (delivery.source_header_id !== sourceHeaderId) {
        return false;
      }
      if (sourceLineId && delivery.source_line_id !== sourceLineId) {
        return false;
      }
      return true;
    });

    for (const delivery of targets) {
      await this.deliveriesRepository.update(delivery.id, patch);
    }

    return targets.length;
  }

  private mapOracleRowToStatusPatch(
    row: Record<string, unknown>,
  ): UpdateOutboundIntegrationDeliveriesDto {
    const patch: UpdateOutboundIntegrationDeliveriesDto = {};

    const ifaceId = this.asNumber(row.IFACE_ID);
    if (ifaceId != null) {
      patch.iface_id = ifaceId;
    }

    const deliveryId = this.asNumber(row.DELIVERY_ID);
    if (deliveryId != null) {
      patch.delivery_id = deliveryId;
    }

    const deliveryName = this.asString(row.DELIVERY_NAME);
    if (deliveryName) {
      patch.delivery_name = deliveryName;
    }

    const pickReleaseRequestId = this.asNumber(row.PICK_RELEASE_REQUEST_ID);
    if (pickReleaseRequestId != null) {
      patch.pick_release_request_id = pickReleaseRequestId;
    }

    const shipConfirmRequestId = this.asNumber(row.SHIP_CONFIRM_REQUEST_ID);
    if (shipConfirmRequestId != null) {
      patch.ship_confirm_request_id = shipConfirmRequestId;
    }

    this.assignStatusField(patch, 'create_delivery_status', row.CREATE_DELIVERY_STATUS);
    this.assignStatusField(patch, 'create_delivery_message', row.CREATE_DELIVERY_MESSAGE, true);
    this.assignStatusField(patch, 'update_delivery_status', row.UPDATE_DELIVERY_STATUS);
    this.assignStatusField(patch, 'update_delivery_message', row.UPDATE_DELIVERY_MESSAGE, true);
    this.assignStatusField(patch, 'pick_release_status', row.PICK_RELEASE_STATUS);
    this.assignStatusField(patch, 'pick_release_message', row.PICK_RELEASE_MESSAGE, true);
    this.assignStatusField(patch, 'ship_confirm_status', row.SHIP_CONFIRM_STATUS);
    this.assignStatusField(patch, 'ship_confirm_message', row.SHIP_CONFIRM_MESSAGE, true);

    const creationDate = this.asDate(row.CREATION_DATE);
    if (creationDate) {
      patch.creation_date = creationDate;
    }
    const lastUpdatedDate = this.asDate(row.LAST_UPDATED_DATE);
    if (lastUpdatedDate) {
      patch.last_updated_date = lastUpdatedDate;
    }

    return patch;
  }

  private assignStatusField(
    patch: UpdateOutboundIntegrationDeliveriesDto,
    key: keyof UpdateOutboundIntegrationDeliveriesDto,
    value: unknown,
    allowNull = false,
  ): void {
    if (value === undefined) {
      return;
    }
    if (value === null) {
      if (allowNull) {
        (patch as Record<string, unknown>)[key] = null;
      }
      return;
    }
    const str = this.asString(value);
    if (str !== undefined) {
      (patch as Record<string, unknown>)[key] = str;
    }
  }

  private groupDeliveriesBySourceHeader(
    deliveries: OutboundIntegrationDeliveries[],
  ): Map<string, OutboundIntegrationDeliveries[]> {
    const map = new Map<string, OutboundIntegrationDeliveries[]>();
    for (const delivery of deliveries) {
      if (!delivery.source_header_id) {
        continue;
      }
      const list = map.get(delivery.source_header_id) ?? [];
      list.push(delivery);
      map.set(delivery.source_header_id, list);
    }
    return map;
  }

  private extractOracleRows(response: ShipConfirmInternalResponseDto): Record<string, unknown>[] {
    const rows: Record<string, unknown>[] = [];
    this.collectOracleRows(response, rows, 0);
    return rows;
  }

  private collectOracleRows(value: unknown, rows: Record<string, unknown>[], depth: number): void {
    if (depth > 10 || value == null) {
      return;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        this.collectOracleRows(entry, rows, depth + 1);
      }
      return;
    }

    if (typeof value !== 'object') {
      return;
    }

    const obj = value as Record<string, unknown>;

    if (this.isOracleDeliveryRow(obj)) {
      rows.push(obj);
      return;
    }

    for (const key of ['data', 'result', 'rows', 'LINES']) {
      if (key in obj) {
        this.collectOracleRows(obj[key], rows, depth + 1);
      }
    }

    for (const nested of Object.values(obj)) {
      if (typeof nested === 'object') {
        this.collectOracleRows(nested, rows, depth + 1);
      }
    }
  }

  private isOracleDeliveryRow(obj: Record<string, unknown>): boolean {
    return (
      typeof obj.SOURCE_HEADER_ID === 'string' &&
      (obj.CREATE_DELIVERY_STATUS != null ||
        obj.UPDATE_DELIVERY_STATUS != null ||
        obj.PICK_RELEASE_STATUS != null ||
        obj.SHIP_CONFIRM_STATUS != null)
    );
  }

  private normalizeStatus(value?: string | null): string {
    if (typeof value !== 'string') {
      return '';
    }
    return value.trim().toUpperCase();
  }

  private asNumber(value: unknown): number | null {
    if (value == null || value === '') {
      return null;
    }
    const n = typeof value === 'string' ? Number(value) : Number(value);
    return Number.isNaN(n) ? null : n;
  }

  private asString(value: unknown): string | undefined {
    if (value == null) {
      return undefined;
    }
    const s = String(value).trim();
    return s === '' ? undefined : s;
  }

  private asDate(value: unknown): Date | undefined {
    if (value == null || value === '') {
      return undefined;
    }
    const d = new Date(String(value));
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
}
