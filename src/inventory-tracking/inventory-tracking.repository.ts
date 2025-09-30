import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryTracking } from '../core/domain/entities/inventory-tracking.entity';
import { CreateInventoryTrackingDto } from './dto/create-inventory-tracking.dto';
import { UpdateInventoryTrackingDto } from './dto/update-inventory-tracking.dto';

@Injectable()
export class InventoryTrackingRepository {
  constructor(
    @InjectRepository(InventoryTracking)
    private readonly repository: Repository<InventoryTracking>,
  ) {}

  async create(dto: CreateInventoryTrackingDto): Promise<InventoryTracking> {
    const entity = this.repository.create(dto);
    return await this.repository.save(entity);
  }

  async findAll(): Promise<InventoryTracking[]> {
    return await this.repository.find({
      relations: ['pallet', 'warehouse', 'warehouseSub', 'warehouseBin']
    });
  }

  async findOne(id: string): Promise<InventoryTracking | null> {
    const entity = await this.repository.findOne({ 
      where: { id },
      relations: ['pallet', 'warehouse', 'warehouseSub', 'warehouseBin']
    });
    return entity ?? null;
  }

  async findOneByParams(pallet_id: string, warehouse_sub_id: string, warehouse_id: string): Promise<InventoryTracking | null> {
    const entity = await this.repository.findOne({ 
      where: { 
        pallet_id, 
        warehouse_sub_id, 
        warehouse_id 
      },
      relations: ['pallet', 'warehouse', 'warehouseSub', 'warehouseBin']
    });
    return entity ?? null;
  }

  // find one history by pallet id
  async findOneHistoryByPalletId(pallet_id: string): Promise<InventoryTracking | null> {
    const entity = await this.repository.findOne({ 
      where: { pallet_id },
      relations: ['pallet', 'warehouse', 'warehouseSub', 'warehouseBin'],
      order: { createdAt: 'DESC' }
    });
    return entity ?? null;
  }

  async update(id: string, dto: UpdateInventoryTrackingDto): Promise<InventoryTracking | null> {
    const existing = await this.findOne(id);
    if (!existing) {
      return null;
    }
    await this.repository.update(id, dto as any);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}


