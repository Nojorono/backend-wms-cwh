import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { MasterPalletRepository } from './master-pallet.repository';
import { CreateMasterPalletDto } from './dto/create-master-pallet.dto';
import { GeneratePalletRangeDto } from './dto/generate-pallet-range.dto';
import { UpdateMasterPalletDto } from './dto/update-master-pallet.dto';
import {
  UpdatePalletQuantityDto,
  UpdateProductionDateDto,
  UpdateUOMDto,
  PalletQuantityHistoryResponseDto,
  PalletCapacityValidationDto,
  PalletItemQuantityDto,
} from './dto/pallet-quantity.dto';
import { MasterPallet } from '../core/domain/entities/master-pallet.entity';
import {
  PalletTransactionHistory,
  QuantityOperationType,
  StatusInventory,
} from '../core/domain/entities/transaction-pallet-history.entity';
import { MasterItem } from 'src/core/domain/entities/master-item.entity';
import { InventoryTracking } from '../core/domain/entities/inventory-tracking.entity';
import { MasterWarehouseSub } from '../core/domain/entities/master-warehouse-sub.entity';
import { MasterWarehouseBin } from '../core/domain/entities/master-warehouse-bin.entity';
import { PaginationService } from '../core/services/pagination.service';
import { PalletHistoryPaginationDto } from './dto/pallet-history-pagination.dto';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';

@Injectable()
export class MasterPalletService {
  constructor(
    private readonly repository: MasterPalletRepository,
    @InjectRepository(PalletTransactionHistory)
    private readonly transactionHistoryRepository: Repository<PalletTransactionHistory>,
    @InjectRepository(InventoryTracking)
    private readonly inventoryTrackingRepository: Repository<InventoryTracking>,
    private readonly paginationService: PaginationService,
    private readonly dataSource: DataSource,
  ) { }

  async create(createMasterPalletDto: CreateMasterPalletDto): Promise<MasterPallet> {
    const existingPallet = await this.repository.findByPalletCode(
      createMasterPalletDto.pallet_code,
    );
    if (existingPallet) {
      throw new ConflictException(
        `Pallet with pallet code ${createMasterPalletDto.pallet_code} already exists`,
      );
    }

    const pallet = await this.repository.create({
      ...createMasterPalletDto,
    });

    return pallet;
  }

  async generateRange(dto: GeneratePalletRangeDto): Promise<MasterPallet[]> {
    const padding = dto.padding ?? 4;
    const isAscending = dto.start <= dto.end;

    if (!isAscending) {
      throw new BadRequestException('start must be less than or equal to end');
    }

    const total = dto.end - dto.start + 1;
    if (total > 10000) {
      throw new BadRequestException('Maximum allowed range is 10000 pallet codes per request');
    }

    const palletCodes = Array.from({ length: total }, (_, idx) => {
      const num = dto.start + idx;
      return `${dto.prefix}${String(num).padStart(padding, '0')}`;
    });

    const existing = await this.repository.findByPalletCodes(palletCodes);
    if (existing.length > 0) {
      const existingCodes = existing.map((item) => item.pallet_code).sort();
      throw new ConflictException(
        `Some pallet codes already exist: ${existingCodes.slice(0, 20).join(', ')}${existingCodes.length > 20 ? ' ...' : ''}`,
      );
    }

    const payloads: CreateMasterPalletDto[] = palletCodes.map((palletCode) => ({
      pallet_code: palletCode,
      organization_id: dto.organization_id,
      capacity: dto.capacity,
      isActive: dto.isActive ?? true,
      isFull: false,
      currentQuantity: 0,
      uom: dto.uom,
    }));

    return this.repository.createMany(payloads);
  }

  async findAll(): Promise<MasterPallet[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<MasterPallet> {
    const pallet = await this.repository.findOne(id);
    if (!pallet) {
      throw new NotFoundException(`Pallet with ID ${id} not found`);
    }
    return pallet;
  }

  async findByMemoId(memoId: string): Promise<MasterPallet> {
    const pallet = await this.repository.findByMemoId(memoId);
    if (!pallet) {
      throw new NotFoundException(`Pallet with memo ID ${memoId} not found`);
    }
    return pallet;
  }

  async findByPalletCode(palletCode: string): Promise<MasterPallet> {
    const pallet = await this.repository.findByPalletCode(palletCode);
    if (!pallet) {
      throw new NotFoundException(`Pallet with code ${palletCode} not found`);
    }
    return pallet;
  }

  async update(id: string, updateMasterPalletDto: UpdateMasterPalletDto): Promise<MasterPallet> {
    const pallet = await this.findOne(id);
    if (!pallet) {
      throw new NotFoundException('Pallet not found');
    }
    if (
      updateMasterPalletDto.pallet_code &&
      updateMasterPalletDto.pallet_code !== pallet.pallet_code
    ) {
      const existingPallet = await this.repository.findByPalletCode(
        updateMasterPalletDto.pallet_code,
      );
      if (existingPallet) {
        throw new ConflictException(
          `Pallet with pallet code ${updateMasterPalletDto.pallet_code} already exists`,
        );
      }
    }
    if (
      (updateMasterPalletDto.capacity && updateMasterPalletDto.capacity !== pallet.capacity) ||
      (updateMasterPalletDto.pallet_code &&
        updateMasterPalletDto.pallet_code !== pallet.pallet_code)
    ) {
    }
    const updatedPallet = await this.repository.update(id, updateMasterPalletDto);
    if (!updatedPallet) {
      throw new NotFoundException(`Pallet with ID ${id} not found`);
    }
    return updatedPallet;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }

  async updateQuantity(
    palletId: string,
    updateQuantityDto: UpdatePalletQuantityDto,
    _existingManager?: EntityManager,
  ): Promise<MasterPallet> {
    try {
      const pallet = await this.repository.findOne(palletId);
      if (!pallet) {
        throw new NotFoundException(`Pallet with ID ${palletId} not found`);
      }

      if (!pallet.capacity || pallet.capacity <= 0) {
        throw new BadRequestException('Pallet capacity must be set and greater than 0');
      }

      const currentItemQuantity = await this.getItemQuantityOnPallet(
        palletId,
        updateQuantityDto.item_id,
        updateQuantityDto.uom,
      );
      const totalPalletQuantity = pallet.currentQuantity ?? 0;

      // Validate UOM consistency if there's existing quantity for this item
      if (currentItemQuantity > 0 && updateQuantityDto.uom) {
        const existingUomRecord = await this.transactionHistoryRepository.findOne({
          where: {
            pallet_id: palletId,
            item_id: updateQuantityDto.item_id,
          },
          order: { createdAt: 'DESC' },
        });

        if (
          existingUomRecord &&
          existingUomRecord.uom &&
          existingUomRecord.uom !== updateQuantityDto.uom
        ) {
          throw new BadRequestException(
            `UOM mismatch. Existing UOM for this item is '${existingUomRecord.uom}', but provided UOM is '${updateQuantityDto.uom}'. Please use the same UOM for consistency.`,
          );
        }
      }

      if (updateQuantityDto.operation_type === QuantityOperationType.ADD) {
        if (updateQuantityDto.quantity < 0) {
          throw new BadRequestException('Quantity to add must be non-negative');
        }
      }
      if (updateQuantityDto.operation_type === QuantityOperationType.PICK) {
        if (updateQuantityDto.quantity < 0) {
          throw new BadRequestException('Quantity to pick must be non-negative');
        }
        if (updateQuantityDto.quantity > currentItemQuantity) {
          throw new BadRequestException(
            `Cannot pick ${updateQuantityDto.quantity}. Current item quantity on pallet is ${currentItemQuantity}`,
          );
        }
      }
      if (updateQuantityDto.operation_type === QuantityOperationType.REMOVE) {
        if (updateQuantityDto.quantity < 0) {
          throw new BadRequestException('Quantity to remove must be non-negative');
        }
        if (updateQuantityDto.quantity > currentItemQuantity) {
          throw new BadRequestException(
            `Cannot remove ${updateQuantityDto.quantity}. Current item quantity on pallet is ${currentItemQuantity}`,
          );
        }
      }
      if (updateQuantityDto.operation_type === QuantityOperationType.ADJUST) {
        if (updateQuantityDto.quantity < 0) {
          throw new BadRequestException('Adjusted item quantity cannot be negative');
        }
        const projectedTotal =
          totalPalletQuantity - currentItemQuantity + updateQuantityDto.quantity;
        if (projectedTotal > pallet.capacity) {
          throw new BadRequestException(
            `Adjusted total quantity ${projectedTotal} exceeds pallet capacity ${pallet.capacity}`,
          );
        }
      }

      let newItemQuantity: number;
      let quantityChange: number;

      switch (updateQuantityDto.operation_type) {
        case QuantityOperationType.MERGE:
          newItemQuantity = currentItemQuantity + updateQuantityDto.quantity;
          quantityChange = updateQuantityDto.quantity;
          break;
        case QuantityOperationType.SPLIT:
          newItemQuantity = currentItemQuantity - updateQuantityDto.quantity;
          quantityChange = -updateQuantityDto.quantity;
          break;
        case QuantityOperationType.ADD:
          newItemQuantity = currentItemQuantity + updateQuantityDto.quantity;
          quantityChange = updateQuantityDto.quantity;
          break;
        case QuantityOperationType.PICK:
          newItemQuantity = Math.max(0, currentItemQuantity - updateQuantityDto.quantity);
          quantityChange = -updateQuantityDto.quantity;
          if (updateQuantityDto.quantity > currentItemQuantity) {
            throw new BadRequestException(
              `Cannot pick ${updateQuantityDto.quantity}. Current item quantity on pallet is ${currentItemQuantity}`,
            );
          }
          break;
        case QuantityOperationType.REMOVE:
          newItemQuantity = Math.max(0, currentItemQuantity - updateQuantityDto.quantity);
          quantityChange = -updateQuantityDto.quantity;
          break;
        case QuantityOperationType.ADJUST:
          newItemQuantity = updateQuantityDto.quantity;
          quantityChange = newItemQuantity - currentItemQuantity;
          break;
        case QuantityOperationType.RESET:
          newItemQuantity = 0;
          quantityChange = -currentItemQuantity;
          break;
        default:
          throw new BadRequestException('Invalid operation type');
      }

      if (newItemQuantity < 0) {
        throw new BadRequestException('Item quantity cannot be negative');
      }

      const newTotalQuantity = totalPalletQuantity - currentItemQuantity + newItemQuantity;

      if (newTotalQuantity > pallet.capacity) {
        throw new BadRequestException(
          `Total pallet quantity ${newTotalQuantity} exceeds pallet capacity ${pallet.capacity}`,
        );
      }

      let updatedWeekNumber = pallet.currentWeekNumber ?? 0;

      const hasWeekInput =
        updateQuantityDto.week_number !== undefined && updateQuantityDto.week_number !== null;

      if (newTotalQuantity === 0) {
        updatedWeekNumber = 0;
      } else if (hasWeekInput) {
        updatedWeekNumber = updateQuantityDto.week_number as number;
      }

      // Update pallet
      await this.repository.update(palletId, {
        currentQuantity: newTotalQuantity,
        isFull: newTotalQuantity >= pallet.capacity,
        currentWeekNumber: updatedWeekNumber,
      } as any);

      if (updateQuantityDto.reference_type === 'PALLET_UPDATE_UOM') {
        await this.repository.update(palletId, {
          uom: updateQuantityDto.uom,
        } as any);
      }

      const productionDateStr =
        typeof updateQuantityDto.production_date === 'string'
          ? updateQuantityDto.production_date
          : updateQuantityDto.production_date?.toISOString();

      const historyEntity = this.transactionHistoryRepository.create({
        pallet_id: palletId,
        item_id: updateQuantityDto.item_id,
        previous_quantity: currentItemQuantity,
        quantity_change: quantityChange,
        new_quantity: newItemQuantity,
        operation_type: updateQuantityDto.operation_type,
        inbound_id: updateQuantityDto.inbound_id,
        outbound_do_id: updateQuantityDto.outbound_do_id,
        reference_id: updateQuantityDto.reference_id,
        reference_type: updateQuantityDto.reference_type,
        notes: updateQuantityDto.notes,
        user_id: updateQuantityDto.user_id,
        uom: updateQuantityDto.uom,
        production_date: productionDateStr,
        week_number: updateQuantityDto.week_number,
        status_inventory: updateQuantityDto.status_inventory,
      });
      await this.transactionHistoryRepository.save(historyEntity);

      const updatedPallet = await this.repository.findOne(palletId);
      if (!updatedPallet) {
        throw new NotFoundException(`Pallet with ID ${palletId} not found after update`);
      }

      if (updatedPallet.currentQuantity === 0) {
        const inventoryTracking = await this.inventoryTrackingRepository.findOne({
          where: { pallet_id: palletId },
        });
        if (inventoryTracking) {
          await this.inventoryTrackingRepository.update(inventoryTracking.id, {
            warehouse_sub_id: null as any,
            warehouse_bin_id: null as any,
            inventory_note: 'Pallet is empty',
          } as any);
        }
        await this.transactionHistoryRepository.delete({ pallet_id: palletId });
        await this.repository.update(palletId, {
          memo_id: null as any,
          currentWeekNumber: 0,
          currentQuantity: 0,
        } as any);
      }

      return updatedPallet;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      console.error(`Error updating pallet quantity for ${palletId}:`, error);
      throw new BadRequestException(
        `Failed to update pallet quantity: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async updateQuantityByPalletCode(
    palletCode: string,
    updateQuantityDto: UpdatePalletQuantityDto,
  ): Promise<MasterPallet> {
    const pallet = await this.repository.findByPalletCode(palletCode);
    if (!pallet) {
      throw new NotFoundException(`Pallet with code ${palletCode} not found`);
    }

    return this.updateQuantity(pallet.id, updateQuantityDto);
  }

  /**
   * Update production date for an item line on a pallet without changing quantity.
   * Marks all history rows matching item_id and production_date_before as UPDATED_PROD_DATE,
   * then creates a new ADJUST record with the new production_date (using the latest of those rows for quantity/week_number).
   */
  async updateProductionDate(
    palletId: string,
    dto: UpdateProductionDateDto,
  ): Promise<MasterPallet> {
    return await this.dataSource.transaction(async (manager) => {
      try {
        await this.findOne(palletId);

        const toDateOnly = (v: string | Date | undefined): string => {
          if (v == null) return '';
          const s = typeof v === 'string' ? v : (v as Date).toISOString?.() ?? '';
          return s.slice(0, 10);
        };
        const dateBefore = toDateOnly(dto.production_date_before);
        if (!dateBefore) {
          throw new BadRequestException(
            'production_date_before is required to identify which records to update.',
          );
        }

        // Match both date and date+1 day: API returns UTC (e.g. 2026-01-25T17:00:00Z) but DB
        // may store in local time (2026-01-26 00:00 in GMT+7). toDateOnly gives "2026-01-25".
        const qb = manager
          .getRepository(PalletTransactionHistory)
          .createQueryBuilder('h')
          .where('h.pallet_id = :palletId', { palletId })
          .andWhere('h.item_id = :itemId', { itemId: dto.item_id })
          .andWhere(
            `(h.production_date)::date IN (CAST(:dateBefore AS date), (CAST(:dateBefore AS date) + INTERVAL '1 day')::date)`,
            { dateBefore },
          )
          .orderBy('h.createdAt', 'DESC');
        if (dto.uom) {
          qb.andWhere('h.uom = :uom', { uom: dto.uom });
        }
        const rows = await qb.getMany();

        if (rows.length === 0) {
          throw new BadRequestException(
            `No quantity found for item ${dto.item_id}${dto.uom ? ` with UOM ${dto.uom}` : ''} with production date ${dateBefore} on pallet ${palletId}. Cannot update production date.`,
          );
        }

        const ids = rows.map((r) => r.id);
        await manager.update(
          PalletTransactionHistory,
          { id: In(ids) },
          { status_inventory: StatusInventory.UPDATED_PROD_DATE },
        );

        const latest = rows[0];
        if ((latest.new_quantity ?? 0) === 0) {
          throw new BadRequestException(
            `Latest record for item ${dto.item_id} with production date ${dateBefore} has zero quantity. Cannot update production date.`,
          );
        }

        const notes =
          dto.notes ??
          `Production date updated from ${dateBefore} to ${toDateOnly(dto.production_date_after)}`;

        return await this.updateQuantity(
          palletId,
          {
            item_id: dto.item_id,
            operation_type: QuantityOperationType.ADJUST,
            quantity: latest.new_quantity,
            uom: latest.uom ?? dto.uom,
            week_number: dto.week_number ?? latest.week_number ?? undefined,
            production_date: dto.production_date_after as Date,
            user_id: dto.user_id,
            notes,
            reference_id: dto.reference_id,
            reference_type: dto.reference_type ?? 'PALLET_UPDATE_PROD_DATE',
            status_inventory: StatusInventory.READY,
          },
          manager,
        );
      } catch (err) {
        if (
          err instanceof BadRequestException ||
          err instanceof NotFoundException
        ) {
          throw err;
        }
        throw new BadRequestException(
          `Failed to update production date: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    });
  }

  /**
   * Change UOM for an item line on a pallet: removes quantity from the current UOM
   * and adds the same quantity under the new UOM, preserving production_date and week_number.
   */
  async updateUOM(palletId: string, dto: UpdateUOMDto): Promise<MasterPallet> {
    return await this.dataSource.transaction(async () => {
      try {
        const pallet = await this.findOne(palletId);

        if (pallet.capacity < dto.to_quantity) {
          throw new BadRequestException(`Pallet capacity ${pallet.capacity} is less than the quantity to change ${dto.to_quantity}.`);
        }

        if (dto.from_uom === dto.to_uom) {
          throw new BadRequestException('from_uom and to_uom must be different');
        }

        const latest = await this.getLatestHistoryRecord(
          palletId,
          dto.item_id,
          dto.from_uom,
        );
        if (!latest || (latest.new_quantity ?? 0) === 0) {
          throw new BadRequestException(
            `No quantity found for item ${dto.item_id} with UOM ${dto.from_uom} on pallet ${palletId}. Cannot change UOM.`,
          );
        }

        const basePayload = {
          item_id: dto.item_id,
          user_id: dto.user_id,
          notes: dto.notes ?? 'UOM updated',
          reference_id: dto.reference_id,
          reference_type: dto.reference_type ?? 'PALLET_UPDATE_UOM',
          production_date: latest.production_date,
          week_number: latest.week_number ?? undefined,
          status_inventory: StatusInventory.READY,
        };

        await this.updateQuantity(palletId, {
          ...basePayload,
          operation_type: QuantityOperationType.REMOVE,
          quantity: dto.from_quantity,
          uom: dto.from_uom,
        });

        return await this.updateQuantity(palletId, {
          ...basePayload,
          operation_type: QuantityOperationType.ADD,
          quantity: dto.to_quantity,
          uom: dto.to_uom,
        });
      } catch (err) {
        if (
          err instanceof BadRequestException ||
          err instanceof NotFoundException
        ) {
          throw err;
        }
        throw new BadRequestException(
          `Failed to update UOM: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    });
  }

  async getQuantityHistory(palletId: string): Promise<PalletQuantityHistoryResponseDto[]> {
    const history = await this.transactionHistoryRepository
      .createQueryBuilder('history')
      .leftJoinAndMapOne('history.item', MasterItem, 'item', 'item.id = history.item_id::uuid')
      .where('history.pallet_id = :palletId', { palletId })
      .orderBy('history.createdAt', 'DESC')
      .getMany();

    return history.map((record: any) => ({
      id: record.id,
      pallet_id: record.pallet_id,
      item_id: record.item_id,
      item_name: record.item?.sku,
      previous_quantity: record.previous_quantity,
      quantity_change: record.quantity_change,
      new_quantity: record.new_quantity,
      operation_type: record.operation_type,
      reference_id: record.reference_id,
      reference_type: record.reference_type,
      notes: record.notes,
      user_id: record.user_id,
      uom: record.uom,
      createdAt: record.createdAt,
      production_date: record.production_date,
      week_number: record.week_number,
    }));
  }

  async getQuantityHistoryPaginated(
    palletId: string,
    paginationDto: PalletHistoryPaginationDto,
  ): Promise<PaginatedResponseDto<PalletQuantityHistoryResponseDto>> {
    const { page = 1, limit = 10, search, sortBy, sortOrder = 'DESC', operation_type } =
      paginationDto;

    const qb = this.transactionHistoryRepository
      .createQueryBuilder('history')
      .leftJoinAndMapOne('history.item', MasterItem, 'item', 'item.id = history.item_id::uuid')
      .where('history.pallet_id = :palletId', { palletId });

    if (operation_type) {
      qb.andWhere('history.operation_type = :operationType', {
        operationType: operation_type,
      });
    }

    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      qb.andWhere(
        `(
          LOWER(history.reference_id) LIKE :search OR
          LOWER(history.reference_type) LIKE :search OR
          LOWER(history.notes) LIKE :search OR
          LOWER(item.sku) LIKE :search
        )`,
        { search: searchTerm },
      );
    }

    const sortableFields: Record<string, string> = {
      createdAt: 'history.createdAt',
      updatedAt: 'history.updatedAt',
      quantity_change: 'history.quantity_change',
      new_quantity: 'history.new_quantity',
      previous_quantity: 'history.previous_quantity',
      operation_type: 'history.operation_type',
    };

    const defaultOrderField = 'history.createdAt';
    const orderField =
      sortBy && sortableFields[sortBy] ? sortableFields[sortBy] : defaultOrderField;
    const orderDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    qb.orderBy(orderField, orderDirection);

    const [entities, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const data = entities.map((record: any) => ({
      id: record.id,
      pallet_id: record.pallet_id,
      item_id: record.item_id,
      item_name: record.item?.sku,
      previous_quantity: record.previous_quantity,
      quantity_change: record.quantity_change,
      new_quantity: record.new_quantity,
      operation_type: record.operation_type,
      reference_id: record.reference_id,
      reference_type: record.reference_type,
      notes: record.notes,
      user_id: record.user_id,
      uom: record.uom,
      createdAt: record.createdAt,
      production_date: record.production_date,
      week_number: record.week_number,
    }));

    return this.paginationService.createPaginatedResponse(data, paginationDto, total);
  }

  async getItemQuantityHistory(
    palletId: string,
    itemId: string,
    uom?: string,
  ): Promise<PalletQuantityHistoryResponseDto[]> {
    await this.findOne(palletId);

    const qb = this.transactionHistoryRepository
      .createQueryBuilder('history')
      .leftJoinAndMapOne('history.item', MasterItem, 'item', 'item.id = history.item_id')
      .where('history.pallet_id = :palletId', { palletId })
      .andWhere('history.item_id = :itemId', { itemId });

    // Add UOM filtering if provided
    if (uom) {
      qb.andWhere('history.uom = :uom', { uom });
    }

    const history = await qb.orderBy('history.createdAt', 'DESC').getMany();

    return history.map((record: any) => ({
      id: record.id,
      pallet_id: record.pallet_id,
      item_id: record.item_id,
      item_name: record.item.sku,
      previous_quantity: record.previous_quantity,
      quantity_change: record.quantity_change,
      new_quantity: record.new_quantity,
      operation_type: record.operation_type,
      reference_id: record.reference_id,
      reference_type: record.reference_type,
      notes: record.notes,
      user_id: record.user_id,
      uom: record.uom,
      createdAt: record.createdAt,
      production_date: record.production_date,
      week_number: record.week_number,
    }));
  }

  async getPalletItemLatestQuantity(palletId: string): Promise<PalletItemQuantityDto[]> {
    const pallet = await this.repository.findOne(palletId);
    if (!pallet) {
      throw new NotFoundException(`Pallet with ID ${palletId} not found`);
    }

    // Auto-reset week number and memo_id when pallet has no quantity
    const currentQuantity = pallet.currentQuantity ?? 0;
    const currentWeekNumber = pallet.currentWeekNumber ?? 0;
    if (currentQuantity === 0) {
      const updateData: any = {
        isFull: false,
      };

      if (currentWeekNumber !== 0) {
        updateData.currentWeekNumber = 0;
        pallet.currentWeekNumber = 0;
      }

      if (pallet.memo_id != null) {
        updateData.memo_id = null;
        (pallet as any).memo_id = null;
      }

      if (Object.keys(updateData).length > 1) {
        await this.repository.update(palletId, updateData);
        pallet.isFull = false;
      }
    }

    // Latest per (item_id, uom) by createdAt only — so after production-date update we show
    // only the updated row, not the superseded week_number row.
    const qb = this.transactionHistoryRepository
      .createQueryBuilder('history')
      .leftJoinAndMapOne('history.item', MasterItem, 'item', 'item.id = history.item_id::uuid')
      .where('history.pallet_id = :palletId', { palletId })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('MAX(h2.createdAt)')
          .from('transaction_pallet_history', 'h2')
          .where('h2.item_id = history.item_id')
          .andWhere('h2.pallet_id = :palletId')
          .andWhere('h2.uom = history.uom') // Add UOM filtering
          .andWhere('h2.status_inventory IN (:...statusInventories)', {
            statusInventories: [StatusInventory.READY, StatusInventory.PENDING],
          })
          .andWhere('(h2.week_number = history.week_number OR (h2.week_number IS NULL AND history.week_number IS NULL))') // Include week_number in grouping
          .getQuery();
        return `history.createdAt = ${subQuery}`;
      })
      .setParameter('palletId', palletId)
      .setParameter('statusInventories', [StatusInventory.READY, StatusInventory.PENDING]);

    const results = await qb.getMany();

    // Get latest inventory tracking for the pallet to get location
    const latestInventory = await this.inventoryTrackingRepository
      .createQueryBuilder('inventory')
      .leftJoinAndMapOne('inventory.warehouseSub', MasterWarehouseSub, 'warehouseSub', 'warehouseSub.id = inventory.warehouse_sub_id')
      .leftJoinAndMapOne('inventory.warehouseBin', MasterWarehouseBin, 'warehouseBin', 'warehouseBin.id = inventory.warehouse_bin_id')
      .where('inventory.pallet_id = :palletId', { palletId })
      .orderBy('inventory.createdAt', 'DESC')
      .getOne();

    if (results.length === 0) {
      return [
        {
          id: palletId,
          item_id: undefined,
          item_name: undefined,
          current_quantity: pallet.currentQuantity ?? 0,
          uom: pallet.uom ?? '',
          last_updated: pallet.updatedAt ?? pallet.createdAt ?? new Date(),
          production_date: undefined,
          week_number: pallet.currentWeekNumber || undefined,
          warehouse_sub_id: latestInventory?.warehouse_sub_id,
          warehouse_sub_name: latestInventory?.warehouseSub?.code,
          warehouse_bin_id: latestInventory?.warehouse_bin_id,
          warehouse_bin_name: latestInventory?.warehouseBin?.code,
          memo_id: pallet.memo_id,
        },
      ];
    }

    return results.map((history: any) => ({
      id: palletId,
      item_id: history.item_id,
      item_name: history.item?.sku,
      current_quantity: history.new_quantity,
      uom: history.uom,
      last_updated: history.createdAt,
      production_date: history.production_date,
      week_number: history.week_number ?? pallet.currentWeekNumber ?? undefined,
      warehouse_sub_id: latestInventory?.warehouse_sub_id,
      warehouse_sub_name: latestInventory?.warehouseSub?.code,
      warehouse_bin_id: latestInventory?.warehouse_bin_id,
      warehouse_bin_name: latestInventory?.warehouseBin?.code,
      memo_id: pallet.memo_id,
      status_inventory: history.status_inventory,
    }));
  }

  async getQuantityHistoryByPalletCode(
    palletCode: string,
  ): Promise<PalletQuantityHistoryResponseDto[]> {
    const pallet = await this.repository.findByPalletCode(palletCode);
    if (!pallet) {
      throw new NotFoundException(`Pallet with code ${palletCode} not found`);
    }

    return this.getQuantityHistory(pallet.id);
  }

  async getQuantityHistoryByPalletCodePaginated(
    palletCode: string,
    paginationDto: PalletHistoryPaginationDto,
  ): Promise<PaginatedResponseDto<PalletQuantityHistoryResponseDto>> {
    const pallet = await this.repository.findByPalletCode(palletCode);
    if (!pallet) {
      throw new NotFoundException(`Pallet with code ${palletCode} not found`);
    }

    return this.getQuantityHistoryPaginated(pallet.id, paginationDto);
  }

  async getItemQuantityHistoryByPalletCode(
    palletCode: string,
    itemId: string,
    uom?: string,
  ): Promise<PalletQuantityHistoryResponseDto[]> {
    const pallet = await this.repository.findByPalletCode(palletCode);
    if (!pallet) {
      throw new NotFoundException(`Pallet with code ${palletCode} not found`);
    }

    return this.getItemQuantityHistory(pallet.id, itemId, uom);
  }

  async getPalletItemLatestQuantityByPalletCode(
    palletCode: string,
  ): Promise<PalletItemQuantityDto[]> {
    const pallet = await this.repository.findByPalletCode(palletCode);
    if (!pallet) {
      throw new NotFoundException(`Pallet with code ${palletCode} not found`);
    }

    return this.getPalletItemLatestQuantity(pallet.id);
  }

  async validateCapacityByPalletCode(palletCode: string): Promise<PalletCapacityValidationDto> {
    const pallet = await this.repository.findByPalletCode(palletCode);
    if (!pallet) {
      throw new NotFoundException(`Pallet with code ${palletCode} not found`);
    }

    return this.validateCapacity(pallet.id);
  }

  async checkCapacityForQuantityByPalletCode(
    palletCode: string,
    quantity: number,
  ): Promise<boolean> {
    const pallet = await this.repository.findByPalletCode(palletCode);
    if (!pallet) {
      throw new NotFoundException(`Pallet with code ${palletCode} not found`);
    }

    return this.checkCapacityForQuantity(pallet.id, quantity);
  }

  async validateCapacity(palletId: string): Promise<PalletCapacityValidationDto> {
    const pallet = await this.findOne(palletId);

    if (!pallet.capacity || pallet.capacity <= 0) {
      throw new BadRequestException('Pallet capacity must be set and greater than 0');
    }

    const availableCapacity = Math.max(0, pallet.capacity - pallet.currentQuantity);
    const utilizationPercentage =
      pallet.capacity > 0 ? (pallet.currentQuantity / pallet.capacity) * 100 : 0;

    return {
      capacity: pallet.capacity,
      current_quantity: pallet.currentQuantity,
      available_capacity: availableCapacity,
      has_capacity: availableCapacity > 0,
      utilization_percentage: Math.round(utilizationPercentage * 100) / 100,
    };
  }

  async checkCapacityForQuantity(palletId: string, quantity: number): Promise<boolean> {
    const capacityInfo = await this.validateCapacity(palletId);
    return capacityInfo.available_capacity >= quantity;
  }

  /**
   * Returns the latest transaction history record for (palletId, itemId, uom?).
   * Used by updateProductionDate and updateUOM to read current quantity, production_date, week_number.
   */
  private async getLatestHistoryRecord(
    palletId: string,
    itemId: string,
    uom?: string,
  ): Promise<PalletTransactionHistory | null> {
    const whereCondition: Record<string, string> = {
      pallet_id: palletId,
      item_id: itemId,
    };
    if (uom) {
      whereCondition.uom = uom;
    }
    return this.transactionHistoryRepository.findOne({
      where: whereCondition,
      order: { createdAt: 'DESC' },
    });
  }

  private async getItemQuantityOnPallet(
    palletId: string,
    itemId: string,
    uom?: string,
  ): Promise<number> {
    const latestRecord = await this.getLatestHistoryRecord(palletId, itemId, uom);
    return latestRecord ? latestRecord.new_quantity : 0;
  }
}
