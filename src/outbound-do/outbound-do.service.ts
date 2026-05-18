import { Injectable, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { OutboundDoRepository } from './outbound-do.repository';
import { CreateOutboundDoDto } from './dto/create-outbound-do.dto';
import { UpdateOutboundDoDto } from './dto/update-outbound-do.dto';
import { OutboundDo, OutboundDoStatus } from '../core/domain/entities/outbound-do.entity';
import { OutboundMemo } from '../core/domain/entities/outbound-memo.entity';
import { OutboundMemoItem } from '../core/domain/entities/outbound-memo-item.entity';
import { MasterItem } from '../core/domain/entities/master-item.entity';
import { AssignedGateLoad } from '../core/domain/entities/assigned-gate-load.entity';
import { PaginationService } from '../core/services/pagination.service';
import { OutboundDoPaginationDto } from './dto/outbound-do-pagination.dto';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { TransactionPickingService } from '../transaction-picking/transaction-picking.service';
import {
  OutboundIntegrationIrReqService,
  OutboundIntegrationIrReqAggregateResult,
  OutboundIntegrationIrReqHeaderWithLines,
} from '../outbound-integration-ir-req/outbound-integration-ir-req.service';
import { CreateOutboundIntegrationIrReqPayloadDto } from '../outbound-integration-ir-req/dto/create-outbound-integration-ir-req-payload.dto';
import { CreateOutboundIntegrationIrReqLineDto } from '../outbound-integration-ir-req/dto/create-outbound-integration-ir-req-line.dto';
import { OutboundIntegrationIrReqLines } from '../core/domain/entities/outbound-integration-ir-req-lines.entity';
import {
  IrRequestIntegrationService,
  PoInternalReqCreateResponseDto,
} from './integration/ir-request.integration';
import { CreatePoInternalReqDto, CreatePoInternalReqLinesDto } from './integration/dto/create-po-internal-req.dto';
import { OutboundIntegrationQueueProducer } from './integration/outbound-integration-queue.producer';

export type OutboundDoIntegrationResult = {
  status: 'PROCESSING';
  outbound_do: OutboundDo;
  outboundDoId: string;
  outbound_integration_ir_req: OutboundIntegrationIrReqAggregateResult[];
  integration_ir_req: OutboundIntegrationIrReqHeaderWithLines[];
  po_internal_req: PoInternalReqCreateResponseDto;
};

@Injectable()
export class OutboundDoService {
  private readonly logger = new Logger(OutboundDoService.name);

  constructor(
    private readonly repository: OutboundDoRepository,
    private readonly paginationService: PaginationService,
    private readonly transactionPickingService: TransactionPickingService,
    private readonly outboundIntegrationIrReqService: OutboundIntegrationIrReqService,
    private readonly irRequestIntegrationService: IrRequestIntegrationService,
    private readonly outboundIntegrationQueueProducer: OutboundIntegrationQueueProducer,
  ) { }

  async create(data: CreateOutboundDoDto): Promise<OutboundDo> {
    // Validasi delivery_date tidak boleh di masa lalu
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(data.delivery_date) < today) {
      throw new BadRequestException('Delivery date tidak boleh di masa lalu');
    }

    // Generate outbound_do_number jika tidak provided
    if (!data.outbound_do_number) {
      data.outbound_do_number = await this.repository.getNextOutboundDoNumberForDate(
        data.delivery_date,
      );
    } else {
      // Validasi outbound_do_number harus unique jika provided
      const existingDo = await this.repository.findByOutboundDoNumber(data.outbound_do_number);
      if (existingDo) {
        throw new ConflictException('Outbound DO number sudah digunakan');
      }
    }

    // Validasi minimal 1 outbound memo
    if (!data.outbound_memo_ids || data.outbound_memo_ids.length === 0) {
      throw new BadRequestException('Minimal harus ada 1 outbound memo');
    }

    // Validasi sequence numbers harus unique dan positif
    const sequences = data.outbound_memo_ids.map((item) => item.sequence);
    const uniqueSequences = new Set(sequences);
    if (sequences.length !== uniqueSequences.size) {
      throw new BadRequestException('Sequence numbers must be unique');
    }

    if (sequences.some((seq) => seq <= 0)) {
      throw new BadRequestException('Sequence numbers must be positive');
    }

    // Validasi phone number format
    if (data.driver_phone && !this.isValidPhoneNumber(data.driver_phone)) {
      throw new BadRequestException('Format nomor telepon tidak valid');
    }

    return this.repository.create(data);
  }

  async findAll(organizationId: string): Promise<OutboundDo[]> {
    return this.repository.findAll(organizationId);
  }

  async findAllPaginated(
    paginationDto: OutboundDoPaginationDto,
    organizationId: string,
  ): Promise<PaginatedResponseDto<OutboundDo>> {
    const result = await this.repository.findAllPaginated(paginationDto, organizationId);
    return this.paginationService.createPaginatedResponse(
      result.data,
      paginationDto,
      result.total,
    );
  }

  async findOne(id: string, transactionPickingStatus?: string): Promise<OutboundDo> {
    return this.repository.findOneWithMemoSequence(id, transactionPickingStatus);
  }

  async update(id: string, data: UpdateOutboundDoDto): Promise<OutboundDo> {
    const existing = await this.repository.findOne(id);

    // Validasi delivery_date jika diupdate
    if (data.delivery_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(data.delivery_date) < today) {
        throw new BadRequestException('Delivery date tidak boleh di masa lalu');
      }
    }

    // Validasi outbound_do_number unique jika diupdate
    if (data.outbound_do_number && data.outbound_do_number !== existing.outbound_do_number) {
      const existingDo = await this.repository.findByOutboundDoNumber(data.outbound_do_number);
      if (existingDo) {
        throw new ConflictException('Outbound DO number sudah digunakan');
      }
    }

    // Validasi phone number format jika diupdate
    if (data.driver_phone && !this.isValidPhoneNumber(data.driver_phone)) {
      throw new BadRequestException('Format nomor telepon tidak valid');
    }

    return this.repository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.repository.findOne(id);

    // Validasi tidak bisa delete jika status sudah COMPLETED
    if (existing.status === OutboundDoStatus.COMPLETED) {
      throw new BadRequestException('Tidak dapat menghapus outbound DO yang sudah COMPLETED');
    }

    return this.repository.remove(id);
  }

  async findByStatus(status: string): Promise<OutboundDo[]> {
    return this.repository.findByStatus(status);
  }

  async findByOutboundType(outbound_type: string): Promise<OutboundDo[]> {
    return this.repository.findByOutboundType(outbound_type);
  }

  async updateStatus(id: string, status: OutboundDoStatus): Promise<OutboundDo> {
    const existing = await this.repository.findOne(id);
    return this.repository.update(id, { status } as UpdateOutboundDoDto);
  }

  private isValidPhoneNumber(phone: string): boolean {
    // Validasi format nomor telepon Indonesia
    const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
    return phoneRegex.test(phone);
  }

  async getMemoSequence(outboundDoId: string): Promise<{ memoId: string; sequence: number }[]> {
    return this.repository.getMemoSequence(outboundDoId);
  }

  async findByAssignedUserId(userId: string): Promise<OutboundDo[]> {
    return this.repository.findByAssignedUserId(userId);
  }

  async removeMemo(id: string, memoId?: string): Promise<OutboundDo> {
    const outboundDo = await this.repository.findOne(id);

    // If memoId is not provided, remove all memos
    if (!memoId) {
      const memoIds = await this.repository.removeAllMemosFromOutboundDo(id);
      // Cancel all transaction pickings for all memos
      for (const memoIdToCancel of memoIds) {
        await this.cancelTransactionPickingsByMemoId(memoIdToCancel);
      }

      await this.repository.updateMultipleMemosHasDo(memoIds, false);
      return this.repository.findOne(id);
    }

    // Remove specific memo
    // Check if memo exists in the outbound DO
    const memoIndex = outboundDo.memo_id?.indexOf(memoId) ?? -1;
    const memoExistsInRelation = outboundDo.outbound_memos?.some((memo) => memo.id === memoId) ?? false;

    if (memoIndex === -1 && !memoExistsInRelation) {
      throw new BadRequestException('Memo not found in outbound DO');
    }

    // Cancel all transaction pickings for this memo
    await this.cancelTransactionPickingsByMemoId(memoId);

    // Remove memo from outbound DO
    const updatedOutboundDo = await this.repository.removeMemoFromOutboundDo(id, memoId);

    // Update the memo's has_do flag to false
    await this.repository.updateMemoHasDo(memoId, false);

    return updatedOutboundDo;
  }

  private async cancelTransactionPickingsByMemoId(memoId: string): Promise<void> {
    await this.transactionPickingService.cancelTransactionByMemoId(memoId);
  }

  async attachMemo(id: string, memoId: string, sequence?: number): Promise<OutboundDo> {
    // Get outbound DO
    const outboundDo = await this.repository.findOne(id);

    // Check if memo already exists
    const memoIndex = outboundDo.memo_id?.indexOf(memoId) ?? -1;
    if (memoIndex !== -1) {
      throw new BadRequestException('Memo already attached to outbound DO');
    }

    // Verify memo exists
    let memo = await this.repository.findMemoById(memoId);
    if (!memo) {
      throw new BadRequestException(`Outbound memo with ID ${memoId} not found`);
    }

    // Calculate sequence if not provided
    let newSequence = sequence;
    if (!newSequence) {
      const existingSequences = outboundDo.memo_sequence || [];
      newSequence = existingSequences.length > 0 ? Math.max(...existingSequences) + 1 : 1;
    }

    // Validate sequence is unique
    const existingSequences = outboundDo.memo_sequence || [];
    if (existingSequences.includes(newSequence)) {
      throw new BadRequestException(
        `Sequence ${newSequence} already exists. Please provide a unique sequence.`,
      );
    }

    // Validate sequence is positive
    if (newSequence <= 0) {
      throw new BadRequestException('Sequence must be positive');
    }

    // Update memo's has_do flag if needed
    if (!memo.has_do) {
      await this.repository.updateMemoHasDo(memoId, true);
      // Refresh memo to get updated has_do value
      const updatedMemo = await this.repository.findMemoById(memoId);
      if (updatedMemo) {
        memo = updatedMemo;
      }
    }

    // Add memo to outbound DO
    return this.repository.addMemoToOutboundDo(id, memoId, newSequence, memo);
  }

  async cancel(id: string): Promise<OutboundDo> {
    const outboundDo = await this.repository.findOne(id);
    if (!outboundDo) {
      throw new BadRequestException('Outbound DO not found');
    }
    // check memo has do
    if (outboundDo.outbound_memos?.some((memo) => memo.has_do)) {
      throw new BadRequestException(`already have memo ${outboundDo.outbound_memos.map((memo) => memo.outbound_memo_number).join(', ')} attached to this outbound DO`);
    }

    return this.repository.update(id, { status: OutboundDoStatus.CANCELLED });
  }

  async integration(id: string): Promise<OutboundDoIntegrationResult> {
    const outboundDo = await this.repository.findOneForIntegration(id);

    const memos = outboundDo.outbound_memos ?? [];
    if (memos.length === 0) {
      throw new BadRequestException('Outbound DO has no outbound memos to integrate');
    }

    const outbound_integration_ir_req: OutboundIntegrationIrReqAggregateResult[] = [];
    for (const memo of memos) {
      const payload = this.mapOutboundMemoToIntegrationPayload(memo as OutboundMemo & { sequence: string }, outboundDo);
      outbound_integration_ir_req.push(
        await this.outboundIntegrationIrReqService.createOrReplaceByOutboundMemoId(payload),
      );
    }

    const integrationIrReq =
      (await this.outboundIntegrationIrReqService.findAllByOutboundDoId(id)) ?? [];
    if (integrationIrReq.length === 0) {
      throw new BadRequestException('Integration IR req not found for this outbound DO');
    }

    const poDtos = integrationIrReq.map((row) => this.mapOutboundIntegrationIrReqToCreatePoInternalReq(row));
    const po_internal_req = await this.irRequestIntegrationService.createPoInternalReq(poDtos);
    if (!po_internal_req.status) {
      throw new BadRequestException(
        po_internal_req.message || 'PO internal requisition microservice returned status false',
      );
    }

    await this.outboundIntegrationQueueProducer.publish({
      outboundDoId: id,
      retryCount: 0,
      maxRetry: 20,
    });

    this.logger.log(
      `Queued outbound integration job outboundDoId=${id} retryCount=0`,
    );

    return {
      status: 'PROCESSING',
      outbound_do: outboundDo,
      outboundDoId: id,
      outbound_integration_ir_req,
      integration_ir_req: integrationIrReq,
      po_internal_req,
    };
  }

  /**
   * Maps persisted outbound integration IR req (+ lines) to the PO internal requisition microservice DTO (uppercase keys).
   */
  private mapOutboundIntegrationIrReqToCreatePoInternalReq(
    row: OutboundIntegrationIrReqHeaderWithLines,
  ): CreatePoInternalReqDto {
    const rawLines = row.lines ?? [];
    if (rawLines.length === 0) {
      throw new BadRequestException(
        `Outbound integration IR req ${row.id} has no lines for PO internal requisition`,
      );
    }

    const needBy = row.need_by_date;
    if (needBy == null) {
      throw new BadRequestException(`Outbound integration IR req ${row.id} is missing need_by_date`);
    }

    const dto: CreatePoInternalReqDto = {
      TRANSACTION_TYPE: this.requireNonEmptyString(row.transaction_type, 'TRANSACTION_TYPE', row.id),
      SOURCE_CODE: this.requireNonEmptyString(row.source_code, 'SOURCE_CODE', row.id),
      SOURCE_HEADER_ID: this.requireNonEmptyString(row.source_header_id, 'SOURCE_HEADER_ID', row.id),
      NEED_BY_DATE: new Date(needBy).toISOString(),
      PREPARER_NUMBER: this.requireNonEmptyString(row.preparer_number, 'PREPARER_NUMBER', row.id),
      REQUESTOR_NUMBER: this.requireNonEmptyString(row.requestor_number, 'REQUESTOR_NUMBER', row.id),
      ORG_NAME: this.requireNonEmptyString(row.org_name, 'ORG_NAME', row.id),
      IO_SOURCE_NAME: this.requireNonEmptyString(row.io_source_name, 'IO_SOURCE_NAME', row.id),
      IO_DEST_NAME: this.requireNonEmptyString(row.io_dest_name, 'IO_DEST_NAME', row.id),
      HEADER_ATTRIBUTE_CATEGORY: this.requireNonEmptyString(
        row.header_attribute_category,
        'HEADER_ATTRIBUTE_CATEGORY',
        row.id,
      ),
      HEADER_ATTRIBUTE7: this.requireNonEmptyString(row.header_attribute7, 'HEADER_ATTRIBUTE7', row.id),
      TOTAL_LINES: this.requirePositiveInt(
        this.coerceToNumber(row.total_lines) ?? rawLines.length,
        'TOTAL_LINES',
        row.id,
      ),
      LINES: rawLines.map((line) => this.mapIrReqLineToCreatePoInternalReqLine(line, row.id)),
    };

    const preparerId = row.preparer_id?.trim();
    if (preparerId) {
      dto.PREPARER_ID = preparerId;
    }
    const requestorId = row.requestor_id?.trim();
    if (requestorId) {
      dto.REQUESTOR_ID = requestorId;
    }

    const orgId = this.coerceToNumber(row.org_id);
    if (orgId != null) {
      dto.ORG_ID = orgId;
    }
    const ioSourceId = this.coerceToNumber(row.io_source_id);
    if (ioSourceId != null) {
      dto.IO_SOURCE_ID = ioSourceId;
    }
    const ioDestId = this.coerceToNumber(row.io_dest_id);
    if (ioDestId != null) {
      dto.IO_DEST_ID = ioDestId;
    }

    return dto;
  }

  private mapIrReqLineToCreatePoInternalReqLine(
    line: OutboundIntegrationIrReqLines,
    headerId: string,
  ): CreatePoInternalReqLinesDto {
    const invId = this.coerceToNumber(line.inventory_item_id);
    if (invId == null) {
      throw new BadRequestException(
        `IR req line ${line.id} (header ${headerId}) is missing or invalid INVENTORY_ITEM_ID`,
      );
    }
    const qty = this.coerceToNumber(line.quantity);
    if (qty == null || qty <= 0) {
      throw new BadRequestException(
        `IR req line ${line.id} (header ${headerId}) must have QUANTITY > 0 for PO internal requisition`,
      );
    }

    return {
      SOURCE_HEADER_ID: this.requireNonEmptyString(
        line.source_header_id,
        'line.SOURCE_HEADER_ID',
        headerId,
      ),
      SOURCE_LINE_ID: this.requireNonEmptyString(line.source_line_id, 'line.SOURCE_LINE_ID', headerId),
      INVENTORY_ITEM_ID: invId,
      ITEM: this.requireNonEmptyString(line.item, 'line.ITEM', headerId),
      QUANTITY: Math.round(qty),
      TRANSACTION_UOM: this.requireNonEmptyString(
        line.transaction_uom,
        'line.TRANSACTION_UOM',
        headerId,
      ),
    };
  }

  private requireNonEmptyString(value: unknown, field: string, headerId: string): string {
    const s = value != null ? String(value).trim() : '';
    if (!s) {
      throw new BadRequestException(
        `Outbound integration IR req ${headerId}: ${field} is required for PO internal requisition`,
      );
    }
    return s;
  }

  private requirePositiveInt(value: unknown, field: string, headerId: string): number {
    const n = this.coerceToNumber(value);
    if (n == null || !Number.isInteger(n) || n < 1) {
      throw new BadRequestException(
        `Outbound integration IR req ${headerId}: ${field} must be a positive integer for PO internal requisition`,
      );
    }
    return n;
  }

  private coerceToNumber(value: unknown): number | undefined {
    if (value == null || value === '') {
      return undefined;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  private mapOutboundMemoToIntegrationPayload(
    memo: OutboundMemo & { sequence: string },
    outboundDo: OutboundDo,
  ): CreateOutboundIntegrationIrReqPayloadDto {
    const items = memo.outbound_memo_items ?? [];
    if (items.length === 0) {
      throw new BadRequestException(
        `Outbound memo ${memo.outbound_memo_number ?? memo.id} has no items for integration`,
      );
    }

    const org = memo.organization;
    const destIo = memo.destination_io;
    const needBy = memo.delivery_date ?? outboundDo.delivery_date;

    const header: CreateOutboundIntegrationIrReqPayloadDto = {
      organization_id: outboundDo.organization_id ?? memo.organization_id,
      outbound_do_id: outboundDo.id,
      outbound_memo_id: memo.id,
      preparer_number: memo.sequence,
      need_by_date: needBy ? (needBy as Date) : undefined,
      requestor_number: memo.requestor,
      org_name: org?.org_name,
      org_id: Number(org?.org_id) ?? undefined,
      io_source_name: org?.organization_code,
      io_source_id: Number(org?.organization_id) ?? undefined,
      io_dest_name: destIo?.organization_code,
      io_dest_id: Number(destIo?.organization_id) ?? undefined,
      source_code: 'WMS',
      source_header_id: memo.id,
      transaction_type: 'Outbound GS Mutasi SO Internal',
      total_lines: items.length,
      header_attribute_category: 'INTERNAL',
      header_attribute7: 'ALK',
      lines: items.map((row) => this.mapOutboundMemoItemToIntegrationLine(memo, row)),
    };

    return header;
  }

  private mapOutboundMemoItemToIntegrationLine(
    memo: OutboundMemo,
    row: OutboundMemoItem,
  ): CreateOutboundIntegrationIrReqLineDto {
    const master = row.item as MasterItem | undefined;
    const sumLoaded = this.sumQuantityLoadedFromAssignedGateLoads(row);
    const qtyFromPlan = row.quantity_plan;
    const qty = sumLoaded > 0 ? sumLoaded : 0;
    if (qty == null || qty <= 0) {
      throw new BadRequestException(
        `Memo line ${row.id} must have total quantity_loaded from assigned gate loads, or quantity_plan / quantity_delivered > 0 for integration`,
      );
    }

    return {
      outbound_memo_item_id: row.id,
      source_header_id: memo.id,
      source_line_id: row.id,
      inventory_item_id: this.parseNumericInventoryItemId(master?.inventory_item_id),
      item: master?.item_number,
      quantity: Math.round(Number(qty)),
      transaction_uom: row.uom,
    };
  }

  /** Sums `quantity_loaded` across rows mapped onto the memo item by integration query (`assigned_gate_load`). */
  private sumQuantityLoadedFromAssignedGateLoads(row: OutboundMemoItem): number {
    const loads = (row as OutboundMemoItem & { assigned_gate_load?: AssignedGateLoad[] })
      .assigned_gate_load;
    if (!loads?.length) {
      return 0;
    }
    return loads.reduce((sum, load) => {
      const q = load.quantity_loaded;
      if (q == null || Number.isNaN(Number(q))) {
        return sum;
      }
      return sum + Number(q);
    }, 0);
  }

  private parseNumericInventoryItemId(raw?: string | null): number | undefined {
    if (raw == null || raw === '') {
      return undefined;
    }
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }

  private truncateField(value: string | null | undefined, max: number): string | undefined {
    if (value == null || value === '') {
      return undefined;
    }
    return value.length <= max ? value : value.slice(0, max);
  }
}
