import { Injectable, Logger } from '@nestjs/common';
import {
  OutboundIntegrationIrReqService,
  OutboundIntegrationIrReqHeaderWithLines,
} from 'src/outbound-integration-ir-req/outbound-integration-ir-req.service';
import { IrRequestIntegrationService } from './ir-request.integration';
import { OutboundJobPayload, OutboundJobProcessStatus } from './outbound-integration-queue.types';

type CheckResult = {
  status: OutboundJobProcessStatus;
  reason: string;
};

@Injectable()
export class PoInternalReqStatusCheckerService {
  private readonly logger = new Logger(PoInternalReqStatusCheckerService.name);
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
    private readonly outboundIntegrationIrReqService: OutboundIntegrationIrReqService,
    private readonly irRequestIntegrationService: IrRequestIntegrationService,
  ) {}

  async checkOutboundDoStatus(payload: OutboundJobPayload): Promise<CheckResult> {
    const headers =
      (await this.outboundIntegrationIrReqService.findAllByOutboundDoId(payload.outboundDoId)) ?? [];
    if (!headers.length) {
      return { status: 'PENDING', reason: 'No outbound integration IR req headers found yet' };
    }

    let hasSuccess = false;
    let hasPending = false;
    let hasError = false;
    let firstErrorReason = '';

    for (const header of headers) {
      const perHeaderResult = await this.checkPerHeader(header);
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
        reason: firstErrorReason || 'One or more PO internal requisition headers are in error',
      };
    }
    if (hasPending) {
      return { status: 'PENDING', reason: 'PO internal requisition still in progress' };
    }
    if (hasSuccess) {
      return { status: 'SUCCESS', reason: 'All PO internal requisition headers are successful' };
    }
    return { status: 'PENDING', reason: 'No terminal status found yet' };
  }

  private async checkPerHeader(header: OutboundIntegrationIrReqHeaderWithLines): Promise<CheckResult> {
    const sourceHeaderId = header.source_header_id;
    if (!sourceHeaderId) {
      return { status: 'PENDING', reason: `Missing source_header_id for header ${header.id}` };
    }

    const response = await this.irRequestIntegrationService.findBySourceHeaderId(sourceHeaderId);
    this.logger.log(
      `PO findBySourceHeaderId response sourceHeaderId=${sourceHeaderId} payload=${this.safeJson(response)}`,
    );

    const successFlag = this.asBoolean((response as Record<string, unknown>).status);
    if (successFlag === false) {
      return { status: 'PENDING', reason: `No PO internal req data yet for ${sourceHeaderId}` };
    }

    const data = this.extractPoHeaderPayload(response, sourceHeaderId);
    if (!data) {
      return { status: 'PENDING', reason: `No PO internal req payload found for ${sourceHeaderId}` };
    }

    await this.syncPoPayloadToOutboundIntegration(header, data);

    const ifaceStatuses = [
      data.IFACE_STATUS_IR,
      data.IFACE_STATUS_IO,
      data.IFACE_STATUS_OI,
    ]
      .map((s) => this.normalizeStatus(s))
      .filter(Boolean);

    const linesRaw = Array.isArray(data.LINES) ? (data.LINES as Record<string, unknown>[]) : [];
    const lineStatuses = linesRaw.map((line) => this.normalizeStatus(line.IFACE_LINE_STATUS_IR));

    const allTerminal = this.areAllTerminalStatuses([...ifaceStatuses, ...lineStatuses]);
    if (allTerminal) {
      const hasErrorTerminal = [...ifaceStatuses, ...lineStatuses].some((s) =>
        this.errorOneCharStatuses.has(s),
      );
      if (hasErrorTerminal) {
        const reason = this.firstNonEmptyString(
          data.IFACE_MESSAGE_IR,
          data.IFACE_MESSAGE_IO,
          data.IFACE_MESSAGE_OI,
          ...linesRaw.map((line) => line.IFACE_LINE_MESSAGE_IR),
        );
        return {
          status: 'ERROR',
          reason: reason || `PO terminal status E for ${sourceHeaderId}`,
        };
      }
      return { status: 'SUCCESS', reason: `PO terminal status S for ${sourceHeaderId}` };
    }

    if (ifaceStatuses.some((s) => this.errorStatuses.has(s))) {
      const reason = this.firstNonEmptyString(
        data.IFACE_MESSAGE_IR,
        data.IFACE_MESSAGE_IO,
        data.IFACE_MESSAGE_OI,
      );
      return { status: 'ERROR', reason: reason || `PO error status for ${sourceHeaderId}` };
    }

    if (ifaceStatuses.some((s) => this.inProgressStatuses.has(s))) {
      return { status: 'PENDING', reason: `PO request still in progress for ${sourceHeaderId}` };
    }

    if (ifaceStatuses.some((s) => this.successStatuses.has(s))) {
      return { status: 'SUCCESS', reason: `PO success for ${sourceHeaderId}` };
    }

    return { status: 'PENDING', reason: `Unknown status from PO internal req for ${sourceHeaderId}` };
  }

  private async syncPoPayloadToOutboundIntegration(
    header: OutboundIntegrationIrReqHeaderWithLines,
    poHeader: Record<string, unknown>,
  ): Promise<void> {
    await this.outboundIntegrationIrReqService.updateHeader(header.id, {
      iface_header_id: this.asNumber(poHeader.IFACE_HEADER_ID) ?? undefined,
      transaction_type: this.asString(poHeader.TRANSACTION_TYPE),
      source_code: this.asString(poHeader.SOURCE_CODE),
      source_header_id: this.asString(poHeader.SOURCE_HEADER_ID),
      need_by_date: this.asDate(poHeader.NEED_BY_DATE),
      preparer_number: this.asString(poHeader.PREPARER_NUMBER),
      preparer_id: this.asString(poHeader.PREPARER_ID),
      requestor_number: this.asString(poHeader.REQUESTOR_NUMBER),
      requestor_id: this.asString(poHeader.REQUESTOR_ID),
      org_name: this.asString(poHeader.ORG_NAME),
      org_id: this.asNumber(poHeader.ORG_ID) ?? undefined,
      io_source_name: this.asString(poHeader.IO_SOURCE_NAME),
      io_source_id: this.asNumber(poHeader.IO_SOURCE_ID) ?? undefined,
      io_dest_name: this.asString(poHeader.IO_DEST_NAME),
      io_dest_id: this.asNumber(poHeader.IO_DEST_ID) ?? undefined,
      header_attribute_category: this.asString(poHeader.HEADER_ATTRIBUTE_CATEGORY),
      header_attribute7: this.asString(poHeader.HEADER_ATTRIBUTE7),
      ir_header_id: this.asNumber(poHeader.IR_HEADER_ID) ?? undefined,
      ir_number: this.asNumber(poHeader.IR_NUMBER) ?? undefined,
      so_header_id: this.asNumber(poHeader.SO_HEADER_ID) ?? undefined,
      so_number: this.asNumber(poHeader.SO_NUMBER) ?? undefined,
      total_lines: this.asNumber(poHeader.TOTAL_LINES) ?? undefined,
      batch_number: this.asString(poHeader.BATCH_NUMBER),
      iface_status_ir: this.asString(poHeader.IFACE_STATUS_IR),
      iface_message_ir: this.asString(poHeader.IFACE_MESSAGE_IR),
      iface_status_io: this.asString(poHeader.IFACE_STATUS_IO),
      iface_message_io: this.asString(poHeader.IFACE_MESSAGE_IO),
      iface_status_oi: this.asString(poHeader.IFACE_STATUS_OI),
      iface_message_oi: this.asString(poHeader.IFACE_MESSAGE_OI),
      request_id_ir: this.asNumber(poHeader.REQUEST_ID_IR) ?? undefined,
      request_id_io: this.asNumber(poHeader.REQUEST_ID_IO) ?? undefined,
      request_id_oi: this.asNumber(poHeader.REQUEST_ID_OI) ?? undefined,
      creation_date: this.asDate(poHeader.CREATION_DATE),
      last_updated_date: this.asDate(poHeader.LAST_UPDATED_DATE),
      created_by: this.asNumber(poHeader.CREATED_BY) ?? undefined,
      last_updated_by: this.asNumber(poHeader.LAST_UPDATED_BY) ?? undefined,
    });

    const linesRaw = Array.isArray(poHeader.LINES) ? (poHeader.LINES as Record<string, unknown>[]) : [];
    const localLinesBySourceLineId = new Map(
      (header.lines ?? [])
        .filter((line) => line.source_line_id)
        .map((line) => [line.source_line_id, line]),
    );

    for (const poLine of linesRaw) {
      const sourceLineId = this.asString(poLine.SOURCE_LINE_ID);
      if (!sourceLineId) {
        continue;
      }
      const localLine = localLinesBySourceLineId.get(sourceLineId);
      if (!localLine) {
        continue;
      }
      await this.outboundIntegrationIrReqService.updateLine(localLine.id, {
        iface_header_id: this.asNumber(poLine.IFACE_HEADER_ID) ?? undefined,
        iface_line_id: this.asNumber(poLine.IFACE_LINE_ID) ?? undefined,
        source_header_id: this.asString(poLine.SOURCE_HEADER_ID),
        source_line_id: sourceLineId,
        inventory_item_id: this.asNumber(poLine.INVENTORY_ITEM_ID) ?? undefined,
        item: this.asString(poLine.ITEM),
        quantity: this.asNumber(poLine.QUANTITY) ?? undefined,
        transaction_uom: this.asString(poLine.TRANSACTION_UOM),
        ir_line_id: this.asNumber(poLine.IR_LINE_ID) ?? undefined,
        ir_line_number: this.asNumber(poLine.IR_LINE_NUMBER) ?? undefined,
        so_line_id: this.asNumber(poLine.SO_LINE_ID) ?? undefined,
        so_line_number: this.asNumber(poLine.SO_LINE_NUMBER) ?? undefined,
        iface_line_status_ir: this.asString(poLine.IFACE_LINE_STATUS_IR),
        iface_line_message_ir: this.asString(poLine.IFACE_LINE_MESSAGE_IR),
        creation_date: this.asDate(poLine.CREATION_DATE),
        last_updated_date: this.asDate(poLine.LAST_UPDATED_DATE),
        created_by: this.asNumber(poLine.CREATED_BY) ?? undefined,
        last_updated_by: this.asNumber(poLine.LAST_UPDATED_BY) ?? undefined,
      });
    }
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

  private firstNonEmptyString(...values: unknown[]): string | null {
    for (const value of values) {
      if (typeof value === 'string' && value.trim() !== '') {
        return value.trim();
      }
    }
    return null;
  }

  private extractPoHeaderPayload(
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

  private safeJson(value: unknown): string {
    try {
      const raw = JSON.stringify(value);
      return raw.length > 3000 ? `${raw.slice(0, 3000)}...<truncated>` : raw;
    } catch {
      return '[unserializable]';
    }
  }
}
