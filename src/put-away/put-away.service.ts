import { Injectable, NotFoundException } from '@nestjs/common';
import { PutAwayRepository } from './put-away.repository';
import { CreatePutAwayDto, UpdatePutAwayDto } from './dto/create-put-away.dto';
import { CreateManyPutAwayDto } from './dto/create-many-put-away.dto';
import { PutAwayTransaction, Status } from 'src/core/domain/entities/transaction-put-away.entity';
import { InventoryTrackingService } from 'src/inventory-tracking/inventory-tracking.service';
import { MasterWarehouseBinService } from 'src/master-warehouse-bin/master-warehouse-bin.service';
import { MasterPalletService } from 'src/master-pallet/master-pallet.service';
import { ProgressionStatus } from 'src/core/domain/entities/inventory-tracking.entity';
import { PutAwayPaginationDto } from './dto/put-away-pagination.dto';
import { PaginationService } from 'src/core/services/pagination.service';
import { PaginatedResponseDto } from 'src/core/dto/pagination.dto';

@Injectable()
export class PutAwayService {
  constructor(
    private readonly repository: PutAwayRepository,
    private readonly inventoryTrackingService: InventoryTrackingService,
    private readonly warehouseBinService: MasterWarehouseBinService,
    private readonly masterPalletService: MasterPalletService,
    private readonly paginationService: PaginationService,
  ) {}

  async create(dto: CreatePutAwayDto): Promise<PutAwayTransaction> {
    const putAwayTransaction = await this.repository.create(dto);

    // Update progression status to IN_PROGRESS when putaway is created
    if (putAwayTransaction.inventory_tracking_id) {
      await this.inventoryTrackingService.updateProgressionStatus(
        putAwayTransaction.inventory_tracking_id,
        ProgressionStatus.IN_PROGRESS,
      );
    }

    return putAwayTransaction;
  }

  async createMany(dto: CreateManyPutAwayDto): Promise<PutAwayTransaction[]> {
    const putAwayTransactions = await this.repository.createMany(dto.data);

    // Update progression status to IN_PROGRESS for all created putaway transactions
    for (const transaction of putAwayTransactions) {
      if (transaction.inventory_tracking_id) {
        await this.inventoryTrackingService.updateProgressionStatus(
          transaction.inventory_tracking_id,
          ProgressionStatus.IN_PROGRESS,
        );
      }
    }

    return putAwayTransactions;
  }

  async findAll(): Promise<PutAwayTransaction[]> {
    const entities = await this.repository.findAll();
    await this.populatePalletItems(entities);
    return entities;
  }

  async findAllPaginated(
    paginationDto: PutAwayPaginationDto,
  ): Promise<PaginatedResponseDto<PutAwayTransaction>> {
    const result = await this.repository.findAllPaginated(paginationDto);
    await this.populatePalletItems(result.data);
    return this.paginationService.createPaginatedResponse(result.data, paginationDto, result.total);
  }

  async findOne(id: string): Promise<PutAwayTransaction> {
    const entity = await this.repository.findOne(id);
    if (!entity) {
      throw new NotFoundException(`Put Away with ID ${id} not found`);
    }

    // Get current items and quantity from pallet
    await this.populatePalletItems([entity]);

    return entity;
  }

  async update(id: string, dto: UpdatePutAwayDto): Promise<PutAwayTransaction> {
    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Put Away with ID ${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);

    // Update progression status to NOT_STARTED when putaway is deleted
    if (existing.inventory_tracking_id) {
      await this.inventoryTrackingService.updateProgressionStatus(
        existing.inventory_tracking_id,
        ProgressionStatus.NOT_STARTED,
      );
    }

    await this.repository.remove(id);
  }

  async findTaskByDriverId(driver_id: string): Promise<PutAwayTransaction[]> {
    return this.repository.findTaskByDriverId(driver_id);
  }

  async findTaskHistoryByDriverId(driver_id: string): Promise<PutAwayTransaction[]> {
    return this.repository.findTaskHistoryByDriverId(driver_id);
  }

  async taskCompleted(id: string): Promise<PutAwayTransaction> {
    const existing = await this.findOne(id);
    if (!existing) throw new NotFoundException('Put Away task not found');
    const updated = await this.repository.update(id, { status: Status.COMPLETED });
    // update inventory tracking status to PUT_AWAY_COMPLETED
    const inventoryTracking = await this.inventoryTrackingService.findOne(
      existing.inventory_tracking_id,
    );
    const warehouseBin = await this.warehouseBinService.findOne(existing.destination_bin_id);
    if (!inventoryTracking) throw new NotFoundException('Inventory tracking not found');
    await this.inventoryTrackingService.update(inventoryTracking.id, {
      warehouse_bin_id: existing.destination_bin_id,
      warehouse_sub_id: warehouseBin.warehouse_sub_id,
      inventory_note: 'Put Away completed by ' + existing.driver_name,
      inventory_date: new Date(),
      inventory_status: 'IN_INVENTORY',
      progression_status: ProgressionStatus.COMPLETED,
    });
    return updated;
  }

  private async populatePalletItems(entities: PutAwayTransaction[]): Promise<void> {
    for (const entity of entities) {
      if (entity.inventoryTracking?.pallet_id) {
        try {
          const palletItems = await this.masterPalletService.getPalletItemLatestQuantity(
            entity.inventoryTracking.pallet_id,
          );
          (entity as any).palletItems = palletItems;
        } catch (error) {
          console.warn(
            `Failed to get pallet items for pallet ${entity.inventoryTracking?.pallet_id}:`,
            error.message,
          );
          (entity as any).palletItems = [];
        }
      }
    }
  }
}
