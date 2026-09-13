import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMasterWarehouseBinDto } from './dto/create-master-warehouse-bin.dto';
import { UpdateMasterWarehouseBinDto } from './dto/update-master-warehouse-bin.dto';
import { MasterWarehouseBin } from '../core/domain/entities/master-warehouse-bin.entity';
import { InventoryTracking } from '../core/domain/entities/inventory-tracking.entity';

@Injectable()
export class MasterWarehouseBinRepository {
  constructor(
    @InjectRepository(MasterWarehouseBin)
    private readonly repository: Repository<MasterWarehouseBin>,
    @InjectRepository(InventoryTracking)
    private readonly inventoryTrackingRepository: Repository<InventoryTracking>,
  ) { }

  async create(
    createMasterWarehouseBinDto: CreateMasterWarehouseBinDto,
  ): Promise<MasterWarehouseBin> {
    const warehouseBin = this.repository.create(createMasterWarehouseBinDto);
    return await this.repository.save(warehouseBin);
  }

  async findAll(): Promise<MasterWarehouseBin[]> {
    return await this.repository.find();
  }

  async findOne(id: string): Promise<MasterWarehouseBin | null> {
    const warehouseBin = await this.repository.findOne({ where: { id } });
    if (!warehouseBin) {
      return null;
    }
    return warehouseBin;
  }

  async findByWarehouseSubId(warehouse_sub_id: string): Promise<MasterWarehouseBin[]> {
    return await this.repository.find({ where: { warehouse_sub_id } });
  }

  async countPalletByBinId(binId: string): Promise<number> {
    const result = await this.inventoryTrackingRepository
      .createQueryBuilder('tracking')
      .select('COUNT(DISTINCT tracking.pallet_id)', 'palletCount')
      .where('tracking.warehouse_bin_id = :binId', { binId })
      .andWhere('tracking.inventory_status = :status', { status: 'IN_INVENTORY' })
      .andWhere('tracking.pallet_id IS NOT NULL')
      .getRawOne<{ palletCount: string }>();

    return Number(result?.palletCount) || 0;
  }

  async countByWarehouseSubId(
    warehouseSubId: string,
    excludeBinId?: string,
  ): Promise<number> {
    const queryBuilder = this.repository
      .createQueryBuilder('bin')
      .where('bin.warehouse_sub_id = :warehouseSubId', { warehouseSubId });

    if (excludeBinId) {
      queryBuilder.andWhere('bin.id <> :excludeBinId', { excludeBinId });
    }

    return queryBuilder.getCount();
  }

  async update(
    id: string,
    updateMasterWarehouseBinDto: UpdateMasterWarehouseBinDto,
  ): Promise<MasterWarehouseBin | null> {
    const warehouseBin = await this.findOne(id);
    if (!warehouseBin) {
      throw new NotFoundException('Warehouse not found');
    }
    await this.repository.update(id, updateMasterWarehouseBinDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const warehouseBin = await this.findOne(id);
    if (!warehouseBin) {
      throw new NotFoundException('Warehouse not found');
    }
    await this.repository.delete(id);
  }
}
