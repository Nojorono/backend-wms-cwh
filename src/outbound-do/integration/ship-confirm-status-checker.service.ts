import { Injectable, Logger } from '@nestjs/common';
import { OutboundIntegrationDeliveriesRepository } from '../../outbound-integration-deliveries/outbound-integration-deliveries.repository';
import {
  OutboundIntegrationDeliveries,
  ShipConfirmInternalTransactionType,
} from '../../core/domain/entities/outbound-integration-deliveries.entity';
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

/** PICK_RELEASE: steps 1–3 must reach S or E. */
export const ORACLE_PICK_RELEASE_STATUS_FIELDS: readonly OracleDeliveryStatusField[] = [
  'create_delivery_status',
  'update_delivery_status',
  'pick_release_status',
];

/** SHIP_CONFIRM_SUBDIST: only ship_confirm_status must reach S or E. */
export const ORACLE_SHIP_CONFIRM_SUBDIST_STATUS_FIELDS: readonly OracleDeliveryStatusField[] = [
  'ship_confirm_status',
];

@Injectable()
export class ShipConfirmStatusCheckerService {
  private readonly logger = new Logger(ShipConfirmStatusCheckerService.name);
  private readonly terminalStatuses = new Set(['S', 'E']);

  constructor(
    private readonly deliveriesRepository: OutboundIntegrationDeliveriesRepository,
    private readonly shipConfirmIntegrationService: ShipConfirmIntegrationService,
  ) { }

  /** U = Unprocessed; terminal only when S or E. */
  isOracleStatusTerminal(value?: string | null): boolean {
    const normalized = this.normalizeStatus(value);
    return normalized === 'S' || normalized === 'E';
  }

  areAllOracleStatusesTerminal(delivery: OutboundIntegrationDeliveries): boolean {
    const requiredFields = this.getRequiredOracleStatusFields(delivery.transaction_type);
    return requiredFields.every((field) => this.isOracleStatusTerminal(delivery[field]));
  }

  /** Which Oracle iface fields must reach S or E — depends on transaction type. */
  getRequiredOracleStatusFields(
    transactionType?: ShipConfirmInternalTransactionType | null,
  ): OracleDeliveryStatusField[] {
    switch (transactionType) {
      case ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_PICK_RELEASE:
        return [...ORACLE_PICK_RELEASE_STATUS_FIELDS];
      case ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_SHIP_CONFIRM:
        return [...ORACLE_SHIP_CONFIRM_SUBDIST_STATUS_FIELDS];
      case ShipConfirmInternalTransactionType.OUTBOUND_GS_MUTASI_SO_INTERNAL:
      default:
        return [...ORACLE_DELIVERY_STATUS_FIELDS];
    }
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
      this.getRequiredOracleStatusFields(d.transaction_type).some(
        (field) => this.normalizeStatus(d[field]) === 'E',
      ),
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

  /**
   * Poll Oracle by each delivery row's source_header_id (memo.id for internal & subdist pick release).
   * outboundDoId is only used to load WMS staging rows for that DO — not sent to Oracle.
   */
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

    this.logger.log(
      `Ship confirm poll outboundDoId=${payload.outboundDoId} sourceHeaderCount=${headers.size} deliveryCount=${deliveries.length}`,
    );

    for (const [sourceHeaderId, group] of headers) {
      const isoHeaderId = group[0]?.iso_header_id;
      if (isoHeaderId == null) {
        this.logger.warn(
          `Skip shipconfirm.find; missing iso_header_id sourceHeaderId=${sourceHeaderId} outboundDoId=${payload.outboundDoId}`,
        );
        continue;
      }

      try {
        this.logger.log(
          `shipconfirm.find source_header_id=${sourceHeaderId} iso_header_id=${isoHeaderId} transactionType=${group[0]?.transaction_type ?? 'N/A'}`,
        );
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
    let rows = this.extractOracleRows(response);
    if (!rows.length && deliveries.length > 0) {
      const sourceHeaderIds = [
        ...new Set(
          deliveries
            .map((d) => d.source_header_id)
            .filter((id): id is string => typeof id === 'string' && id.trim() !== ''),
        ),
      ];
      for (const sourceHeaderId of sourceHeaderIds) {
        rows.push(...this.findOracleRowsForSourceHeader(response, sourceHeaderId));
      }
    }

    if (!rows.length) {
      this.logger.warn(
        `No Oracle delivery rows extracted from ship confirm response: ${this.safeJson(response)}`,
      );
      return 0;
    }

    let updated = 0;
    for (const row of rows) {
      updated += await this.applyOracleRowToDeliveries(deliveries, row);
    }
    return updated;
  }

  private findOracleRowsForSourceHeader(
    response: ShipConfirmInternalResponseDto,
    sourceHeaderId: string,
  ): Record<string, unknown>[] {
    const rows: Record<string, unknown>[] = [];
    this.collectOracleRowsForHeader(response, sourceHeaderId, rows, 0, undefined);
    return rows;
  }

  private collectOracleRowsForHeader(
    value: unknown,
    sourceHeaderId: string,
    rows: Record<string, unknown>[],
    depth: number,
    parent?: Record<string, unknown>,
  ): void {
    if (depth > 12 || value == null) {
      return;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        this.collectOracleRowsForHeader(entry, sourceHeaderId, rows, depth + 1, parent);
      }
      return;
    }

    if (typeof value !== 'object') {
      return;
    }

    const normalized = this.normalizeOracleRowKeys(value as Record<string, unknown>);
    const headerContext =
      parent && normalized.SOURCE_HEADER_ID == null
        ? { ...this.normalizeOracleRowKeys(parent), ...normalized }
        : normalized;

    const rowHeaderId = this.asSourceHeaderId(headerContext.SOURCE_HEADER_ID);
    const lines = headerContext.LINES;

    if (Array.isArray(lines)) {
      const parentForLines = { ...headerContext };
      delete parentForLines.LINES;
      for (const line of lines) {
        if (line == null || typeof line !== 'object') {
          continue;
        }
        const merged = {
          ...parentForLines,
          ...this.normalizeOracleRowKeys(line as Record<string, unknown>),
        };
        if (merged.SOURCE_HEADER_ID == null) {
          merged.SOURCE_HEADER_ID = parentForLines.SOURCE_HEADER_ID;
        }
        const mergedHeaderId = this.asSourceHeaderId(merged.SOURCE_HEADER_ID);
        if (mergedHeaderId === sourceHeaderId && this.isOracleDeliveryRow(merged)) {
          rows.push(merged);
        }
      }
    }

    if (rowHeaderId === sourceHeaderId && this.isOracleDeliveryRow(headerContext)) {
      const headerRow = { ...headerContext };
      delete headerRow.LINES;
      rows.push(headerRow);
    }

    const obj = value as Record<string, unknown>;
    for (const key of ['data', 'result', 'rows', 'LINES']) {
      if (key in obj) {
        this.collectOracleRowsForHeader(obj[key], sourceHeaderId, rows, depth + 1, headerContext);
      }
    }

    for (const nested of Object.values(obj)) {
      if (nested != null && typeof nested === 'object' && !Array.isArray(nested)) {
        this.collectOracleRowsForHeader(nested, sourceHeaderId, rows, depth + 1, headerContext);
      }
    }
  }

  private async applyOracleRowToDeliveries(
    deliveries: OutboundIntegrationDeliveries[],
    oracleRow: Record<string, unknown>,
  ): Promise<number> {
    const normalized = this.normalizeOracleRowKeys(oracleRow);
    const patch = this.mapOracleRowToStatusPatch(normalized);
    if (Object.keys(patch).length === 0) {
      return 0;
    }

    const sourceHeaderId = this.asSourceHeaderId(normalized.SOURCE_HEADER_ID);
    if (!sourceHeaderId) {
      return 0;
    }

    const sourceLineId = this.asString(normalized.SOURCE_LINE_ID);
    const isoInventoryItemId = this.asNumber(normalized.ISO_INVENTORY_ITEM_ID);

    const targets = this.resolveDeliveryMatchTargets(
      deliveries,
      sourceHeaderId,
      sourceLineId,
      isoInventoryItemId,
    );

    if (!targets.length) {
      this.logger.warn(
        `No delivery rows matched Oracle row sourceHeaderId=${sourceHeaderId} sourceLineId=${sourceLineId ?? 'N/A'} isoInventoryItemId=${isoInventoryItemId ?? 'N/A'}`,
      );
      return 0;
    }

    for (const delivery of targets) {
      await this.deliveriesRepository.update(delivery.id, patch);
    }

    return targets.length;
  }

  /**
   * Subdist pick release: source_header_id = memo.id (multiple delivery rows per memo).
   * Match Oracle rows by SOURCE_LINE_ID / item id, or ISO_INVENTORY_ITEM_ID when present.
   */
  private resolveDeliveryMatchTargets(
    deliveries: OutboundIntegrationDeliveries[],
    sourceHeaderId: string,
    sourceLineId?: string,
    isoInventoryItemId?: number | null,
  ): OutboundIntegrationDeliveries[] {
    const headerMatches = deliveries.filter(
      (delivery) => this.asSourceHeaderId(delivery.source_header_id) === sourceHeaderId,
    );

    if (!headerMatches.length) {
      return [];
    }

    if (headerMatches.length === 1) {
      return headerMatches;
    }

    if (sourceLineId) {
      const lineMatches = headerMatches.filter(
        (delivery) =>
          delivery.source_line_id === sourceLineId ||
          delivery.outbound_memo_item_id === sourceLineId,
      );
      if (lineMatches.length) {
        return lineMatches;
      }
    }

    if (isoInventoryItemId != null) {
      const inventoryMatches = headerMatches.filter(
        (delivery) =>
          delivery.iso_inventory_item_id != null &&
          Number(delivery.iso_inventory_item_id) === isoInventoryItemId,
      );
      if (inventoryMatches.length) {
        return inventoryMatches;
      }
    }

    return headerMatches;
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

    const isStatusField =
      key === 'create_delivery_status' ||
      key === 'update_delivery_status' ||
      key === 'pick_release_status' ||
      key === 'ship_confirm_status';

    const normalizedValue = isStatusField
      ? this.normalizeOracleDeliveryStatus(value)
      : this.asString(value);

    if (normalizedValue !== undefined) {
      (patch as Record<string, unknown>)[key] = normalizedValue;
    }
  }

  private normalizeOracleDeliveryStatus(value: unknown): string | undefined {
    const raw = this.asString(value);
    if (!raw) {
      return undefined;
    }
    const upper = raw.toUpperCase();
    if (upper === 'E' || upper === 'ERROR' || upper === 'FAILED') {
      return 'E';
    }
    if (upper === 'S' || upper === 'SUCCESS' || upper === 'COMPLETED' || upper === 'DONE') {
      return 'S';
    }
    if (upper === 'U' || upper === 'UNPROCESSED' || upper === 'PENDING' || upper === 'PROCESSING') {
      return 'U';
    }
    return upper.length === 1 ? upper : raw;
  }

  private normalizeOracleRowKeys(row: Record<string, unknown>): Record<string, unknown> {
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[key.toUpperCase()] = value;
    }
    return normalized;
  }

  private asSourceHeaderId(value: unknown): string | undefined {
    if (value == null) {
      return undefined;
    }
    const s = String(value).trim();
    return s === '' ? undefined : s;
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
    const responseObj = response as Record<string, unknown>;
    if (responseObj.data != null) {
      this.collectOracleRows(responseObj.data, rows, 0, undefined);
    }
    this.collectOracleRows(response, rows, 0, undefined);
    return this.dedupeOracleRows(rows);
  }

  private dedupeOracleRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    const seen = new Set<string>();
    const unique: Record<string, unknown>[] = [];
    for (const row of rows) {
      const normalized = this.normalizeOracleRowKeys(row);
      const key = [
        this.asSourceHeaderId(normalized.SOURCE_HEADER_ID) ?? '',
        this.asString(normalized.SOURCE_LINE_ID) ?? '',
        this.asNumber(normalized.ISO_INVENTORY_ITEM_ID) ?? '',
        this.normalizeOracleDeliveryStatus(normalized.PICK_RELEASE_STATUS) ?? '',
        this.normalizeOracleDeliveryStatus(normalized.CREATE_DELIVERY_STATUS) ?? '',
        this.normalizeOracleDeliveryStatus(normalized.UPDATE_DELIVERY_STATUS) ?? '',
        this.normalizeOracleDeliveryStatus(normalized.SHIP_CONFIRM_STATUS) ?? '',
      ].join('|');
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      unique.push(normalized);
    }
    return unique;
  }

  private collectOracleRows(
    value: unknown,
    rows: Record<string, unknown>[],
    depth: number,
    parent?: Record<string, unknown>,
  ): void {
    if (depth > 12 || value == null) {
      return;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        this.collectOracleRows(entry, rows, depth + 1, parent);
      }
      return;
    }

    if (typeof value !== 'object') {
      return;
    }

    const normalized = this.normalizeOracleRowKeys(value as Record<string, unknown>);
    const headerContext =
      parent && normalized.SOURCE_HEADER_ID == null
        ? { ...this.normalizeOracleRowKeys(parent), ...normalized }
        : normalized;

    const lines = headerContext.LINES;
    if (Array.isArray(lines)) {
      const parentForLines = { ...headerContext };
      delete parentForLines.LINES;
      for (const line of lines) {
        if (line == null || typeof line !== 'object') {
          continue;
        }
        const merged = {
          ...parentForLines,
          ...this.normalizeOracleRowKeys(line as Record<string, unknown>),
        };
        if (merged.SOURCE_HEADER_ID == null) {
          merged.SOURCE_HEADER_ID = parentForLines.SOURCE_HEADER_ID;
        }
        if (this.isOracleDeliveryRow(merged)) {
          rows.push(merged);
        }
      }
    }

    if (this.isOracleDeliveryRow(headerContext)) {
      const headerRow = { ...headerContext };
      delete headerRow.LINES;
      rows.push(headerRow);
    }

    const obj = value as Record<string, unknown>;
    for (const key of ['data', 'result', 'rows']) {
      if (key in obj) {
        this.collectOracleRows(obj[key], rows, depth + 1, headerContext);
      }
    }

    for (const nested of Object.values(obj)) {
      if (nested != null && typeof nested === 'object') {
        this.collectOracleRows(nested, rows, depth + 1, headerContext);
      }
    }
  }

  private isOracleDeliveryRow(obj: Record<string, unknown>): boolean {
    const normalized = this.normalizeOracleRowKeys(obj);
    if (!this.asSourceHeaderId(normalized.SOURCE_HEADER_ID)) {
      return false;
    }

    return (
      normalized.CREATE_DELIVERY_STATUS != null ||
      normalized.UPDATE_DELIVERY_STATUS != null ||
      normalized.PICK_RELEASE_STATUS != null ||
      normalized.SHIP_CONFIRM_STATUS != null ||
      normalized.CREATE_DELIVERY_MESSAGE != null ||
      normalized.UPDATE_DELIVERY_MESSAGE != null ||
      normalized.PICK_RELEASE_MESSAGE != null ||
      normalized.SHIP_CONFIRM_MESSAGE != null
    );
  }

  private safeJson(value: unknown): string {
    try {
      const raw = JSON.stringify(value);
      return raw.length > 3000 ? `${raw.slice(0, 3000)}...<truncated>` : raw;
    } catch {
      return '[unserializable]';
    }
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
