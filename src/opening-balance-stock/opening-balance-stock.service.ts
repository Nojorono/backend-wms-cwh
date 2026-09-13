import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import {
  OpeningBalanceStockItemData,
  OpeningBalanceStockRepository,
} from './opening-balance-stock.repository';
import { CreateOpeningBalanceStockDto } from './dto/create-opening-balance-stock.dto';
import { CreateOpeningBalanceStockItemDto } from './dto/create-opening-balance-stock-item.dto';
import { UpdateOpeningBalanceStockDto } from './dto/update-opening-balance-stock.dto';
import { OpeningBalanceStockPaginationDto } from './dto/opening-balance-stock-pagination.dto';
import {
  OpeningBalanceStock,
  OpeningBalanceStockSource,
  OpeningBalanceStockStatus,
} from '../core/domain/entities/opening-balance-stock.entity';
import { OpeningBalanceStockItem } from '../core/domain/entities/opening-balance-stock-item.entity';
import { UpdateOpeningBalanceStockStatusDto } from './dto/update-opening-balance-stock-status.dto';
import { MasterItem } from '../core/domain/entities/master-item.entity';
import { MasterWarehouseSub } from '../core/domain/entities/master-warehouse-sub.entity';
import { MasterWarehouseBin } from '../core/domain/entities/master-warehouse-bin.entity';
import { MasterPallet } from '../core/domain/entities/master-pallet.entity';
import {
  InventoryTracking,
  ProgressionStatus,
} from '../core/domain/entities/inventory-tracking.entity';
import {
  QuantityOperationType,
  StatusInventory,
} from '../core/domain/entities/transaction-pallet-history.entity';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { PaginationService } from '../core/services/pagination.service';
import { MasterPalletService } from '../master-pallet/master-pallet.service';
import { InventoryTrackingService } from '../inventory-tracking/inventory-tracking.service';

export interface OpeningBalanceStockExcelFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/** Excel template column headers (also used to parse uploads). */
export const OPENING_BALANCE_STOCK_TEMPLATE_HEADERS = [
  'ITEM_CODE',
  'WAREHOUSE_SUB_CODE',
  'WAREHOUSE_BIN_CODE',
  'PALLET_CODE',
  'QUANTITY',
  'UOM',
  'PRODUCTION_DATE',
  'WEEK_NUMBER',
  'NOTES',
] as const;

interface CodeResolutionMaps {
  items: Map<string, MasterItem>;
  warehouseSubs: Map<string, MasterWarehouseSub>;
  warehouseBins: Map<string, MasterWarehouseBin>;
  pallets: Map<string, MasterPallet>;
}

@Injectable()
export class OpeningBalanceStockService {
  constructor(
    private readonly repository: OpeningBalanceStockRepository,
    private readonly paginationService: PaginationService,
    @InjectRepository(MasterItem)
    private readonly masterItemRepository: Repository<MasterItem>,
    @InjectRepository(MasterWarehouseSub)
    private readonly masterWarehouseSubRepository: Repository<MasterWarehouseSub>,
    @InjectRepository(MasterWarehouseBin)
    private readonly masterWarehouseBinRepository: Repository<MasterWarehouseBin>,
    @InjectRepository(MasterPallet)
    private readonly masterPalletRepository: Repository<MasterPallet>,
    @InjectRepository(InventoryTracking)
    private readonly inventoryTrackingRepository: Repository<InventoryTracking>,
    private readonly masterPalletService: MasterPalletService,
    private readonly inventoryTrackingService: InventoryTrackingService,
  ) {}

  async create(
    createDto: CreateOpeningBalanceStockDto,
  ): Promise<OpeningBalanceStock> {
    const { code, items, period_date, ...rest } = createDto;

    if (!items?.length) {
      throw new BadRequestException('At least one item is required');
    }

    const finalCode = await this.resolveFinalCode(code);
    const draftItems = this.mapItemsToDraftPayload(items);

    return await this.repository.create({
      ...rest,
      code: finalCode,
      period_date: period_date ? new Date(period_date) : undefined,
      items: draftItems,
    });
  }

  async findAll(): Promise<OpeningBalanceStock[]> {
    return await this.repository.findAll();
  }

  async findAllWithPagination(
    paginationDto: OpeningBalanceStockPaginationDto,
  ): Promise<PaginatedResponseDto<OpeningBalanceStock>> {
    const result = await this.repository.findAllWithFilters(paginationDto);
    return this.paginationService.createPaginatedResponse(
      result.data,
      paginationDto,
      result.total,
    );
  }

  async findOne(id: string): Promise<OpeningBalanceStock> {
    if (!id) {
      throw new BadRequestException('Opening balance stock ID is required');
    }
    const openingBalanceStock = await this.repository.findOne(id);
    if (!openingBalanceStock) {
      throw new NotFoundException(`Opening balance stock with ID ${id} not found`);
    }
    return openingBalanceStock;
  }

  async findByCode(code: string): Promise<OpeningBalanceStock> {
    if (!code) {
      throw new BadRequestException('Code is required');
    }
    const openingBalanceStock = await this.repository.findByCode(code);
    if (!openingBalanceStock) {
      throw new NotFoundException(`Opening balance stock with code ${code} not found`);
    }
    return openingBalanceStock;
  }

  async updateStatus(
    id: string,
    dto: UpdateOpeningBalanceStockStatusDto,
  ): Promise<OpeningBalanceStock> {
    if (!id) {
      throw new BadRequestException('Opening balance stock ID is required');
    }

    const existing = await this.findOne(id);
    this.validateStatusTransition(existing.status, dto.status);

    if (dto.status === OpeningBalanceStockStatus.CONFIRMED) {
      return this.confirmWithResolvedItems(id, existing);
    }

    const updated = await this.repository.update(id, { status: dto.status });
    if (!updated) {
      throw new NotFoundException(`Opening balance stock with ID ${id} not found`);
    }
    return updated;
  }

  /** Confirm opening balance — DRAFT → CONFIRMED, resolves codes to master records. */
  async confirm(id: string): Promise<OpeningBalanceStock> {
    const existing = await this.findOne(id);
    this.validateStatusTransition(existing.status, OpeningBalanceStockStatus.CONFIRMED);
    return this.confirmWithResolvedItems(id, existing);
  }

  /** Cancel opening balance — DRAFT → CANCELLED. */
  async cancel(id: string): Promise<OpeningBalanceStock> {
    return this.updateStatus(id, { status: OpeningBalanceStockStatus.CANCELLED });
  }

  async update(
    id: string,
    updateDto: UpdateOpeningBalanceStockDto,
  ): Promise<OpeningBalanceStock> {
    if (!id) {
      throw new BadRequestException('Opening balance stock ID is required');
    }

    const existing = await this.findOne(id);

    if (existing.status === OpeningBalanceStockStatus.CONFIRMED) {
      throw new BadRequestException(
        'Cannot update opening balance stock that is already CONFIRMED',
      );
    }

    if (existing.status === OpeningBalanceStockStatus.CANCELLED) {
      throw new BadRequestException(
        'Cannot update opening balance stock that is CANCELLED',
      );
    }

    if (updateDto.status !== undefined) {
      throw new BadRequestException(
        'Use PATCH /opening-balance-stock/:id/status or POST /opening-balance-stock/:id/confirmed to change status',
      );
    }

    if (updateDto.code) {
      const existing = await this.repository.findByCode(updateDto.code);
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Opening balance stock with code ${updateDto.code} already exists`,
        );
      }
    }

    const { items, period_date, ...header } = updateDto;

    const draftItems =
      items !== undefined ? this.mapItemsToDraftPayload(items) : undefined;

    const updated = await this.repository.update(
      id,
      {
        ...header,
        ...(period_date !== undefined
          ? { period_date: period_date ? new Date(period_date) : undefined }
          : {}),
      },
      draftItems,
    );

    if (!updated) {
      throw new NotFoundException(`Opening balance stock with ID ${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    if (!id) {
      throw new BadRequestException('Opening balance stock ID is required');
    }
    await this.findOne(id);
    await this.repository.remove(id);
  }

  async generateCode(year?: number): Promise<string> {
    return await this.repository.getNextCode(year);
  }

  /**
   * Build an .xlsx template buffer with the expected columns and one example row.
   */
  generateTemplate(): Buffer {
    const headers = [...OPENING_BALANCE_STOCK_TEMPLATE_HEADERS];
    const exampleRow = [
      'ITM-0001',
      'WHS-A1',
      'BIN-A1-01',
      'PLT-0001',
      100,
      'PCS',
      '2026-01-15',
      3,
      'Initial opening balance',
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
    worksheet['!cols'] = headers.map(() => ({ wch: 20 }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'OpeningBalanceStock');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  /**
   * Parse an uploaded Excel file and persist it as a single opening balance document.
   */
  async uploadExcel(
    file: OpeningBalanceStockExcelFile,
    header: Omit<CreateOpeningBalanceStockDto, 'items' | 'source'>,
  ): Promise<OpeningBalanceStock> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedMimeTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase() || '';
    const allowedExtensions = ['xls', 'xlsx'];

    if (
      !allowedMimeTypes.includes(file.mimetype) &&
      !allowedExtensions.includes(fileExtension)
    ) {
      throw new BadRequestException('Only Excel files (.xls, .xlsx) are allowed');
    }

    const items = this.extractItemsFromExcel(file.buffer);
    if (!items.length) {
      throw new BadRequestException('No data rows found in the Excel file');
    }

    const finalCode = await this.resolveFinalCode(header.code);
    const draftItems = this.mapItemsToDraftPayload(items);

    return await this.repository.create({
      document: header.document,
      organization_id: header.organization_id,
      period_date: header.period_date ? new Date(header.period_date) : undefined,
      week_number: header.week_number,
      notes: header.notes,
      status: header.status,
      source: OpeningBalanceStockSource.EXCEL,
      file_name: file.originalname,
      code: finalCode,
      items: draftItems,
    });
  }

  /**
   * On confirm: resolve business codes → master FKs, persist lines, then set CONFIRMED.
   */
  private async confirmWithResolvedItems(
    id: string,
    existing: OpeningBalanceStock,
  ): Promise<OpeningBalanceStock> {
    const lineItems = existing.openingBalanceStockItems ?? [];
    if (!lineItems.length) {
      throw new BadRequestException(
        'Cannot confirm opening balance stock without line items',
      );
    }

    const resolvedItems = await this.resolveItems(
      this.mapStoredItemsToResolveInput(lineItems),
    );

    await this.applyResolvedItemsToInventory(resolvedItems, id);

    const updated = await this.repository.update(
      id,
      { status: OpeningBalanceStockStatus.CONFIRMED },
      resolvedItems,
    );

    if (!updated) {
      throw new NotFoundException(`Opening balance stock with ID ${id} not found`);
    }
    return updated;
  }

  /**
   * Post opening balance to warehouse: empty pallet → set qty; create/update inventory tracking.
   */
  private async applyResolvedItemsToInventory(
    lines: OpeningBalanceStockItemData[],
    openingBalanceStockId: string,
  ): Promise<void> {
    for (const [index, line] of lines.entries()) {
      const rowNo = index + 1;

      if (!line.pallet_id || !line.pallet_code?.trim()) {
        throw new BadRequestException(
          `Row ${rowNo}: pallet_code is required to confirm opening balance`,
        );
      }
      if (!line.item_id) {
        throw new BadRequestException(`Row ${rowNo}: item_code "${line.item_code}" not resolved`);
      }
      if (!line.warehouse_sub_id) {
        throw new BadRequestException(
          `Row ${rowNo}: warehouse_sub_code is required to confirm opening balance`,
        );
      }

      const pallet = await this.masterPalletRepository.findOne({
        where: { id: line.pallet_id },
      });
      if (!pallet) {
        throw new BadRequestException(`Row ${rowNo}: pallet "${line.pallet_code}" not found`);
      }

      const currentQty = pallet.currentQuantity ?? 0;
      if (currentQty > 0) {
        throw new BadRequestException(
          `Row ${rowNo}: pallet "${line.pallet_code}" is not empty (current quantity ${currentQty})`,
        );
      }

      const warehouseSub = await this.masterWarehouseSubRepository.findOne({
        where: { id: line.warehouse_sub_id },
      });

      await this.masterPalletService.updateQuantity(line.pallet_id, {
        item_id: line.item_id,
        quantity: line.quantity ?? 0,
        operation_type: QuantityOperationType.ADJUST,
        reference_id: openingBalanceStockId,
        reference_type: 'OPENING_BALANCE_STOCK',
        notes: line.notes ?? 'Opening balance stock confirm',
        uom: line.uom,
        production_date: line.production_date,
        week_number: line.week_number,
        status_inventory: StatusInventory.READY,
      });

      const existingTracking = await this.inventoryTrackingRepository.findOne({
        where: { pallet_id: line.pallet_id },
      });

      const trackingPayload = {
        warehouse_id: warehouseSub?.warehouse_id ?? undefined,
        warehouse_sub_id: line.warehouse_sub_id,
        warehouse_bin_id: line.warehouse_bin_id ?? undefined,
        inventory_status: 'IN_INVENTORY',
        inventory_note: 'Opening balance stock',
        inventory_date: new Date(),
        progression_status: ProgressionStatus.COMPLETED,
      };

      if (existingTracking) {
        await this.inventoryTrackingService.update(existingTracking.id, trackingPayload);
      } else {
        await this.inventoryTrackingService.create({
          pallet_id: line.pallet_id,
          ...trackingPayload,
        });
      }
    }
  }

  /** Draft lines — store codes only; master FKs are filled on confirm. */
  private mapItemsToDraftPayload(
    items: CreateOpeningBalanceStockItemDto[],
  ): OpeningBalanceStockItemData[] {
    if (!items.length) {
      throw new BadRequestException('At least one item is required');
    }

    const errors: string[] = [];
    const draftItems = items.map((item, index) => {
      const rowNo = index + 1;
      const itemCode = item.item_code?.trim();

      if (!itemCode) {
        errors.push(`Row ${rowNo}: item_code is required`);
      }
      if (item.quantity === undefined || item.quantity === null) {
        errors.push(`Row ${rowNo}: quantity is required`);
      }

      return {
        item_code: itemCode,
        warehouse_sub_code: item.warehouse_sub_code?.trim() || undefined,
        warehouse_bin_code: item.warehouse_bin_code?.trim() || undefined,
        pallet_code: item.pallet_code?.trim() || undefined,
        quantity: item.quantity,
        uom: item.uom,
        production_date: item.production_date ? new Date(item.production_date) : undefined,
        week_number: item.week_number,
        notes: item.notes,
      };
    });

    if (errors.length) {
      throw new BadRequestException(errors);
    }

    return draftItems;
  }

  private mapStoredItemsToResolveInput(
    items: OpeningBalanceStockItem[],
  ): CreateOpeningBalanceStockItemDto[] {
    return items.map((item) => ({
      item_code: item.item_code,
      warehouse_sub_code: item.warehouse_sub_code,
      warehouse_bin_code: item.warehouse_bin_code,
      pallet_code: item.pallet_code,
      quantity: item.quantity,
      uom: item.uom,
      production_date: this.formatDateOnly(item.production_date),
      week_number: item.week_number,
      notes: item.notes,
    }));
  }

  /** PostgreSQL `date` columns may load as string — normalize to YYYY-MM-DD. */
  private formatDateOnly(value: Date | string | null | undefined): string | undefined {
    if (value == null || value === '') {
      return undefined;
    }
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    const trimmed = String(value).trim();
    if (!trimmed) {
      return undefined;
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.split('T')[0];
    }
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }
    return parsed.toISOString().split('T')[0];
  }

  private validateStatusTransition(
    currentStatus: OpeningBalanceStockStatus | undefined,
    newStatus: OpeningBalanceStockStatus,
  ): void {
    const current = currentStatus ?? OpeningBalanceStockStatus.DRAFT;

    if (current === newStatus) {
      return;
    }

    const validTransitions: Record<OpeningBalanceStockStatus, OpeningBalanceStockStatus[]> = {
      [OpeningBalanceStockStatus.DRAFT]: [
        OpeningBalanceStockStatus.CONFIRMED,
        OpeningBalanceStockStatus.CANCELLED,
      ],
      [OpeningBalanceStockStatus.CONFIRMED]: [],
      [OpeningBalanceStockStatus.CANCELLED]: [],
    };

    const allowed = validTransitions[current] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot change status from ${current} to ${newStatus}`,
      );
    }
  }

  private async resolveFinalCode(code?: string): Promise<string> {
    if (!code) {
      return await this.repository.getNextCode();
    }
    const existing = await this.repository.findByCode(code);
    if (existing) {
      throw new ConflictException(
        `Opening balance stock with code ${code} already exists`,
      );
    }
    return code;
  }

  /**
   * Resolve business codes (item / location / pallet) to master records and
   * produce persistable line payloads. Throws on any unknown code.
   */
  private async resolveItems(
    items: CreateOpeningBalanceStockItemDto[],
  ): Promise<OpeningBalanceStockItemData[]> {
    if (!items.length) {
      throw new BadRequestException('At least one item is required');
    }

    const maps = await this.buildCodeResolutionMaps(items);
    const errors: string[] = [];

    const resolved = items.map((item, index) => {
      const rowNo = index + 1;

      const itemCode = item.item_code?.trim();
      if (!itemCode) {
        errors.push(`Row ${rowNo}: item_code is required`);
      }
      const masterItem = itemCode ? maps.items.get(itemCode) : undefined;
      if (itemCode && !masterItem) {
        errors.push(`Row ${rowNo}: item_code "${itemCode}" not found`);
      }

      const warehouseSubCode = item.warehouse_sub_code?.trim();
      const masterWarehouseSub = warehouseSubCode
        ? maps.warehouseSubs.get(warehouseSubCode)
        : undefined;
      if (warehouseSubCode && !masterWarehouseSub) {
        errors.push(`Row ${rowNo}: warehouse_sub_code "${warehouseSubCode}" not found`);
      }

      const warehouseBinCode = item.warehouse_bin_code?.trim();
      const masterWarehouseBin = warehouseBinCode
        ? maps.warehouseBins.get(warehouseBinCode)
        : undefined;
      if (warehouseBinCode && !masterWarehouseBin) {
        errors.push(`Row ${rowNo}: warehouse_bin_code "${warehouseBinCode}" not found`);
      }

      const palletCode = item.pallet_code?.trim();
      const masterPallet = palletCode ? maps.pallets.get(palletCode) : undefined;
      if (palletCode && !masterPallet) {
        errors.push(`Row ${rowNo}: pallet_code "${palletCode}" not found`);
      }

      if (item.quantity === undefined || item.quantity === null) {
        errors.push(`Row ${rowNo}: quantity is required`);
      }

      const payload: OpeningBalanceStockItemData = {
        item_code: itemCode,
        warehouse_sub_code: warehouseSubCode || undefined,
        warehouse_bin_code: warehouseBinCode || undefined,
        pallet_code: palletCode || undefined,
        item_id: masterItem?.id,
        warehouse_sub_id: masterWarehouseSub?.id,
        warehouse_bin_id: masterWarehouseBin?.id,
        pallet_id: masterPallet?.id,
        quantity: item.quantity,
        uom: item.uom,
        production_date: item.production_date ? new Date(item.production_date) : undefined,
        week_number: item.week_number,
        notes: item.notes,
      };
      return payload;
    });

    if (errors.length) {
      throw new BadRequestException(errors);
    }

    return resolved;
  }

  private async buildCodeResolutionMaps(
    items: CreateOpeningBalanceStockItemDto[],
  ): Promise<CodeResolutionMaps> {
    const itemCodes = this.distinct(items.map((i) => i.item_code));
    const warehouseSubCodes = this.distinct(items.map((i) => i.warehouse_sub_code));
    const warehouseBinCodes = this.distinct(items.map((i) => i.warehouse_bin_code));
    const palletCodes = this.distinct(items.map((i) => i.pallet_code));

    const [masterItems, warehouseSubs, warehouseBins, pallets] = await Promise.all([
      itemCodes.length
        ? this.masterItemRepository.find({
            where: [{ item_number: In(itemCodes) }, { sku: In(itemCodes) }],
          })
        : Promise.resolve([] as MasterItem[]),
      warehouseSubCodes.length
        ? this.masterWarehouseSubRepository.find({ where: { code: In(warehouseSubCodes) } })
        : Promise.resolve([] as MasterWarehouseSub[]),
      warehouseBinCodes.length
        ? this.masterWarehouseBinRepository.find({ where: { code: In(warehouseBinCodes) } })
        : Promise.resolve([] as MasterWarehouseBin[]),
      palletCodes.length
        ? this.masterPalletRepository.find({ where: { pallet_code: In(palletCodes) } })
        : Promise.resolve([] as MasterPallet[]),
    ]);

    const items_ = new Map<string, MasterItem>();
    for (const mi of masterItems) {
      if (mi.item_number) items_.set(mi.item_number, mi);
      if (mi.sku && !items_.has(mi.sku)) items_.set(mi.sku, mi);
    }

    return {
      items: items_,
      warehouseSubs: new Map(warehouseSubs.filter((w) => w.code).map((w) => [w.code, w])),
      warehouseBins: new Map(warehouseBins.filter((w) => w.code).map((w) => [w.code, w])),
      pallets: new Map(pallets.filter((p) => p.pallet_code).map((p) => [p.pallet_code, p])),
    };
  }

  private distinct(values: (string | undefined | null)[]): string[] {
    const set = new Set<string>();
    for (const v of values) {
      const trimmed = v?.trim();
      if (trimmed) set.add(trimmed);
    }
    return [...set];
  }

  private extractItemsFromExcel(buffer: Buffer): CreateOpeningBalanceStockItemDto[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('Excel file has no sheets');
    }
    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      raw: false,
      defval: '',
    });

    const normalizeKey = (key: string): string =>
      key.trim().toUpperCase().replace(/\s+/g, '_');

    return rows
      .map((row) => {
        const normalized: Record<string, string> = {};
        for (const [key, value] of Object.entries(row)) {
          normalized[normalizeKey(key)] = value == null ? '' : String(value).trim();
        }
        return normalized;
      })
      .filter((row) => row['ITEM_CODE'])
      .map((row) => {
        const quantityRaw = row['QUANTITY'];
        const weekRaw = row['WEEK_NUMBER'];
        const item: CreateOpeningBalanceStockItemDto = {
          item_code: row['ITEM_CODE'],
          warehouse_sub_code: row['WAREHOUSE_SUB_CODE'] || undefined,
          warehouse_bin_code: row['WAREHOUSE_BIN_CODE'] || undefined,
          pallet_code: row['PALLET_CODE'] || undefined,
          quantity: quantityRaw ? Number(quantityRaw) : 0,
          uom: row['UOM'] || undefined,
          production_date: row['PRODUCTION_DATE'] || undefined,
          week_number: weekRaw ? Number(weekRaw) : undefined,
          notes: row['NOTES'] || undefined,
        };
        return item;
      });
  }
}
