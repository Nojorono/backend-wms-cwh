import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryTracking } from '../core/domain/entities/inventory-tracking.entity';
import { InventoryTrackingHistory, InventoryTrackingAction } from '../core/domain/entities/inventory-tracking-history.entity';
import { CreateInventoryTrackingDto } from './dto/create-inventory-tracking.dto';
import { UpdateInventoryTrackingDto } from './dto/update-inventory-tracking.dto';

@Injectable()
export class InventoryTrackingRepository {
  constructor(
    @InjectRepository(InventoryTracking)
    private readonly repository: Repository<InventoryTracking>,
    @InjectRepository(InventoryTrackingHistory)
    private readonly historyRepository: Repository<InventoryTrackingHistory>,
  ) {}

  async create(dto: CreateInventoryTrackingDto): Promise<InventoryTracking> {
    const entity = this.repository.create(dto);
    const saved = await this.repository.save(entity);
    await this.historyRepository.save(
      this.historyRepository.create({
        inventory_tracking_id: saved.id,
        pallet_id: saved.pallet_id,
        warehouse_id: saved.warehouse_id,
        warehouse_sub_id: saved.warehouse_sub_id,
        warehouse_bin_id: saved.warehouse_bin_id,
        inventory_date: saved.inventory_date,
        inventory_status: saved.inventory_status,
        inventory_note: saved.inventory_note,
        action: InventoryTrackingAction.CREATED,
      }),
    );
    return saved;
  }

  async findAll(): Promise<InventoryTracking[]> {
    return await this.repository.find({
      relations: ['pallet', 'warehouse', 'warehouseSub', 'warehouseBin']
    });
  }

  async findAllByWarehouse(
    warehouse_sub_id?: string,
    warehouse_bin_id?: string,
  ): Promise<InventoryTracking[]> {
    const qb = this.repository.createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.pallet', 'pallet')
      .leftJoinAndSelect('inventory.warehouse', 'warehouse')
      .leftJoinAndSelect('inventory.warehouseSub', 'warehouseSub')
      .leftJoinAndSelect('inventory.warehouseBin', 'warehouseBin');
  
    if (warehouse_sub_id) {
      qb.andWhere('warehouseSub.id = :warehouse_sub_id', { warehouse_sub_id });
    }
  
    if (warehouse_bin_id) {
      qb.andWhere('warehouseBin.id = :warehouse_bin_id', { warehouse_bin_id });
    }
  
    return await qb.getMany();
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
    const updated = await this.findOne(id);
    if (updated) {
      await this.historyRepository.save(
        this.historyRepository.create({
          inventory_tracking_id: updated.id,
          pallet_id: updated.pallet_id,
          warehouse_id: updated.warehouse_id,
          warehouse_sub_id: updated.warehouse_sub_id,
          warehouse_bin_id: updated.warehouse_bin_id,
          inventory_date: updated.inventory_date,
          inventory_status: updated.inventory_status,
          inventory_note: updated.inventory_note,
          action: InventoryTrackingAction.UPDATED,
        }),
      );
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}


