import { Injectable, NotFoundException } from '@nestjs/common';
import { PutAwayRepository } from './put-away.repository';
import { CreatePutAwayDto, UpdatePutAwayDto } from './dto/create-put-away.dto';
import { CreateManyPutAwayDto } from './dto/create-many-put-away.dto';
import { PutAwayTransaction, Status } from 'src/core/domain/entities/transaction-put-away.entity';
import { InventoryTrackingService } from 'src/inventory-tracking/inventory-tracking.service';
import { MasterWarehouseBinService } from 'src/master-warehouse-bin/master-warehouse-bin.service';
import { ProgressionStatus } from 'src/core/domain/entities/inventory-tracking.entity';
  
@Injectable()
export class PutAwayService {
  constructor(
    private readonly repository: PutAwayRepository, 
    private readonly inventoryTrackingService: InventoryTrackingService, 
    private readonly warehouseBinService: MasterWarehouseBinService 

  ) {}

  async create(dto: CreatePutAwayDto): Promise<PutAwayTransaction> {
    return this.repository.create(dto);
  }

  async createMany(dto: CreateManyPutAwayDto): Promise<PutAwayTransaction[]> {
    return this.repository.createMany(dto.data);
  }

  async findAll(): Promise<PutAwayTransaction[]> {
    return this.repository.findAll();
  }

  async findOne(id: string): Promise<PutAwayTransaction> {
    const entity = await this.repository.findOne(id);
    if (!entity) {
      throw new NotFoundException(`Put Away with ID ${id} not found`);
    }
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
    await this.findOne(id);
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
    const inventoryTracking = await this.inventoryTrackingService.findOne(existing.inventory_tracking_id);
    const warehouseBin = await this.warehouseBinService.findOne(existing.destination_bin_id)
    if (!inventoryTracking) throw new NotFoundException('Inventory tracking not found');
    await this.inventoryTrackingService.update(inventoryTracking.id, {
      warehouse_bin_id: existing.destination_bin_id,
      warehouse_sub_id: warehouseBin.warehouse_sub_id,
      inventory_note: 'Put Away completed by ' + existing.driver_name,
      inventory_date: new Date(),
      inventory_status: 'IN_INVENTORY',
      progression_status: ProgressionStatus.COMPLETED });
    return updated;
  }
}


