import { Injectable, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import {
  OutboundDoRepository,
  OutboundMemoWithIntegrationIrReq,
  ShipConfirmInternalQueryResult,
} from './outbound-do.repository';
import { CreateOutboundDoDto } from './dto/create-outbound-do.dto';
import { UpdateOutboundDoDto } from './dto/update-outbound-do.dto';
import { OutboundDo, OutboundDoStatus, OutboundDoType } from '../core/domain/entities/outbound-do.entity';
import { OutboundMemo, OutboundMemoStatus } from '../core/domain/entities/outbound-memo.entity';
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
import { ShipConfirmIntegrationService } from './integration/ship-confirm.integration';
import { ShipConfirmStatusCheckerService } from './integration/ship-confirm-status-checker.service';
import { ShipConfirmInternalResponseDto } from './integration/dto/ship-confirm-internal-response.dto';
import { CreateShipConfirmInternalDto } from './dto/create-ship-confirm-internal.dto';
import { CreatePoInternalReqDto, CreatePoInternalReqLinesDto } from './integration/dto/create-po-internal-req.dto';
import { OutboundIntegrationQueueProducer } from './integration/outbound-integration-queue.producer';
import { OutboundIntegrationDeliveriesRepository } from '../outbound-integration-deliveries/outbound-integration-deliveries.repository';
import { OutboundIntegrationIrReq } from '../core/domain/entities/outbound-integration-ir-req.entity';
import {
  OutboundIntegrationDeliveries,
  DeliveryAttributeCategory,
  ShipConfirmInternalTransactionType,
} from '../core/domain/entities/outbound-integration-deliveries.entity';
import { CreateOutboundIntegrationDeliveriesDto } from '../outbound-integration-deliveries/dto/create-outbound-integration-deliveries.dto';
import { CreateShipConfirmSubdistPayloadDto } from './dto/create-ship-confirm-subdist.dto';
import { CreateShipConfirmSubdistOracleDto } from './dto/create-ship-confirm-subdist-oracle.dto';

export type ShipConfirmInternalResult = ShipConfirmInternalQueryResult & {
  integration_status: 'PROCESSING' | 'SUCCESS' | 'ERROR';
  outbound_integration_deliveries: OutboundIntegrationDeliveries[];
  ship_confirm: ShipConfirmInternalResponseDto;
};

export type PickReleaseSubdistResult = OutboundDo & {
  integration_status: 'PROCESSING' | 'SUCCESS' | 'ERROR';
  outbound_integration_deliveries: OutboundIntegrationDeliveries[];
  pick_release: ShipConfirmInternalResponseDto;
};

export type ShipConfirmSubdistResult = OutboundDo & {
  integration_status: 'PROCESSING' | 'SUCCESS' | 'ERROR';
  outbound_integration_deliveries: OutboundIntegrationDeliveries[];
  ship_confirm: ShipConfirmInternalResponseDto;
};

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
    private readonly shipConfirmIntegrationService: ShipConfirmIntegrationService,
    private readonly outboundIntegrationQueueProducer: OutboundIntegrationQueueProducer,
    private readonly outboundIntegrationDeliveriesRepository: OutboundIntegrationDeliveriesRepository,
    private readonly shipConfirmStatusChecker: ShipConfirmStatusCheckerService,
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

    const memos = (outboundDo.outbound_memos ?? []).filter(
      (memo) => memo.status !== OutboundMemoStatus.INTEGRATED,
    );
    outboundDo.outbound_memos = memos;
    if (memos.length === 0) {
      throw new BadRequestException(
        'Outbound DO has no outbound memos to integrate (all memos are already INTEGRATED)',
      );
    }

    const outbound_integration_ir_req: OutboundIntegrationIrReqAggregateResult[] = [];
    for (const memo of memos) {
      const payload = this.mapOutboundMemoToIntegrationPayload(memo as OutboundMemo & { sequence: string }, outboundDo);
      outbound_integration_ir_req.push(
        await this.outboundIntegrationIrReqService.createOrReplaceByOutboundMemoId(payload),
      );
    }

    const memoIdsToIntegrate = new Set(memos.map((memo) => memo.id));
    const integrationIrReq =
      ((await this.outboundIntegrationIrReqService.findAllByOutboundDoId(id)) ?? []).filter(
        (row) => row.outbound_memo_id && memoIdsToIntegrate.has(row.outbound_memo_id),
      );
    if (integrationIrReq.length === 0) {
      throw new BadRequestException(
        'Integration IR req not found for non-INTEGRATED memos on this outbound DO',
      );
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
      jobType: 'PO_INTERNAL_REQ',
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
      HEADER_ATTRIBUTE15: this.requireNonEmptyString(row.outbound_do_id, 'HEADER_ATTRIBUTE15', row.id),
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
      preparer_number: memo.requestor,
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

  async shipConfirmSubdist(
    id: string,
    payload: CreateShipConfirmSubdistPayloadDto,
  ): Promise<ShipConfirmSubdistResult> {
    const outboundDo = await this.repository.findOne(id);
    if (!outboundDo) {
      throw new BadRequestException('Outbound DO not found');
    }

    if (outboundDo.outbound_type !== OutboundDoType.SUBDIST) {
      throw new BadRequestException('Outbound type is not SUBDIST');
    }

    if (!payload.lines?.length) {
      throw new BadRequestException('At least one ship confirm line is required');
    }

    const pickReleaseRows =
      await this.outboundIntegrationDeliveriesRepository.findByOutboundDoIdAndTransactionTypes(
        id,
        [ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_PICK_RELEASE],
      );

    if (!pickReleaseRows.length) {
      throw new BadRequestException(
        'No pick release integration deliveries found; run pick-release-subdist first',
      );
    }

    const outbound_integration_deliveries = await this.createShipConfirmSubdistDeliveries(
      outboundDo,
      pickReleaseRows,
      payload.lines,
    );

    const shipConfirmPayloads = this.buildShipConfirmCreatePayloadsFromDeliveries(
      outbound_integration_deliveries,
      ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_SHIP_CONFIRM,
    );

    const ship_confirm = await this.shipConfirmIntegrationService.create(shipConfirmPayloads);

    if (!ship_confirm.status) {
      throw new BadRequestException(
        ship_confirm.message || 'Ship confirm subdist integration failed',
      );
    }

    await this.shipConfirmStatusChecker.syncDeliveriesFromCreateResponse(
      outbound_integration_deliveries,
      ship_confirm,
    );

    const shipConfirmTransactionType =
      ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_SHIP_CONFIRM;
    const refreshedDeliveries =
      await this.outboundIntegrationDeliveriesRepository.findByOutboundDoIdAndTransactionTypes(
        id,
        [shipConfirmTransactionType],
      );
    const statusCheck = this.shipConfirmStatusChecker.evaluateDeliveries(refreshedDeliveries);

    await this.outboundIntegrationQueueProducer.publish({
      outboundDoId: id,
      retryCount: 0,
      maxRetry: 20,
      jobType: 'SHIP_CONFIRM',
      transactionType: shipConfirmTransactionType,
    });

    this.logger.log(
      `Queued ship confirm subdist status job outboundDoId=${id} transactionType=${shipConfirmTransactionType} integrationStatus=${statusCheck.status}`,
    );

    return {
      ...outboundDo,
      integration_status:
        statusCheck.status === 'PENDING' ? 'PROCESSING' : statusCheck.status,
      outbound_integration_deliveries: refreshedDeliveries,
      ship_confirm,
    };
  }

  private async createShipConfirmSubdistDeliveries(
    outboundDo: OutboundDo,
    pickReleaseRows: OutboundIntegrationDeliveries[],
    inputLines: CreateShipConfirmSubdistPayloadDto['lines'],
  ): Promise<OutboundIntegrationDeliveries[]> {
    const pickReleaseByItemId = this.indexPickReleaseRowsByMemoItem(pickReleaseRows);

    const deliveryDtos: CreateOutboundIntegrationDeliveriesDto[] = [];

    for (const line of inputLines) {
      const pickReleaseRow = pickReleaseByItemId.get(line.outbound_memo_item_id);
      if (!pickReleaseRow) {
        throw new BadRequestException(
          `No pick release delivery for outbound_memo_item_id ${line.outbound_memo_item_id}`,
        );
      }

      deliveryDtos.push(
        this.mapShipConfirmSubdistFromPickRelease(outboundDo, pickReleaseRow, line.shipped_quantity),
      );
    }

    return await this.insertIntegrationDeliveriesByType(
      outboundDo.id,
      deliveryDtos,
      inputLines.map((line) => line.outbound_memo_item_id),
    );
  }

  private indexPickReleaseRowsByMemoItem(
    pickReleaseRows: OutboundIntegrationDeliveries[],
  ): Map<string, OutboundIntegrationDeliveries> {
    const byItemId = new Map<string, OutboundIntegrationDeliveries>();

    for (const row of pickReleaseRows) {
      if (!row.outbound_memo_item_id) {
        continue;
      }

      const existing = byItemId.get(row.outbound_memo_item_id);
      if (!existing || this.shouldPreferPickReleaseRow(row, existing)) {
        byItemId.set(row.outbound_memo_item_id, row);
      }
    }

    return byItemId;
  }

  private shouldPreferPickReleaseRow(
    candidate: OutboundIntegrationDeliveries,
    current: OutboundIntegrationDeliveries,
  ): boolean {
    const candidateSuccess = (candidate.pick_release_status ?? '').trim().toUpperCase() === 'S';
    const currentSuccess = (current.pick_release_status ?? '').trim().toUpperCase() === 'S';

    if (candidateSuccess && !currentSuccess) {
      return true;
    }
    if (!candidateSuccess && currentSuccess) {
      return false;
    }

    return candidate.updatedAt > current.updatedAt;
  }

  private mapShipConfirmSubdistFromPickRelease(
    outboundDo: OutboundDo,
    pickReleaseRow: OutboundIntegrationDeliveries,
    shippedQuantity: number,
  ): CreateOutboundIntegrationDeliveriesDto {
    if (pickReleaseRow.delivery_id == null) {
      throw new BadRequestException(
        `delivery_id is required from pick release for memo item ${pickReleaseRow.outbound_memo_item_id ?? 'N/A'}`,
      );
    }
    if (!pickReleaseRow.delivery_name?.trim()) {
      throw new BadRequestException(
        `delivery_name is required from pick release for memo item ${pickReleaseRow.outbound_memo_item_id ?? 'N/A'}`,
      );
    }
    if (!pickReleaseRow.source_header_id) {
      throw new BadRequestException(
        `source_header_id is required from pick release for memo item ${pickReleaseRow.outbound_memo_item_id ?? 'N/A'}`,
      );
    }

    const pickReleaseStatus = (pickReleaseRow.pick_release_status ?? '').trim().toUpperCase();
    if (pickReleaseStatus !== 'S') {
      throw new BadRequestException(
        `Pick release must be successful (S) before ship confirm for memo item ${pickReleaseRow.outbound_memo_item_id ?? 'N/A'}; current status=${pickReleaseRow.pick_release_status ?? 'empty'}`,
      );
    }

    return {
      organization_id: pickReleaseRow.organization_id ?? outboundDo.organization_id ?? undefined,
      outbound_do_id: outboundDo.id,
      outbound_memo_id: pickReleaseRow.outbound_memo_id ?? undefined,
      outbound_memo_item_id: pickReleaseRow.outbound_memo_item_id ?? undefined,
      transaction_type: ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_SHIP_CONFIRM,
      source_system: pickReleaseRow.source_system ?? 'WMS',
      source_header_id: pickReleaseRow.outbound_memo_id ?? pickReleaseRow.source_header_id,
      source_line_id: pickReleaseRow.source_line_id ?? pickReleaseRow.outbound_memo_item_id ?? undefined,
      delivery_id: pickReleaseRow.delivery_id,
      delivery_name: pickReleaseRow.delivery_name,
      shipped_quantity: Math.round(Number(shippedQuantity)),
      ship_confirm_status: 'U',
      ...this.copyStagedDeliveryAttributes(pickReleaseRow),
    };
  }

  /**
   * Builds Oracle `shipconfirm.create` payloads for one of three transaction types.
   */
  private buildShipConfirmCreatePayloadsFromDeliveries(
    deliveries: OutboundIntegrationDeliveries[],
    transactionType: ShipConfirmInternalTransactionType,
  ): CreateShipConfirmInternalDto[] | CreateShipConfirmSubdistOracleDto[] {
    switch (transactionType) {
      case ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_SHIP_CONFIRM:
        return this.buildSubdistShipConfirmCreatePayloads(deliveries);
      case ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_PICK_RELEASE:
        return this.buildSubdistPickReleaseCreatePayloads(deliveries);
      case ShipConfirmInternalTransactionType.OUTBOUND_GS_MUTASI_SO_INTERNAL:
        return this.buildMutasiSoInternalShipConfirmCreatePayloads(deliveries);
      default:
        throw new BadRequestException(`Unsupported ship confirm transaction type: ${transactionType}`);
    }
  }

  /** Subdist ship confirm — one Oracle payload per memo item (deduped). */
  private buildSubdistShipConfirmCreatePayloads(
    deliveries: OutboundIntegrationDeliveries[],
  ): CreateShipConfirmSubdistOracleDto[] {
    const shipConfirmRows = deliveries.filter(
      (row) =>
        row.transaction_type === ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_SHIP_CONFIRM &&
        row.source_header_id &&
        row.delivery_id != null &&
        row.delivery_name &&
        row.shipped_quantity != null,
    );

    if (!shipConfirmRows.length) {
      throw new BadRequestException('No ship confirm subdist payloads could be built from deliveries');
    }

    const uniqueRows = this.dedupeDeliveriesByMemoItem(shipConfirmRows);

    return uniqueRows.map((row) => ({
      TRANSACTION_TYPE: ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_SHIP_CONFIRM,
      SOURCE_SYSTEM: row.source_system ?? 'WMS',
      SOURCE_HEADER_ID: row.outbound_memo_id ?? row.source_header_id!,
      DELIVERY_ID: Number(row.delivery_id),
      DELIVERY_NAME: row.delivery_name!,
      SHIPPED_QUANTITY: Number(row.shipped_quantity),
    }));
  }

  private dedupeDeliveriesByMemoItem(
    rows: OutboundIntegrationDeliveries[],
  ): OutboundIntegrationDeliveries[] {
    const byKey = new Map<string, OutboundIntegrationDeliveries>();

    for (const row of rows) {
      const key =
        row.outbound_memo_item_id ??
        `${row.outbound_memo_id ?? row.source_header_id}|${row.iso_inventory_item_id ?? ''}|${row.delivery_id ?? ''}`;

      const existing = byKey.get(key);
      if (!existing || row.updatedAt > existing.updatedAt) {
        byKey.set(key, row);
      }
    }

    return [...byKey.values()];
  }

  async pickReleaseSubdist(id: string): Promise<PickReleaseSubdistResult> {
    const outboundDo = await this.repository.findOne(id);
    if (!outboundDo) {
      throw new BadRequestException('Outbound DO not found');
    }

    if (outboundDo.outbound_type !== OutboundDoType.SUBDIST) {
      throw new BadRequestException('Outbound type is not SUBDIST');
    }

    const outbound_integration_deliveries = await this.createPickReleaseSubdistDeliveries(
      outboundDo,
    );

    const pickReleasePayloads = this.buildShipConfirmCreatePayloadsFromDeliveries(
      outbound_integration_deliveries,
      ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_PICK_RELEASE,
    );
    const pick_release = await this.shipConfirmIntegrationService.create(pickReleasePayloads);

    if (!pick_release.status) {
      throw new BadRequestException(
        pick_release.message || 'Pick release subdist integration failed',
      );
    }

    await this.shipConfirmStatusChecker.syncDeliveriesFromCreateResponse(
      outbound_integration_deliveries,
      pick_release,
    );

    const pickReleaseTransactionType =
      ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_PICK_RELEASE;
    const pickReleaseRowsForStatus =
      await this.outboundIntegrationDeliveriesRepository.findByOutboundDoIdAndTransactionTypes(
        id,
        [pickReleaseTransactionType],
      );
    const statusCheck = this.shipConfirmStatusChecker.evaluateDeliveries(pickReleaseRowsForStatus);
    const refreshedDeliveries =
      await this.outboundIntegrationDeliveriesRepository.findByOutboundDoId(id);

    await this.outboundIntegrationQueueProducer.publish({
      outboundDoId: id,
      retryCount: 0,
      maxRetry: 20,
      jobType: 'SHIP_CONFIRM',
      transactionType: pickReleaseTransactionType,
    });

    this.logger.log(
      `Queued pick release subdist status job outboundDoId=${id} transactionType=${pickReleaseTransactionType} integrationStatus=${statusCheck.status}`,
    );

    return {
      ...outboundDo,
      integration_status:
        statusCheck.status === 'PENDING' ? 'PROCESSING' : statusCheck.status,
      outbound_integration_deliveries: refreshedDeliveries,
      pick_release,
    };
  }

  private async createPickReleaseSubdistDeliveries(
    outboundDo: OutboundDo,
  ): Promise<OutboundIntegrationDeliveries[]> {
    const deliveryDtos: CreateOutboundIntegrationDeliveriesDto[] = [];

    for (const memo of outboundDo.outbound_memos ?? []) {
      const items = memo.outbound_memo_items ?? [];
      if (!items.length) {
        throw new BadRequestException(
          `Outbound memo ${memo.id} (${memo.outbound_memo_number ?? 'N/A'}) has no items for pick release`,
        );
      }

      if (memo.header_id == null) {
        throw new BadRequestException(
          `header_id is required on memo ${memo.id} (${memo.outbound_memo_number ?? 'N/A'}) for pick release`,
        );
      }

      if (!memo.so_organization_id?.trim()) {
        throw new BadRequestException(
          `so_organization_id is required on memo ${memo.id} (${memo.outbound_memo_number ?? 'N/A'}) for pick release`,
        );
      }

      for (const item of items) {
        deliveryDtos.push(this.mapPickReleaseSubdistMemoItemToDelivery(outboundDo, memo, item));
      }
    }

    if (!deliveryDtos.length) {
      throw new BadRequestException('No delivery rows to create for pick release subdist');
    }

    const memoItemIds = deliveryDtos
      .map((dto) => dto.outbound_memo_item_id)
      .filter((itemId): itemId is string => typeof itemId === 'string' && itemId.trim() !== '');

    return await this.insertIntegrationDeliveriesByType(outboundDo.id, deliveryDtos, memoItemIds);
  }

  private mapPickReleaseSubdistMemoItemToDelivery(
    outboundDo: OutboundDo,
    memo: OutboundMemo,
    item: OutboundMemoItem,
  ): CreateOutboundIntegrationDeliveriesDto {
    const master = item.item as MasterItem | undefined;
    const isoInventoryItemId = this.parseNumericInventoryItemId(master?.inventory_item_id);
    if (isoInventoryItemId == null) {
      throw new BadRequestException(
        `inventory_item_id is required on memo item ${item.id} for pick release subdist`,
      );
    }

    const isoOrganizationId = this.parseNumericInventoryItemId(memo.so_organization_id);
    if (isoOrganizationId == null) {
      throw new BadRequestException(
        `so_organization_id must be numeric on memo ${memo.id} for pick release subdist`,
      );
    }

    const deliveryAttributes = this.buildOutboundIntegrationDeliveryAttributes(outboundDo, memo);

    return {
      organization_id: memo.organization_id ?? outboundDo.organization_id ?? undefined,
      outbound_do_id: outboundDo.id,
      outbound_memo_id: memo.id,
      outbound_memo_item_id: item.id,
      transaction_type: ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_PICK_RELEASE,
      source_system: 'WMS',
      source_header_id: memo.id,
      source_line_id: item.id,
      iso_header_id: memo.header_id,
      iso_inventory_item_id: isoInventoryItemId,
      iso_organization_id: isoOrganizationId,
      create_delivery_status: 'U',
      update_delivery_status: 'U',
      pick_release_status: 'U',
      ship_confirm_status: 'U',
      ...deliveryAttributes,
    };
  }

  /**
   * Subdist pick release — one Oracle payload per memo (SOURCE_HEADER_ID = memo.id).
   * LINES[] deduped by outbound_memo_item.id as SOURCE_LINE_ID.
   */
  private buildSubdistPickReleaseCreatePayloads(
    deliveries: OutboundIntegrationDeliveries[],
  ): CreateShipConfirmInternalDto[] {
    const pickReleaseRows = deliveries.filter(
      (row) =>
        row.transaction_type === ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_PICK_RELEASE &&
        (row.outbound_memo_id || row.source_header_id) &&
        row.iso_header_id != null &&
        row.iso_inventory_item_id != null &&
        row.iso_organization_id != null,
    );

    if (!pickReleaseRows.length) {
      throw new BadRequestException('No pick release subdist payloads could be built from deliveries');
    }

    const uniqueRows = this.dedupeDeliveriesByMemoItem(pickReleaseRows);
    const byMemoId = new Map<string, OutboundIntegrationDeliveries[]>();

    for (const row of uniqueRows) {
      const memoId = row.outbound_memo_id ?? row.source_header_id;
      if (!memoId) {
        continue;
      }
      const list = byMemoId.get(memoId) ?? [];
      list.push(row);
      byMemoId.set(memoId, list);
    }

    return [...byMemoId.values()].map((rows) => {
      const headerRow = rows[0];
      const memoId = headerRow.outbound_memo_id ?? headerRow.source_header_id!;

      return {
        TRANSACTION_TYPE: ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_PICK_RELEASE,
        SOURCE_SYSTEM: headerRow.source_system ?? 'WMS',
        SOURCE_HEADER_ID: memoId,
        ISO_HEADER_ID: Number(headerRow.iso_header_id),
        ...this.mapStagedDeliveryToOracleDeliveryAttributes(headerRow),
        LINES: this.buildPickReleaseOracleLines(rows),
      };
    });
  }

  private buildPickReleaseOracleLines(
    rows: OutboundIntegrationDeliveries[],
  ): NonNullable<CreateShipConfirmInternalDto['LINES']> {
    const byLineKey = new Map<string, NonNullable<CreateShipConfirmInternalDto['LINES']>[number]>();

    for (const row of rows) {
      const lineKey = row.outbound_memo_item_id ?? row.source_line_id;
      if (!lineKey || byLineKey.has(lineKey)) {
        continue;
      }

      byLineKey.set(lineKey, {
        SOURCE_LINE_ID: row.source_line_id ?? row.outbound_memo_item_id ?? '',
        ISO_HEADER_ID: Number(row.iso_header_id),
        ISO_LINE_ID: row.iso_line_id != null ? Number(row.iso_line_id) : 0,
        ISO_INVENTORY_ITEM_ID: Number(row.iso_inventory_item_id),
        ISO_ORGANIZATION_ID: Number(row.iso_organization_id),
      });
    }

    return [...byLineKey.values()];
  }

  async shipConfirmInternal(id: string): Promise<ShipConfirmInternalResult> {
    const shipConfirmData = await this.repository.findOneForShipConfirmInternal(id);

    // validate outbound_do.outbound_type == AMO
    if (shipConfirmData.outbound_type !== OutboundDoType.AMO) {
      throw new BadRequestException(
        `Outbound type ${shipConfirmData.outbound_type} is not implemented yet`,
      );
    }

    const outbound_integration_deliveries = await this.createMutasiSoInternalDeliveries(
      shipConfirmData,
      shipConfirmData.outbound_memos ?? [],
    );

    const shipConfirmPayloads = this.buildShipConfirmCreatePayloadsFromDeliveries(
      outbound_integration_deliveries,
      ShipConfirmInternalTransactionType.OUTBOUND_GS_MUTASI_SO_INTERNAL,
    );
    const ship_confirm = await this.shipConfirmIntegrationService.create(shipConfirmPayloads);

    await this.shipConfirmStatusChecker.syncDeliveriesFromCreateResponse(
      outbound_integration_deliveries,
      ship_confirm,
    );

    const shipConfirmTransactionType =
      ShipConfirmInternalTransactionType.OUTBOUND_GS_MUTASI_SO_INTERNAL;
    const refreshedDeliveries =
      await this.outboundIntegrationDeliveriesRepository.findByOutboundDoIdAndTransactionTypes(
        id,
        [shipConfirmTransactionType],
      );
    const statusCheck = this.shipConfirmStatusChecker.evaluateDeliveries(refreshedDeliveries);

    await this.outboundIntegrationQueueProducer.publish({
      outboundDoId: id,
      retryCount: 0,
      maxRetry: 20,
      jobType: 'SHIP_CONFIRM',
      transactionType: shipConfirmTransactionType,
    });

    this.logger.log(
      `Queued ship confirm status job outboundDoId=${id} transactionType=${shipConfirmTransactionType} integrationStatus=${statusCheck.status}`,
    );

    return {
      ...shipConfirmData,
      integration_status:
        statusCheck.status === 'PENDING' ? 'PROCESSING' : statusCheck.status,
      outbound_integration_deliveries: refreshedDeliveries,
      ship_confirm,
    };
  }

  /** Mutasi SO internal ship confirm — one Oracle payload per source_header_id. */
  private buildMutasiSoInternalShipConfirmCreatePayloads(
    deliveries: OutboundIntegrationDeliveries[],
  ): CreateShipConfirmInternalDto[] {
    const bySourceHeader = new Map<string, OutboundIntegrationDeliveries>();

    for (const delivery of deliveries) {
      if (!delivery.source_header_id || delivery.iso_header_id == null) {
        continue;
      }
      if (!bySourceHeader.has(delivery.source_header_id)) {
        bySourceHeader.set(delivery.source_header_id, delivery);
      }
    }

    return [...bySourceHeader.values()].map((delivery) => ({
      TRANSACTION_TYPE: ShipConfirmInternalTransactionType.OUTBOUND_GS_MUTASI_SO_INTERNAL,
      SOURCE_SYSTEM: delivery.source_system ?? 'WMS',
      SOURCE_HEADER_ID: delivery.source_header_id!,
      ISO_HEADER_ID: Number(delivery.iso_header_id),
      ...this.mapStagedDeliveryToOracleDeliveryAttributes(delivery),
    }));
  }

  private async createMutasiSoInternalDeliveries(
    shipConfirmData: ShipConfirmInternalQueryResult,
    outboundMemos: OutboundMemoWithIntegrationIrReq[],
  ): Promise<OutboundIntegrationDeliveries[]> {
    const deliveryDtos: CreateOutboundIntegrationDeliveriesDto[] = [];

    for (const memo of outboundMemos) {
      const header = memo.outbound_integration_ir_req;
      if (!header) {
        continue;
      }

      const lines = header.lines ?? [];
      if (!lines.length) {
        throw new BadRequestException(
          `Outbound integration IR req ${header.id} has no lines for ship confirm (memo ${memo.id})`,
        );
      }

      if (header.so_header_id == null) {
        throw new BadRequestException(
          `SO header id is required for memo ${memo.id} (${memo.outbound_memo_number ?? 'N/A'}) for ship confirm`,
        );
      }

      const headerForMapping: OutboundIntegrationIrReq = {
        ...header,
        outbound_memo_id: header.outbound_memo_id ?? memo.id,
      };

      for (const line of lines) {
        deliveryDtos.push(
          this.mapMutasiSoInternalLineToDelivery(shipConfirmData, headerForMapping, line, memo),
        );
      }
    }

    if (!deliveryDtos.length) {
      throw new BadRequestException('No delivery rows to create for ship confirm');
    }

    return await this.insertIntegrationDeliveriesByType(shipConfirmData.id, deliveryDtos);
  }

  /**
   * Insert or update staging rows scoped to the DTO transaction type(s) only.
   * Pick release and ship confirm rows for the same memo item remain separate logs.
   */
  private async insertIntegrationDeliveriesByType(
    outboundDoId: string,
    deliveryDtos: CreateOutboundIntegrationDeliveriesDto[],
    scopedMemoItemIds?: string[],
  ): Promise<OutboundIntegrationDeliveries[]> {
    const targetTypes = [
      ...new Set(
        deliveryDtos
          .map((dto) => dto.transaction_type)
          .filter((type): type is ShipConfirmInternalTransactionType => type != null),
      ),
    ];

    const existingRows =
      await this.outboundIntegrationDeliveriesRepository.findByOutboundDoIdAndTransactionTypes(
        outboundDoId,
        targetTypes,
      );
    const existingByKey = new Map(
      existingRows.map((row) => [this.buildIntegrationDeliveryKey(row), row]),
    );

    for (const dto of deliveryDtos) {
      const existing =
        existingByKey.get(this.buildIntegrationDeliveryKey(dto)) ??
        this.findExistingIntegrationDelivery(existingRows, dto);

      if (existing) {
        const merged = this.mergeIntegrationDeliveryUpsert(existing, dto);
        await this.outboundIntegrationDeliveriesRepository.update(existing.id, merged);
        existingByKey.set(this.buildIntegrationDeliveryKey(dto), {
          ...existing,
          ...merged,
        } as OutboundIntegrationDeliveries);
        continue;
      }

      const created = await this.outboundIntegrationDeliveriesRepository.create(dto);
      existingByKey.set(this.buildIntegrationDeliveryKey(dto), created);
    }

    const latestRows =
      await this.outboundIntegrationDeliveriesRepository.findByOutboundDoIdAndTransactionTypes(
        outboundDoId,
        targetTypes,
      );

    if (!scopedMemoItemIds?.length) {
      return latestRows;
    }

    const memoItemIdSet = new Set(scopedMemoItemIds);
    return latestRows.filter(
      (row) => row.outbound_memo_item_id && memoItemIdSet.has(row.outbound_memo_item_id),
    );
  }

  /**
   * Re-running create must not wipe Oracle progress already polled into staging
   * (delivery_id / request ids / terminal S|E statuses).
   */
  private mergeIntegrationDeliveryUpsert(
    existing: OutboundIntegrationDeliveries,
    dto: CreateOutboundIntegrationDeliveriesDto,
  ): CreateOutboundIntegrationDeliveriesDto {
    const merged: CreateOutboundIntegrationDeliveriesDto = { ...dto };
    const terminal = new Set(['S', 'E']);

    const statusPairs: Array<{
      status: keyof CreateOutboundIntegrationDeliveriesDto;
      message: keyof CreateOutboundIntegrationDeliveriesDto;
    }> = [
      { status: 'create_delivery_status', message: 'create_delivery_message' },
      { status: 'update_delivery_status', message: 'update_delivery_message' },
      { status: 'pick_release_status', message: 'pick_release_message' },
      { status: 'ship_confirm_status', message: 'ship_confirm_message' },
    ];

    for (const { status, message } of statusPairs) {
      const current = existing[status as keyof OutboundIntegrationDeliveries];
      if (typeof current === 'string' && terminal.has(current.toUpperCase())) {
        (merged as Record<string, unknown>)[status] = current;
        const currentMessage = existing[message as keyof OutboundIntegrationDeliveries];
        if (currentMessage != null) {
          (merged as Record<string, unknown>)[message] = currentMessage;
        }
      }
    }

    if (existing.delivery_id != null) {
      merged.delivery_id = existing.delivery_id;
    }
    if (existing.delivery_name) {
      merged.delivery_name = existing.delivery_name;
    }
    if (existing.iface_id != null) {
      merged.iface_id = existing.iface_id;
    }
    if (existing.pick_release_request_id != null) {
      merged.pick_release_request_id = existing.pick_release_request_id;
    }
    if (existing.ship_confirm_request_id != null) {
      merged.ship_confirm_request_id = existing.ship_confirm_request_id;
    }

    return merged;
  }

  private findExistingIntegrationDelivery(
    existingRows: OutboundIntegrationDeliveries[],
    dto: CreateOutboundIntegrationDeliveriesDto,
  ): OutboundIntegrationDeliveries | undefined {
    if (!dto.outbound_memo_item_id || !dto.transaction_type) {
      return undefined;
    }

    const memoId = dto.outbound_memo_id ?? dto.source_header_id;

    if (
      dto.transaction_type !== ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_SHIP_CONFIRM &&
      dto.transaction_type !== ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_PICK_RELEASE
    ) {
      return undefined;
    }

    return existingRows.find(
      (row) =>
        row.transaction_type === dto.transaction_type &&
        row.outbound_memo_item_id === dto.outbound_memo_item_id &&
        (row.outbound_memo_id ?? row.source_header_id) === memoId,
    );
  }

  private buildIntegrationDeliveryKey(
    row: Pick<
      CreateOutboundIntegrationDeliveriesDto,
      | 'transaction_type'
      | 'outbound_memo_item_id'
      | 'outbound_memo_id'
      | 'source_header_id'
      | 'iso_header_id'
      | 'iso_inventory_item_id'
      | 'iso_organization_id'
      | 'delivery_id'
      | 'delivery_name'
    >,
  ): string {
    if (
      row.transaction_type === ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_SHIP_CONFIRM ||
      row.transaction_type === ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_PICK_RELEASE
    ) {
      return [
        row.transaction_type,
        row.outbound_memo_item_id ?? 'null',
        row.outbound_memo_id ?? row.source_header_id ?? 'null',
      ].join('|');
    }

    return [
      row.transaction_type ?? 'null',
      row.outbound_memo_item_id ?? 'null',
      row.source_header_id ?? 'null',
      row.iso_header_id ?? 'null',
      row.iso_inventory_item_id ?? 'null',
      row.iso_organization_id ?? 'null',
      row.delivery_id ?? 'null',
      row.delivery_name ?? 'null',
    ].join('|');
  }

  private mapMutasiSoInternalLineToDelivery(
    shipConfirmData: ShipConfirmInternalQueryResult,
    header: OutboundIntegrationIrReq,
    line: OutboundIntegrationIrReqLines,
    outboundMemo: OutboundMemo,
  ): CreateOutboundIntegrationDeliveriesDto {
    const deliveryAttributes = this.buildOutboundIntegrationDeliveryAttributes(
      shipConfirmData,
      outboundMemo,
    );

    return {
      organization_id: header.organization_id ?? undefined,
      outbound_do_id: shipConfirmData.id,
      outbound_memo_id: header.outbound_memo_id ?? outboundMemo.id,
      outbound_memo_item_id: line.outbound_memo_item_id ?? undefined,
      transaction_type: ShipConfirmInternalTransactionType.OUTBOUND_GS_MUTASI_SO_INTERNAL,
      source_system: 'WMS',
      source_header_id: outboundMemo.id,
      source_line_id: line.source_line_id ?? undefined,
      iso_header_id: header.so_header_id,
      iso_line_id: line.so_line_id ?? undefined,
      iso_inventory_item_id: line.inventory_item_id ?? undefined,
      create_delivery_status: 'U',
      update_delivery_status: 'U',
      pick_release_status: 'U',
      ship_confirm_status: 'U',
      ...deliveryAttributes,
    };
  }

  private copyStagedDeliveryAttributes(
    delivery: Pick<
      OutboundIntegrationDeliveries,
      | 'delivery_attribute_category'
      | 'delivery_attribute6'
      | 'delivery_attribute7'
      | 'delivery_attribute8'
      | 'delivery_attribute9'
      | 'delivery_attribute10'
      | 'delivery_attribute11'
      | 'delivery_attribute12'
      | 'delivery_attribute13'
      | 'delivery_attribute14'
      | 'delivery_attribute15'
    >,
  ): Pick<
    CreateOutboundIntegrationDeliveriesDto,
    | 'delivery_attribute_category'
    | 'delivery_attribute6'
    | 'delivery_attribute7'
    | 'delivery_attribute8'
    | 'delivery_attribute9'
    | 'delivery_attribute10'
    | 'delivery_attribute11'
    | 'delivery_attribute12'
    | 'delivery_attribute13'
    | 'delivery_attribute14'
    | 'delivery_attribute15'
  > {
    return {
      delivery_attribute_category: delivery.delivery_attribute_category,
      delivery_attribute6: delivery.delivery_attribute6,
      delivery_attribute7: delivery.delivery_attribute7,
      delivery_attribute8: delivery.delivery_attribute8,
      delivery_attribute9: delivery.delivery_attribute9,
      delivery_attribute10: delivery.delivery_attribute10,
      delivery_attribute11: delivery.delivery_attribute11,
      delivery_attribute12: delivery.delivery_attribute12,
      delivery_attribute13: delivery.delivery_attribute13,
      delivery_attribute14: delivery.delivery_attribute14,
      delivery_attribute15: delivery.delivery_attribute15,
    };
  }

  /** Staged row → Oracle DELIVERY_ATTRIBUTE* (shared by mutasi + subdist pick release payloads). */
  private mapStagedDeliveryToOracleDeliveryAttributes(
    delivery: Pick<
      OutboundIntegrationDeliveries,
      | 'delivery_attribute_category'
      | 'delivery_attribute6'
      | 'delivery_attribute7'
      | 'delivery_attribute8'
      | 'delivery_attribute9'
      | 'delivery_attribute10'
      | 'delivery_attribute11'
      | 'delivery_attribute12'
      | 'delivery_attribute13'
      | 'delivery_attribute14'
      | 'delivery_attribute15'
    >,
  ): Pick<
    CreateShipConfirmInternalDto,
    | 'DELIVERY_ATTRIBUTE_CATEGORY'
    | 'DELIVERY_ATTRIBUTE6'
    | 'DELIVERY_ATTRIBUTE7'
    | 'DELIVERY_ATTRIBUTE8'
    | 'DELIVERY_ATTRIBUTE9'
    | 'DELIVERY_ATTRIBUTE10'
    | 'DELIVERY_ATTRIBUTE11'
    | 'DELIVERY_ATTRIBUTE12'
    | 'DELIVERY_ATTRIBUTE13'
    | 'DELIVERY_ATTRIBUTE14'
    | 'DELIVERY_ATTRIBUTE15'
  > {
    return {
      DELIVERY_ATTRIBUTE_CATEGORY: this.normalizeDeliveryAttributeCategory(
        delivery.delivery_attribute_category,
      ),
      DELIVERY_ATTRIBUTE6: delivery.delivery_attribute6,
      DELIVERY_ATTRIBUTE7: delivery.delivery_attribute7,
      DELIVERY_ATTRIBUTE8: delivery.delivery_attribute8,
      DELIVERY_ATTRIBUTE9: delivery.delivery_attribute9,
      DELIVERY_ATTRIBUTE10: delivery.delivery_attribute10,
      DELIVERY_ATTRIBUTE11: delivery.delivery_attribute11,
      DELIVERY_ATTRIBUTE12: delivery.delivery_attribute12,
      DELIVERY_ATTRIBUTE13: delivery.delivery_attribute13,
      DELIVERY_ATTRIBUTE14: delivery.delivery_attribute14,
      DELIVERY_ATTRIBUTE15: delivery.delivery_attribute15,
    };
  }

  /** Shared DO + memo delivery attributes for WMS staging (mutasi + subdist pick release). */
  private buildOutboundIntegrationDeliveryAttributes(
    outboundDo: Pick<
      OutboundDo,
      | 'delivery_category'
      | 'vendor_id'
      | 'driver_name'
      | 'license_plate'
      | 'seal_number'
      | 'truck_utilitas'
      | 'container_number'
      | 'vendor_po_number'
      | 'delivery_date'
      | 'qty_utilitas'
      | 'type_calculation'
    >,
    outboundMemo?: Pick<OutboundMemo, 'delivery_attribute14'>,
  ): Pick<
    CreateOutboundIntegrationDeliveriesDto,
    | 'delivery_attribute_category'
    | 'delivery_attribute6'
    | 'delivery_attribute7'
    | 'delivery_attribute8'
    | 'delivery_attribute9'
    | 'delivery_attribute10'
    | 'delivery_attribute11'
    | 'delivery_attribute12'
    | 'delivery_attribute13'
    | 'delivery_attribute14'
    | 'delivery_attribute15'
  > {
    const delivery_attribute_category = this.normalizeDeliveryAttributeCategory(
      outboundDo.delivery_category,
    );

    return {
      delivery_attribute_category,
      delivery_attribute6: outboundDo.vendor_id,
      delivery_attribute7: outboundDo.driver_name,
      delivery_attribute8: outboundDo.license_plate,
      delivery_attribute9: outboundDo.seal_number,
      delivery_attribute10: outboundDo.truck_utilitas,
      delivery_attribute11: outboundDo.container_number,
      delivery_attribute12: outboundDo.vendor_po_number,
      delivery_attribute13: outboundDo.delivery_date
        ? new Date(outboundDo.delivery_date).toISOString()
        : undefined,
      delivery_attribute14: this.resolveDeliveryAttribute14ByExpeditionCategory(
        delivery_attribute_category,
        outboundDo,
        outboundMemo,
      ),
      delivery_attribute15: outboundDo.type_calculation,
    };
  }

  /**
   * Ekspedisi Eksternal: Quantity Utilitas (%) from outbound_memo.delivery_attribute14.
   * Other categories: qty_utilitas on outbound DO.
   */
  private resolveDeliveryAttribute14ByExpeditionCategory(
    category: DeliveryAttributeCategory,
    outboundDo: Pick<OutboundDo, 'qty_utilitas'>,
    outboundMemo?: Pick<OutboundMemo, 'delivery_attribute14'>,
  ): string | undefined {
    if (category === DeliveryAttributeCategory.EKSPEDISI_EKSTERNAL) {
      const fromMemo = outboundMemo?.delivery_attribute14?.trim();
      return fromMemo || undefined;
    }

    return outboundDo.qty_utilitas != null ? String(outboundDo.qty_utilitas) : undefined;
  }

  /** Maps outbound_do.delivery_category to one of three expedition categories. */
  private normalizeDeliveryAttributeCategory(
    deliveryCategory?: string | null,
  ): DeliveryAttributeCategory {
    const raw = deliveryCategory?.trim();
    if (!raw) {
      return DeliveryAttributeCategory.EKSPEDISI_VENDOR;
    }

    const allowed = Object.values(DeliveryAttributeCategory) as string[];
    if (allowed.includes(raw)) {
      return raw as DeliveryAttributeCategory;
    }

    return DeliveryAttributeCategory.EKSPEDISI_VENDOR;
  }
}
