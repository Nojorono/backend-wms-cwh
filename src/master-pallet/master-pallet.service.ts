import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterPalletRepository } from './master-pallet.repository';
import { CreateMasterPalletDto } from './dto/create-master-pallet.dto';
import { UpdateMasterPalletDto } from './dto/update-master-pallet.dto';
import {
  UpdatePalletQuantityDto,
  PalletQuantityHistoryResponseDto,
  PalletCapacityValidationDto,
  PalletItemQuantityDto,
} from './dto/pallet-quantity.dto';
import { MasterPallet } from '../core/domain/entities/master-pallet.entity';
import {
  PalletTransactionHistory,
  QuantityOperationType,
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
  ) {}

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
  ): Promise<MasterPallet> {
    const pallet = await this.findOne(palletId);

    if (!pallet.capacity || pallet.capacity <= 0) {
      throw new BadRequestException('Pallet capacity must be set and greater than 0');
    }

    const currentItemQuantity = await this.getItemQuantityOnPallet(
      palletId,
      updateQuantityDto.item_id,
      updateQuantityDto.uom,
    );
    const totalPalletQuantity = await this.getTotalPalletQuantity(palletId);

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
      const projectedTotal = totalPalletQuantity - currentItemQuantity + updateQuantityDto.quantity;
      if (projectedTotal > pallet.capacity) {
        throw new BadRequestException(
          `Adjusted total quantity ${projectedTotal} exceeds pallet capacity ${pallet.capacity}`,
        );
      }
    }
    let newItemQuantity: number;
    let quantityChange: number;

    switch (updateQuantityDto.operation_type) {
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

    const updatedPallet = await this.repository.update(palletId, {
      currentQuantity: newTotalQuantity,
      isFull: newTotalQuantity >= pallet.capacity,
      currentWeekNumber: updatedWeekNumber,
    });

    if (!updatedPallet) {
      throw new NotFoundException(`Pallet with ID ${palletId} not found`);
    }

    const productionDateStr =
      typeof updateQuantityDto.production_date === 'string'
        ? updateQuantityDto.production_date
        : updateQuantityDto.production_date?.toISOString();

    await this.createQuantityHistory({
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
    });

    return updatedPallet;
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
          .getQuery();
        return `history.createdAt = ${subQuery}`;
      })
      .setParameter('palletId', palletId);

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
        },
      ];
    }

    return results
      .map((history: any) => ({
        id: palletId,
        item_id: history.item_id,
        item_name: history.item?.sku,
        current_quantity: history.new_quantity, // use your latest field
        uom: history.uom,
        last_updated: history.createdAt,
        production_date: history.production_date,
        week_number: history.week_number,
        warehouse_sub_id: latestInventory?.warehouse_sub_id,
        warehouse_sub_name: latestInventory?.warehouseSub?.code,
        warehouse_bin_id: latestInventory?.warehouse_bin_id,
        warehouse_bin_name: latestInventory?.warehouseBin?.code,
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

  private async getItemQuantityOnPallet(
    palletId: string,
    itemId: string,
    uom?: string,
  ): Promise<number> {
    const whereCondition: any = {
      pallet_id: palletId,
      item_id: itemId,
    };

    // If UOM is provided, filter by UOM as well
    if (uom) {
      whereCondition.uom = uom;
    }

    const latestRecord = await this.transactionHistoryRepository.findOne({
      where: whereCondition,
      order: { createdAt: 'DESC' },
    });

    return latestRecord ? latestRecord.new_quantity : 0;
  }

  private async getTotalPalletQuantity(palletId: string): Promise<number> {
    const pallet = await this.findOne(palletId);
    return pallet.currentQuantity;
  }

  private async createQuantityHistory(data: {
    pallet_id: string;
    item_id: string;
    previous_quantity: number;
    quantity_change: number;
    new_quantity: number;
    operation_type: QuantityOperationType;
    inbound_id?: string;
    outbound_do_id?: string;
    reference_id?: string;
    reference_type?: string;
    notes?: string;
    user_id?: string;
    uom?: string;
    production_date?: string;
    week_number?: number;
  }): Promise<PalletTransactionHistory> {
    const history = this.transactionHistoryRepository.create(data);
    return await this.transactionHistoryRepository.save(history);
  }
}
