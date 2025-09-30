import { Injectable, NotFoundException } from '@nestjs/common';
import { InventoryTrackingRepository } from './inventory-tracking.repository';
import { CreateInventoryTrackingDto } from './dto/create-inventory-tracking.dto';
import { UpdateInventoryTrackingDto } from './dto/update-inventory-tracking.dto';
import { InventoryTracking } from '../core/domain/entities/inventory-tracking.entity';

@Injectable()
export class InventoryTrackingService {
  constructor(private readonly repository: InventoryTrackingRepository) {}

  async create(dto: CreateInventoryTrackingDto): Promise<InventoryTracking> {
    return this.repository.create(dto);
  }

  async findAll(): Promise<InventoryTracking[]> {
    return this.repository.findAll();
  }

  async findOneHistoryByPalletId(pallet_id: string): Promise<InventoryTracking> {
    const entity = await this.repository.findOneHistoryByPalletId(pallet_id);
    if (!entity) {
      throw new NotFoundException(`InventoryTracking with pallet ID ${pallet_id} not found`);
    }
    return entity;
  }

  async findOne(id: string): Promise<InventoryTracking> {
    const entity = await this.repository.findOne(id);
    if (!entity) {
      throw new NotFoundException(`InventoryTracking with ID ${id} not found`);
    }
    return entity;
  }

  async update(id: string, dto: UpdateInventoryTrackingDto): Promise<InventoryTracking> {
    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`InventoryTracking with ID ${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }

  async createOrUpdateInventoryTracking(pallet_id: string, warehouse_sub_id: string, warehouse_id: string, inventory_status: string): Promise<InventoryTracking> {
    const existing = await this.repository.findOneByParams(pallet_id, warehouse_sub_id, warehouse_id);
    if (existing) {
      return this.update(existing.id, { 
        inventory_status: inventory_status
      });
    }
    return this.create({ 
      pallet_id, 
      warehouse_sub_id, 
      warehouse_id, 
      inventory_date: new Date(), 
      inventory_status: inventory_status, 
      inventory_note: 'Inventory tracking created',
    });
  }
}


