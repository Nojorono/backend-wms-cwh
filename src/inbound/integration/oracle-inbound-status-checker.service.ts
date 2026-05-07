import { Injectable, Logger } from '@nestjs/common';
import {
  InboundIntegrationService,
  InboundIntegrationHeaderWithLines,
} from 'src/inbound-integration/inbound-integration.service';
import { RcvReceiptTransactionType } from 'src/core/domain/entities/inbound-integration.entity';
import { RcvReceiptIntegrationService } from './rcv-receipt.integration';
import { InboundJobPayload, InboundJobProcessStatus } from './inbound-integration-queue.types';

type CheckResult = {
  status: InboundJobProcessStatus;
  reason: string;
};

@Injectable()
export class OracleInboundStatusCheckerService {
  private readonly logger = new Logger(OracleInboundStatusCheckerService.name);
  private readonly terminalStatuses = new Set(['S', 'E']);
  private readonly successOneCharStatuses = new Set(['S']);
  private readonly errorOneCharStatuses = new Set(['E']);
  private readonly successStatuses = new Set(['SUCCESS', 'COMPLETED', 'NORMAL', 'DONE']);
  private readonly errorStatuses = new Set(['ERROR', 'FAILED', 'CANCELLED', 'TERMINATED']);
  private readonly inProgressStatuses = new Set([
    'PENDING',
    'PROCESSING',
    'RUNNING',
    'IN_PROGRESS',
    'WAITING',
    'STANDBY',
  ]);

  constructor(
    private readonly inboundIntegrationService: InboundIntegrationService,
    private readonly rcvReceiptIntegrationService: RcvReceiptIntegrationService,
  ) { }

  async checkInboundStatus(payload: InboundJobPayload): Promise<CheckResult> {
    const headers = await this.inboundIntegrationService.findAllByInboundAnyStatus(payload.inboundId);
    if (!headers.length) {
      return { status: 'PENDING', reason: 'No inbound integration headers found yet' };
    }

    let hasSuccess = false;
    let hasPending = false;
    let hasError = false;
    let firstErrorReason = '';

    for (const header of headers) {
      const perHeaderResult = await this.checkPerHeader(header, payload.requestId);
      if (perHeaderResult.status === 'ERROR') {
        hasError = true;
        if (!firstErrorReason) {
          firstErrorReason = perHeaderResult.reason;
        }
      }
      if (perHeaderResult.status === 'PENDING') {
        hasPending = true;
      } else if (perHeaderResult.status === 'SUCCESS') {
        hasSuccess = true;
      }
    }

    if (hasError) {
      return {
        status: 'ERROR',
        reason: firstErrorReason || 'One or more Oracle integration headers are in error',
      };
    }
    if (hasPending) {
      return { status: 'PENDING', reason: 'Oracle concurrent request still in progress' };
    }
    if (hasSuccess) {
      return { status: 'SUCCESS', reason: 'All Oracle integration headers are successful' };
    }
    return { status: 'PENDING', reason: 'No terminal status found yet' };
  }

  private async checkPerHeader(
    header: InboundIntegrationHeaderWithLines,
    requestId?: number,
  ): Promise<CheckResult> {
    const sourceHeaderId = header.source_header_id;
    if (!sourceHeaderId) {
      return { status: 'PENDING', reason: `Missing source_header_id for header ${header.id}` };
    }

    const response = await this.rcvReceiptIntegrationService.findBySourceHeaderId(sourceHeaderId);
    this.logger.log(
      `Oracle findBySourceHeaderId response sourceHeaderId=${sourceHeaderId} payload=${this.safeJson(response)}`,
    );
    const successFlag = this.asBoolean((response as Record<string, unknown>).status);
    if (successFlag === false) {
      return { status: 'PENDING', reason: `No Oracle receipt data yet for ${sourceHeaderId}` };
    }

    const data = this.extractOracleHeaderPayload(response, sourceHeaderId);
    if (!data) {
      return { status: 'PENDING', reason: `No receipt payload found for ${sourceHeaderId}` };
    }

    await this.syncOraclePayloadToInboundIntegration(header, data);

    const headerStatusRaw = this.normalizeStatus(data.STATUS);
    const headerStatusSelisihRaw = this.normalizeStatus(data.STATUS_SELISIH);
    const linesRaw = Array.isArray(data.LINES) ? (data.LINES as Record<string, unknown>[]) : [];
    const lineStatuses = linesRaw.map((line) => this.normalizeStatus(line.STATUS));
    const lineStatusSelisih = linesRaw.map((line) => this.normalizeStatus(line.STATUS_SELISIH));

    const allTerminal = this.areAllTerminalStatuses([
      headerStatusRaw,
      headerStatusSelisihRaw,
      ...lineStatuses,
      ...lineStatusSelisih,
    ]);

    if (allTerminal) {
      const hasErrorTerminal = [
        headerStatusRaw,
        headerStatusSelisihRaw,
        ...lineStatuses,
        ...lineStatusSelisih,
      ].some((s) => this.errorOneCharStatuses.has(s));

      if (hasErrorTerminal) {
        const reason = this.firstNonEmptyString(
          data.MESSAGE,
          data.MESSAGE_SELISIH,
          ...linesRaw.map((line) => line.MESSAGE),
          ...linesRaw.map((line) => line.MESSAGE_SELISIH),
          data.IFACE_MESSAGE_IR,
          data.IFACE_MESSAGE_IO,
          data.IFACE_MESSAGE_OI,
        );
        return {
          status: 'ERROR',
          reason: reason || `Oracle terminal status E for ${sourceHeaderId}`,
        };
      }
      return { status: 'SUCCESS', reason: `Oracle terminal status S for ${sourceHeaderId}` };
    }

    const candidateStatuses = [
      data.IFACE_STATUS_IR,
      data.IFACE_STATUS_IO,
      data.IFACE_STATUS_OI,
      data.STATUS,
      data.STATUS_SELISIH,
      data.PHASE_CODE,
      data.DEV_PHASE,
      data.DEV_STATUS,
      data.REQUEST_STATUS,
    ]
      .map((s) => this.normalizeStatus(s))
      .filter(Boolean);

    const reqIdFromData = this.asNumber(
      data.REQUEST_ID ?? data.REQUEST_ID_IR ?? data.REQUEST_ID_IO ?? data.REQUEST_ID_OI,
    );
    if (requestId != null && reqIdFromData != null && requestId !== reqIdFromData) {
      this.logger.warn(
        `requestId mismatch sourceHeaderId=${sourceHeaderId} payloadRequestId=${requestId} oracleRequestId=${reqIdFromData}`,
      );
    }

    if (candidateStatuses.some((s) => this.errorStatuses.has(s))) {
      const reason = this.firstNonEmptyString(
        data.IFACE_MESSAGE_IR,
        data.IFACE_MESSAGE_IO,
        data.IFACE_MESSAGE_OI,
        data.MESSAGE,
        data.MESSAGE_SELISIH,
      );
      return { status: 'ERROR', reason: reason || `Oracle error status for ${sourceHeaderId}` };
    }

    if (candidateStatuses.some((s) => this.inProgressStatuses.has(s))) {
      return { status: 'PENDING', reason: `Oracle request still in progress for ${sourceHeaderId}` };
    }

    if (candidateStatuses.some((s) => this.successStatuses.has(s))) {
      return { status: 'SUCCESS', reason: `Oracle success for ${sourceHeaderId}` };
    }

    return { status: 'PENDING', reason: `Unknown status from Oracle for ${sourceHeaderId}` };
  }

  private normalizeStatus(value: unknown): string {
    if (typeof value !== 'string') {
      return '';
    }
    return value.trim().toUpperCase();
  }

  private areAllTerminalStatuses(statuses: string[]): boolean {
    const nonEmpty = statuses.filter((s) => s !== '');
    if (nonEmpty.length === 0) {
      return false;
    }
    return nonEmpty.every((s) => this.terminalStatuses.has(s));
  }

  private asBoolean(value: unknown): boolean | null {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      if (v === 'true') return true;
      if (v === 'false') return false;
    }
    return null;
  }

  private asNumber(value: unknown): number | null {
    if (value == null || value === '') {
      return null;
    }
    const n = typeof value === 'string' ? Number(value) : Number(value);
    return Number.isNaN(n) ? null : n;
  }

  private firstNonEmptyString(...values: unknown[]): string | null {
    for (const value of values) {
      if (typeof value === 'string' && value.trim() !== '') {
        return value.trim();
      }
    }
    return null;
  }

  private extractOracleHeaderPayload(
    response: Record<string, unknown>,
    sourceHeaderId: string,
  ): Record<string, unknown> | null {
    return this.findHeaderPayloadDeep(response, sourceHeaderId, 0);
  }

  private isHeaderPayload(value: unknown, sourceHeaderId: string): boolean {
    if (typeof value !== 'object' || value == null) {
      return false;
    }
    const obj = value as Record<string, unknown>;
    return (
      typeof obj.SOURCE_HEADER_ID === 'string' &&
      obj.SOURCE_HEADER_ID.trim() === sourceHeaderId
    );
  }

  /**
   * Traverse mixed wrappers (success/message/data arrays/objects) and return the
   * first object that looks like Oracle header payload for the source header id.
   */
  private findHeaderPayloadDeep(
    value: unknown,
    sourceHeaderId: string,
    depth: number,
  ): Record<string, unknown> | null {
    if (depth > 8 || value == null) {
      return null;
    }
    if (this.isHeaderPayload(value, sourceHeaderId)) {
      return value as Record<string, unknown>;
    }
    if (Array.isArray(value)) {
      for (const entry of value) {
        const found = this.findHeaderPayloadDeep(entry, sourceHeaderId, depth + 1);
        if (found) {
          return found;
        }
      }
      return null;
    }
    if (typeof value !== 'object') {
      return null;
    }
    const obj = value as Record<string, unknown>;
    for (const key of ['data', 'result', 'rows']) {
      if (key in obj) {
        const found = this.findHeaderPayloadDeep(obj[key], sourceHeaderId, depth + 1);
        if (found) {
          return found;
        }
      }
    }
    for (const nested of Object.values(obj)) {
      const found = this.findHeaderPayloadDeep(nested, sourceHeaderId, depth + 1);
      if (found) {
        return found;
      }
    }
    return null;
  }

  private async syncOraclePayloadToInboundIntegration(
    header: InboundIntegrationHeaderWithLines,
    oracleHeader: Record<string, unknown>,
  ): Promise<void> {
    const headerUpdate = {
      iface_header_id: this.asNumber(oracleHeader.IFACE_HEADER_ID) ?? undefined,
      transaction_type: this.asTransactionType(oracleHeader.TRANSACTION_TYPE),
      source_system: this.asString(oracleHeader.SOURCE_SYSTEM),
      receipt_source_code: this.asString(oracleHeader.RECEIPT_SOURCE_CODE),
      source_header_id: this.asString(oracleHeader.SOURCE_HEADER_ID),
      do_number: this.asString(oracleHeader.DO_NUMBER),
      vendor_id: this.asNumber(oracleHeader.VENDOR_ID) ?? undefined,
      vendor_site_id: this.asNumber(oracleHeader.VENDOR_SITE_ID) ?? undefined,
      shipment_header_id: this.asNumber(oracleHeader.SHIPMENT_HEADER_ID) ?? undefined,
      org_id: this.asNumber(oracleHeader.ORG_ID) ?? undefined,
      rsh_attribute1: this.asString(oracleHeader.RSH_ATTRIBUTE1),
      rsh_attribute2: this.asString(oracleHeader.RSH_ATTRIBUTE2),
      rsh_attribute3: this.asString(oracleHeader.RSH_ATTRIBUTE3),
      receipt_number: this.asString(oracleHeader.RECEIPT_NUMBER),
      receipt_number_selisih: this.asString(oracleHeader.RECEIPT_NUMBER_SELISIH),
      group_id: this.asNumber(oracleHeader.GROUP_ID) ?? undefined,
      total_lines: this.asNumber(oracleHeader.TOTAL_LINES) ?? undefined,
      header_interface_id: this.asNumber(oracleHeader.HEADER_INTERFACE_ID) ?? undefined,
      request_id: this.asNumber(oracleHeader.REQUEST_ID) ?? undefined,
      status: this.asString(oracleHeader.STATUS),
      message: this.asString(oracleHeader.MESSAGE),
      status_selisih: this.asString(oracleHeader.STATUS_SELISIH),
      message_selisih: this.asString(oracleHeader.MESSAGE_SELISIH),
      created_by: this.asNumber(oracleHeader.CREATED_BY) ?? undefined,
      creation_date: this.asDate(oracleHeader.CREATION_DATE),
      last_updated_by: this.asNumber(oracleHeader.LAST_UPDATED_BY) ?? undefined,
      last_updated_date: this.asDate(oracleHeader.LAST_UPDATED_DATE),
    };
    await this.inboundIntegrationService.updateHeader(header.id, headerUpdate);

    const linesRaw = Array.isArray(oracleHeader.LINES)
      ? (oracleHeader.LINES as Record<string, unknown>[])
      : [];
    const localLinesBySourceLineId = new Map(
      (header.lines ?? [])
        .filter((line) => line.source_line_id)
        .map((line) => [line.source_line_id, line]),
    );

    for (const oracleLine of linesRaw) {
      const sourceLineId = this.asString(oracleLine.SOURCE_LINE_ID);
      if (!sourceLineId) {
        continue;
      }
      const localLine = localLinesBySourceLineId.get(sourceLineId);
      if (!localLine) {
        continue;
      }
      await this.inboundIntegrationService.updateLine(localLine.id, {
        iface_line_id: this.asNumber(oracleLine.IFACE_LINE_ID) ?? undefined,
        iface_header_id: this.asNumber(oracleLine.IFACE_HEADER_ID) ?? undefined,
        source_line_id: sourceLineId,
        source_header_id: this.asString(oracleLine.SOURCE_HEADER_ID),
        po_number: this.asString(oracleLine.PO_NUMBER),
        po_line_number: this.asNumber(oracleLine.PO_LINE_NUMBER) ?? undefined,
        iso_number: this.asString(oracleLine.ISO_NUMBER),
        iso_line_number: this.asNumber(oracleLine.ISO_LINE_NUMBER) ?? undefined,
        inventory_item_id: this.asNumber(oracleLine.INVENTORY_ITEM_ID) ?? undefined,
        uom_code: this.asString(oracleLine.UOM_CODE),
        quantity: this.asNumber(oracleLine.QUANTITY) ?? undefined,
        subinventory: this.asString(oracleLine.SUBINVENTORY),
        locator_id: this.asNumber(oracleLine.LOCATOR_ID) ?? undefined,
        quantity_selisih: this.asNumber(oracleLine.QUANTITY_SELISIH) ?? undefined,
        subinventory_selisih: this.asString(oracleLine.SUBINVENTORY_SELISIH),
        locator_id_selisih: this.asNumber(oracleLine.LOCATOR_ID_SELISIH) ?? undefined,
        shipment_line_id: this.asNumber(oracleLine.SHIPMENT_LINE_ID) ?? undefined,
        interface_transaction_id:
          this.asNumber(oracleLine.INTERFACE_TRANSACTION_ID) ?? undefined,
        status: this.asString(oracleLine.STATUS),
        message: this.asString(oracleLine.MESSAGE),
        status_selisih: this.asString(oracleLine.STATUS_SELISIH),
        message_selisih: this.asString(oracleLine.MESSAGE_SELISIH),
        created_by: this.asNumber(oracleLine.CREATED_BY) ?? undefined,
        creation_date: this.asDate(oracleLine.CREATION_DATE),
        last_updated_by: this.asNumber(oracleLine.LAST_UPDATED_BY) ?? undefined,
        last_updated_date: this.asDate(oracleLine.LAST_UPDATED_DATE),
      });
    }
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

  private asTransactionType(value: unknown): RcvReceiptTransactionType | undefined {
    const asString = this.asString(value);
    if (!asString) {
      return undefined;
    }
    if (Object.values(RcvReceiptTransactionType).includes(asString as RcvReceiptTransactionType)) {
      return asString as RcvReceiptTransactionType;
    }
    return undefined;
  }

  private safeJson(value: unknown): string {
    try {
      const raw = JSON.stringify(value);
      return raw.length > 3000 ? `${raw.slice(0, 3000)}...<truncated>` : raw;
    } catch {
      return '[unserializable]';
    }
  }
}
