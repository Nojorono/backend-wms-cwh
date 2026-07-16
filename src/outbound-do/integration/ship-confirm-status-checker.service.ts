import { Injectable, Logger } from '@nestjs/common';
import { OutboundIntegrationDeliveriesRepository } from '../../outbound-integration-deliveries/outbound-integration-deliveries.repository';
import {
  OutboundIntegrationDeliveries,
  ShipConfirmInternalTransactionType,
} from '../../core/domain/entities/outbound-integration-deliveries.entity';
import { UpdateOutboundIntegrationDeliveriesDto } from '../../outbound-integration-deliveries/dto/update-outbound-integration-deliveries.dto';
import { ShipConfirmIntegrationService } from './ship-confirm.integration';
import { ShipConfirmInternalFindDto } from '../dto/ship-confirm-internal-find.dto';
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
   * Poll Oracle by memo id (`source_header_id` = `outbound_memo_id` for all ship confirm types).
   * outboundDoId is only used to load WMS staging rows for that DO — not sent to Oracle.
   */
  async checkOutboundDoStatus(
    payload: OutboundJobPayload,
    transactionType?: ShipConfirmInternalTransactionType,
  ): Promise<ShipConfirmDoCheckResult> {
    const scopedTransactionType = transactionType ?? payload.transactionType;
    const allDeliveries = await this.deliveriesRepository.findByOutboundDoId(payload.outboundDoId);
    const deliveries = scopedTransactionType
      ? allDeliveries.filter((row) => row.transaction_type === scopedTransactionType)
      : allDeliveries;

    if (!deliveries.length) {
      return {
        status: 'PENDING',
        reason: scopedTransactionType
          ? `No outbound integration deliveries for transaction_type ${scopedTransactionType}`
          : 'No outbound integration deliveries for this outbound DO',
        deliveriesUpdated: 0,
        hasError: false,
      };
    }

    let updatedCount = 0;
    const findGroups = this.groupDeliveriesForFind(deliveries);

    this.logger.log(
      `Ship confirm poll outboundDoId=${payload.outboundDoId} transactionType=${scopedTransactionType ?? 'ALL'} findGroupCount=${findGroups.size} deliveryCount=${deliveries.length}`,
    );

    for (const [, group] of findGroups) {
      const sourceHeaderId = this.resolveMemoSourceHeaderId(group[0]);
      const groupTransactionType = group[0]?.transaction_type;

      if (!sourceHeaderId || !groupTransactionType) {
        this.logger.warn(
          `Skip shipconfirm.find; missing source_header_id or transaction_type outboundDoId=${payload.outboundDoId}`,
        );
        continue;
      }

      try {
        updatedCount += await this.findAndSyncBySourceHeader({
          sourceHeaderId,
          transactionType: groupTransactionType,
          scopeDeliveries: group,
          matchPool: allDeliveries,
        });
      } catch (error) {
        this.logger.warn(
          `shipconfirm.find failed sourceHeaderId=${sourceHeaderId} transactionType=${groupTransactionType}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const refreshedAll = await this.deliveriesRepository.findByOutboundDoId(payload.outboundDoId);
    const refreshed = scopedTransactionType
      ? refreshedAll.filter((row) => row.transaction_type === scopedTransactionType)
      : refreshedAll;
    const result = this.evaluateDeliveries(refreshed);
    return {
      ...result,
      deliveriesUpdated: updatedCount,
    };
  }

  /**
   * Poll Oracle with required source_header_id (memo id) + transaction_type, then sync staging rows.
   */
  async findAndSyncBySourceHeader(input: {
    sourceHeaderId: string;
    transactionType: ShipConfirmInternalTransactionType;
    scopeDeliveries: OutboundIntegrationDeliveries[];
    matchPool?: OutboundIntegrationDeliveries[];
  }): Promise<number> {
    const matchPool = input.matchPool ?? input.scopeDeliveries;
    const isoHeaderId = this.resolveIsoHeaderIdForFind(
      matchPool,
      input.sourceHeaderId,
      input.scopeDeliveries[0],
    );

    const requiresIsoHeaderId =
      input.transactionType !== ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_SHIP_CONFIRM;

    if (requiresIsoHeaderId && isoHeaderId == null) {
      this.logger.warn(
        `Skip shipconfirm.find; missing iso_header_id sourceHeaderId=${input.sourceHeaderId} transactionType=${input.transactionType}`,
      );
      return 0;
    }

    const findPayload = this.buildShipConfirmFindPayload(
      input.sourceHeaderId,
      input.transactionType,
      isoHeaderId,
    );

    this.logger.log(
      `shipconfirm.find source_header_id=${findPayload.source_header_id} transaction_type=${findPayload.transaction_type} iso_header_id=${findPayload.iso_header_id ?? 'N/A'}`,
    );

    const response = await this.shipConfirmIntegrationService.find(findPayload);

    return await this.syncDeliveriesFromOracleResponse(
      input.scopeDeliveries,
      response,
      matchPool,
      input.transactionType,
    );
  }

  async checkStatusBySourceHeader(input: {
    sourceHeaderId: string;
    transactionType: ShipConfirmInternalTransactionType;
    scopeDeliveries: OutboundIntegrationDeliveries[];
    matchPool?: OutboundIntegrationDeliveries[];
  }): Promise<ShipConfirmDoCheckResult> {
    const deliveriesUpdated = await this.findAndSyncBySourceHeader(input);
    const result = this.evaluateDeliveries(input.scopeDeliveries);

    return {
      ...result,
      deliveriesUpdated,
    };
  }

  private buildShipConfirmFindPayload(
    sourceHeaderId: string,
    transactionType: ShipConfirmInternalTransactionType,
    isoHeaderId: number | null,
  ): ShipConfirmInternalFindDto {
    return {
      source_header_id: sourceHeaderId,
      transaction_type: transactionType,
      ...(isoHeaderId != null ? { iso_header_id: isoHeaderId } : {}),
    };
  }

  async syncDeliveriesFromCreateResponse(
    deliveries: OutboundIntegrationDeliveries[],
    response: ShipConfirmInternalResponseDto,
  ): Promise<number> {
    return this.syncDeliveriesFromOracleResponse(deliveries, response, deliveries);
  }

  async syncDeliveriesFromOracleResponse(
    deliveries: OutboundIntegrationDeliveries[],
    response: ShipConfirmInternalResponseDto,
    matchPool?: OutboundIntegrationDeliveries[],
    transactionType?: ShipConfirmInternalTransactionType,
  ): Promise<number> {
    const pool = matchPool ?? deliveries;
    let rows = this.extractOracleRows(response);
    if (!rows.length && pool.length > 0) {
      const findGroups = this.groupDeliveriesForFind(pool);
      for (const [, group] of findGroups) {
        const sourceHeaderId = this.resolveMemoSourceHeaderId(group[0]);
        const groupTransactionType = transactionType ?? group[0]?.transaction_type;
        if (!sourceHeaderId) {
          continue;
        }
        rows.push(
          ...this.findOracleRowsForSourceHeader(
            response,
            sourceHeaderId,
            groupTransactionType,
          ),
        );
      }
    }

    if (transactionType) {
      rows = rows.filter((row) =>
        this.matchesOracleTransactionType(this.normalizeOracleRowKeys(row), transactionType),
      );
    }

    if (!rows.length) {
      this.logger.warn(
        `No Oracle delivery rows extracted from ship confirm response: ${this.safeJson(response)}`,
      );
      return 0;
    }

    let updated = 0;
    for (const row of rows) {
      updated += await this.applyOracleRowToDeliveries(pool, row, deliveries);
    }

    updated += await this.syncUnmatchedScopeDeliveries(deliveries, rows, pool);
    return updated;
  }

  /**
   * Second pass: pair remaining scope rows with Oracle rows by delivery_id / delivery_name
   * when header-level grouping prevented a unique first-pass match.
   */
  private async syncUnmatchedScopeDeliveries(
    updateScope: OutboundIntegrationDeliveries[],
    oracleRows: Record<string, unknown>[],
    matchPool: OutboundIntegrationDeliveries[],
  ): Promise<number> {
    if (!updateScope.length || !oracleRows.length) {
      return 0;
    }

    const refreshedScope = await Promise.all(
      updateScope.map((delivery) => this.deliveriesRepository.findById(delivery.id)),
    );
    const pendingScope = refreshedScope.filter(
      (delivery): delivery is OutboundIntegrationDeliveries =>
        delivery != null && !this.areAllOracleStatusesTerminal(delivery),
    );

    if (!pendingScope.length) {
      return 0;
    }

    let updated = 0;
    const usedOracleKeys = new Set<string>();
    const updatedDeliveryIds = new Set<string>();

    for (const delivery of pendingScope) {
      if (updatedDeliveryIds.has(delivery.id)) {
        continue;
      }

      const oracleRow = oracleRows.find((row) => {
        const key = this.buildOracleRowDedupeKey(row);
        if (usedOracleKeys.has(key)) {
          return false;
        }

        const normalized = this.normalizeOracleRowKeys(row);
        const deliveryId = this.asNumber(normalized.DELIVERY_ID);
        const deliveryName = this.asString(normalized.DELIVERY_NAME);
        const sourceHeaderId = this.asSourceHeaderId(normalized.SOURCE_HEADER_ID);
        const sourceLineId = this.asString(normalized.SOURCE_LINE_ID);

        if (sourceLineId) {
          return (
            delivery.source_line_id === sourceLineId ||
            delivery.outbound_memo_item_id === sourceLineId
          );
        }

        if (deliveryId != null && delivery.delivery_id != null) {
          return Number(delivery.delivery_id) === deliveryId;
        }

        if (deliveryName && delivery.delivery_name?.trim()) {
          return delivery.delivery_name.trim() === deliveryName;
        }

        // Header-level Oracle row: match memo when WMS still has no delivery_id
        if (sourceHeaderId && this.resolveMemoSourceHeaderId(delivery) === sourceHeaderId) {
          return true;
        }

        return false;
      });

      if (!oracleRow) {
        continue;
      }

      const normalized = this.normalizeOracleRowKeys(oracleRow);
      const sourceLineId = this.asString(normalized.SOURCE_LINE_ID);
      const deliveryId = this.asNumber(normalized.DELIVERY_ID);
      const deliveryName = this.asString(normalized.DELIVERY_NAME);
      const isLineOrDeliverySpecific =
        !!sourceLineId ||
        (deliveryId != null &&
          delivery.delivery_id != null &&
          Number(delivery.delivery_id) === deliveryId) ||
        (!!deliveryName &&
          !!delivery.delivery_name?.trim() &&
          delivery.delivery_name.trim() === deliveryName);

      usedOracleKeys.add(this.buildOracleRowDedupeKey(oracleRow));

      if (isLineOrDeliverySpecific) {
        updated += await this.applyOracleRowToDeliveries(matchPool, oracleRow, [delivery]);
        updatedDeliveryIds.add(delivery.id);
        continue;
      }

      // Broadcast header-level statuses to every pending line of the same memo + type
      const memoId = this.resolveMemoSourceHeaderId(delivery);
      const cohort = pendingScope.filter(
        (row) =>
          !updatedDeliveryIds.has(row.id) &&
          this.resolveMemoSourceHeaderId(row) === memoId &&
          row.transaction_type === delivery.transaction_type,
      );
      updated += await this.applyOracleRowToDeliveries(matchPool, oracleRow, cohort);
      for (const row of cohort) {
        updatedDeliveryIds.add(row.id);
      }
    }

    return updated;
  }

  private resolveScopeTransactionType(
    updateScope: OutboundIntegrationDeliveries[],
  ): ShipConfirmInternalTransactionType | undefined {
    const types = new Set(
      updateScope
        .map((delivery) => delivery.transaction_type)
        .filter((type): type is ShipConfirmInternalTransactionType => type != null),
    );

    return types.size === 1 ? [...types][0] : undefined;
  }

  private findOracleRowsForSourceHeader(
    response: ShipConfirmInternalResponseDto,
    sourceHeaderId: string,
    transactionType?: ShipConfirmInternalTransactionType,
  ): Record<string, unknown>[] {
    const rows: Record<string, unknown>[] = [];
    this.collectOracleRowsForHeader(
      response,
      sourceHeaderId,
      rows,
      0,
      undefined,
      transactionType,
    );
    return rows;
  }

  private collectOracleRowsForHeader(
    value: unknown,
    sourceHeaderId: string,
    rows: Record<string, unknown>[],
    depth: number,
    parent?: Record<string, unknown>,
    transactionType?: ShipConfirmInternalTransactionType,
  ): void {
    if (depth > 12 || value == null) {
      return;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        this.collectOracleRowsForHeader(
          entry,
          sourceHeaderId,
          rows,
          depth + 1,
          parent,
          transactionType,
        );
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
        if (
          mergedHeaderId === sourceHeaderId &&
          this.isOracleDeliveryRow(merged) &&
          this.matchesOracleTransactionType(merged, transactionType)
        ) {
          rows.push(merged);
        }
      }
    }

    if (
      rowHeaderId === sourceHeaderId &&
      this.isOracleDeliveryRow(headerContext) &&
      this.matchesOracleTransactionType(headerContext, transactionType)
    ) {
      const headerRow = { ...headerContext };
      delete headerRow.LINES;
      rows.push(headerRow);
    }

    const obj = value as Record<string, unknown>;
    for (const key of ['data', 'result', 'rows', 'LINES']) {
      if (key in obj) {
        this.collectOracleRowsForHeader(
          obj[key],
          sourceHeaderId,
          rows,
          depth + 1,
          headerContext,
          transactionType,
        );
      }
    }

    for (const nested of Object.values(obj)) {
      if (nested != null && typeof nested === 'object' && !Array.isArray(nested)) {
        this.collectOracleRowsForHeader(
          nested,
          sourceHeaderId,
          rows,
          depth + 1,
          headerContext,
          transactionType,
        );
      }
    }
  }

  private matchesOracleTransactionType(
    row: Record<string, unknown>,
    transactionType?: ShipConfirmInternalTransactionType,
  ): boolean {
    if (!transactionType) {
      return true;
    }

    const rowTransactionType = this.asString(row.TRANSACTION_TYPE);
    if (!rowTransactionType) {
      return true;
    }

    return rowTransactionType === transactionType;
  }

  private async applyOracleRowToDeliveries(
    matchPool: OutboundIntegrationDeliveries[],
    oracleRow: Record<string, unknown>,
    updateScope: OutboundIntegrationDeliveries[] = matchPool,
  ): Promise<number> {
    const normalized = this.normalizeOracleRowKeys(oracleRow);
    const patch = this.mapOracleRowToStatusPatch(normalized);
    if (Object.keys(patch).length === 0) {
      return 0;
    }

    const sourceHeaderId = this.asSourceHeaderId(normalized.SOURCE_HEADER_ID);
    const deliveryId = this.asNumber(normalized.DELIVERY_ID);
    const deliveryName = this.asString(normalized.DELIVERY_NAME);

    const matched = this.resolveDeliveryMatchTargets(
      matchPool,
      sourceHeaderId,
      {
        sourceLineId: this.asString(normalized.SOURCE_LINE_ID),
        isoLineId: this.asNumber(normalized.ISO_LINE_ID),
        isoInventoryItemId: this.asNumber(normalized.ISO_INVENTORY_ITEM_ID),
        deliveryId,
        deliveryName,
        shipConfirmRequestId: this.asNumber(normalized.SHIP_CONFIRM_REQUEST_ID),
        pickReleaseRequestId: this.asNumber(normalized.PICK_RELEASE_REQUEST_ID),
      },
      this.resolveScopeTransactionType(updateScope),
    );

    const scopeIds = new Set(updateScope.map((delivery) => delivery.id));
    const targets = matched.filter((delivery) => scopeIds.has(delivery.id));

    if (!targets.length) {
      this.logger.warn(
        `No delivery rows matched Oracle row sourceHeaderId=${sourceHeaderId ?? 'N/A'} deliveryId=${deliveryId ?? 'N/A'} deliveryName=${deliveryName ?? 'N/A'} sourceLineId=${this.asString(normalized.SOURCE_LINE_ID) ?? 'N/A'}`,
      );
      return 0;
    }

    let updated = 0;
    for (const delivery of targets) {
      const scopedPatch = this.filterOraclePatchForTransactionType(
        delivery.transaction_type,
        patch,
      );
      if (Object.keys(scopedPatch).length === 0) {
        continue;
      }
      await this.deliveriesRepository.update(delivery.id, scopedPatch);
      updated += 1;
    }

    return updated;
  }

  private filterOraclePatchForTransactionType(
    transactionType: ShipConfirmInternalTransactionType | null | undefined,
    patch: UpdateOutboundIntegrationDeliveriesDto,
  ): UpdateOutboundIntegrationDeliveriesDto {
    const sharedKeys = new Set([
      'iface_id',
      'delivery_id',
      'delivery_name',
      'creation_date',
      'last_updated_date',
    ]);

    const allowedKeys = new Set<string>([...sharedKeys]);

    switch (transactionType) {
      case ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_PICK_RELEASE:
        allowedKeys.add('pick_release_request_id');
        allowedKeys.add('create_delivery_status');
        allowedKeys.add('create_delivery_message');
        allowedKeys.add('update_delivery_status');
        allowedKeys.add('update_delivery_message');
        allowedKeys.add('pick_release_status');
        allowedKeys.add('pick_release_message');
        break;
      case ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_SHIP_CONFIRM:
        allowedKeys.add('ship_confirm_request_id');
        allowedKeys.add('ship_confirm_status');
        allowedKeys.add('ship_confirm_message');
        break;
      case ShipConfirmInternalTransactionType.OUTBOUND_GS_MUTASI_SO_INTERNAL:
      default:
        return patch;
    }

    const scoped: UpdateOutboundIntegrationDeliveriesDto = {};
    for (const [key, value] of Object.entries(patch)) {
      if (allowedKeys.has(key)) {
        (scoped as Record<string, unknown>)[key] = value;
      }
    }
    return scoped;
  }

  /**
   * All ship confirm types use memo id as Oracle SOURCE_HEADER_ID.
   * Prefer outbound_memo_id; fall back to stored source_header_id for legacy rows.
   */
  private resolveMemoSourceHeaderId(
    delivery?: OutboundIntegrationDeliveries | null,
  ): string | undefined {
    if (!delivery) {
      return undefined;
    }

    const memoId = delivery.outbound_memo_id?.trim();
    if (memoId) {
      return memoId;
    }

    return this.asSourceHeaderId(delivery.source_header_id);
  }

  /**
   * Match Oracle rows to WMS staging by memo id, delivery id/name, line, or inventory item.
   * Subdist ship confirm Oracle rows often omit SOURCE_HEADER_ID and use DELIVERY_ID instead.
   */
  private resolveDeliveryMatchTargets(
    deliveries: OutboundIntegrationDeliveries[],
    sourceHeaderId: string | undefined,
    criteria: {
      sourceLineId?: string;
      isoLineId?: number | null;
      isoInventoryItemId?: number | null;
      deliveryId?: number | null;
      deliveryName?: string;
      shipConfirmRequestId?: number | null;
      pickReleaseRequestId?: number | null;
    } = {},
    transactionType?: ShipConfirmInternalTransactionType,
  ): OutboundIntegrationDeliveries[] {
    const {
      sourceLineId,
      isoLineId,
      isoInventoryItemId,
      deliveryId,
      deliveryName,
      shipConfirmRequestId,
      pickReleaseRequestId,
    } = criteria;

    let candidates = deliveries;

    if (transactionType) {
      const typed = candidates.filter((delivery) => delivery.transaction_type === transactionType);
      if (typed.length) {
        candidates = typed;
      }
    }

    if (sourceHeaderId) {
      const headerMatches = candidates.filter(
        (delivery) => this.resolveMemoSourceHeaderId(delivery) === sourceHeaderId,
      );
      if (headerMatches.length) {
        candidates = headerMatches;
      }
    }

    if (deliveryId != null) {
      const deliveryMatches = candidates.filter(
        (delivery) => delivery.delivery_id != null && Number(delivery.delivery_id) === deliveryId,
      );
      if (deliveryMatches.length === 1) {
        return deliveryMatches;
      }
      if (deliveryMatches.length > 1 && transactionType) {
        const typedMatches = deliveryMatches.filter(
          (delivery) => delivery.transaction_type === transactionType,
        );
        if (typedMatches.length === 1) {
          return typedMatches;
        }
        if (typedMatches.length > 1) {
          return typedMatches;
        }
      }
      if (deliveryMatches.length) {
        return deliveryMatches;
      }

      // Oracle whs_deliveries already has DELIVERY_ID, but WMS staging may still be null
      // after create. Broadcast later so delivery_id + statuses are written.
    }

    if (deliveryName) {
      const nameMatches = candidates.filter(
        (delivery) => (delivery.delivery_name ?? '').trim() === deliveryName,
      );
      if (nameMatches.length === 1) {
        return nameMatches;
      }
      if (nameMatches.length > 1 && transactionType) {
        const typedMatches = nameMatches.filter(
          (delivery) => delivery.transaction_type === transactionType,
        );
        if (typedMatches.length) {
          return typedMatches;
        }
      }
      if (nameMatches.length) {
        return nameMatches;
      }
    }

    if (shipConfirmRequestId != null) {
      const requestMatches = candidates.filter(
        (delivery) =>
          delivery.ship_confirm_request_id != null &&
          Number(delivery.ship_confirm_request_id) === shipConfirmRequestId,
      );
      if (requestMatches.length) {
        return requestMatches;
      }
    }

    if (pickReleaseRequestId != null) {
      const requestMatches = candidates.filter(
        (delivery) =>
          delivery.pick_release_request_id != null &&
          Number(delivery.pick_release_request_id) === pickReleaseRequestId,
      );
      if (requestMatches.length) {
        return requestMatches;
      }
    }

    if (sourceLineId) {
      const lineMatches = candidates.filter(
        (delivery) =>
          delivery.source_line_id === sourceLineId ||
          delivery.outbound_memo_item_id === sourceLineId,
      );
      if (lineMatches.length) {
        return lineMatches;
      }
    }

    if (isoLineId != null) {
      const isoLineMatches = candidates.filter(
        (delivery) => delivery.iso_line_id != null && Number(delivery.iso_line_id) === isoLineId,
      );
      if (isoLineMatches.length) {
        return isoLineMatches;
      }
    }

    if (isoInventoryItemId != null) {
      const inventoryMatches = candidates.filter(
        (delivery) =>
          delivery.iso_inventory_item_id != null &&
          Number(delivery.iso_inventory_item_id) === isoInventoryItemId,
      );
      if (inventoryMatches.length) {
        return inventoryMatches;
      }
    }

    if (candidates.length === 1) {
      return candidates;
    }

    // Header-level Oracle row (common from whs_deliveries find): no unique line identity.
    // Apply statuses / delivery_id to every staging row for this memo + transaction type.
    const hasLineIdentity =
      !!sourceLineId || isoLineId != null || isoInventoryItemId != null;
    if (!hasLineIdentity && candidates.length > 0 && (sourceHeaderId || transactionType)) {
      return candidates;
    }

    return [];
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

  private groupDeliveriesForFind(
    deliveries: OutboundIntegrationDeliveries[],
  ): Map<string, OutboundIntegrationDeliveries[]> {
    const map = new Map<string, OutboundIntegrationDeliveries[]>();
    for (const delivery of deliveries) {
      const memoSourceHeaderId = this.resolveMemoSourceHeaderId(delivery);
      if (!memoSourceHeaderId) {
        continue;
      }

      const key = `${memoSourceHeaderId}|${delivery.transaction_type ?? 'unknown'}`;
      const list = map.get(key) ?? [];
      list.push(delivery);
      map.set(key, list);
    }
    return map;
  }

  private resolveIsoHeaderIdForFind(
    deliveries: OutboundIntegrationDeliveries[],
    sourceHeaderId: string,
    delivery: OutboundIntegrationDeliveries | undefined,
  ): number | null {
    if (delivery?.iso_header_id != null) {
      return Number(delivery.iso_header_id);
    }

    const siblingWithIso = deliveries.find(
      (row) =>
        this.resolveMemoSourceHeaderId(row) === sourceHeaderId && row.iso_header_id != null,
    );

    return siblingWithIso?.iso_header_id != null ? Number(siblingWithIso.iso_header_id) : null;
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
      const key = this.buildOracleRowDedupeKey(normalized);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      unique.push(normalized);
    }
    return unique;
  }

  private buildOracleRowDedupeKey(row: Record<string, unknown>): string {
    const identityParts = [
      this.asNumber(row.DELIVERY_ID),
      this.asString(row.DELIVERY_NAME),
      this.asSourceHeaderId(row.SOURCE_HEADER_ID),
      this.asString(row.SOURCE_LINE_ID),
      this.asNumber(row.ISO_LINE_ID),
      this.asNumber(row.ISO_INVENTORY_ITEM_ID),
      this.asNumber(row.SHIP_CONFIRM_REQUEST_ID),
      this.asNumber(row.PICK_RELEASE_REQUEST_ID),
      this.asNumber(row.IFACE_ID),
    ].map((value) => (value == null ? '' : String(value)));

    if (identityParts.some((part) => part !== '')) {
      return identityParts.join('|');
    }

    return [
      ...identityParts,
      this.normalizeOracleDeliveryStatus(row.PICK_RELEASE_STATUS) ?? '',
      this.normalizeOracleDeliveryStatus(row.CREATE_DELIVERY_STATUS) ?? '',
      this.normalizeOracleDeliveryStatus(row.UPDATE_DELIVERY_STATUS) ?? '',
      this.normalizeOracleDeliveryStatus(row.SHIP_CONFIRM_STATUS) ?? '',
    ].join('|');
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

    const hasIdentifier =
      this.asSourceHeaderId(normalized.SOURCE_HEADER_ID) != null ||
      this.asNumber(normalized.DELIVERY_ID) != null ||
      !!this.asString(normalized.DELIVERY_NAME);

    if (!hasIdentifier) {
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
      normalized.SHIP_CONFIRM_MESSAGE != null ||
      normalized.SHIP_CONFIRM_REQUEST_ID != null ||
      normalized.PICK_RELEASE_REQUEST_ID != null
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
