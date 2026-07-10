import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { CreateMasterWarehouseSubDto } from './dto/create-master-warehouse-sub.dto';
import { UpdateMasterWarehouseSubDto } from './dto/update-master-warehouse-sub.dto';
import {
  MasterWarehouseSub,
  WarehouseSubStagingType,
} from '../core/domain/entities/master-warehouse-sub.entity';
import { MasterWarehouse } from '../core/domain/entities/master-warehouse.entity';
import { MasterWarehouseBin } from '../core/domain/entities/master-warehouse-bin.entity';
import { InventoryTracking } from '../core/domain/entities/inventory-tracking.entity';

export interface WarehouseSubWithBinsFilters {
  is_staging?: WarehouseSubStagingType | null;
  is_good_stock?: boolean;
  is_gate?: boolean;
}

export interface WarehouseSubBinWithPalletCount {
  id: string;
  locator_id?: number;
  locator_name?: string;
  warehouse_sub_id?: string;
  name?: string;
  code?: string;
  description?: string;
  capacity_pallet?: number;
  current_pallet?: number;
  current_pallet_count: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WarehouseSubWithBinsAndPalletCount {
  id: string;
  locator_id?: number;
  locator_name?: string;
  warehouse_id?: string;
  name?: string;
  code?: string;
  description?: string;
  capacity_bin?: number;
  is_staging?: WarehouseSubStagingType;
  is_good_stock?: boolean;
  is_gate?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  bins: WarehouseSubBinWithPalletCount[];
}

@Injectable()
export class MasterWarehouseSubRepository {
  constructor(
    @InjectRepository(MasterWarehouseSub)
    private readonly repository: Repository<MasterWarehouseSub>,
    @InjectRepository(MasterWarehouseBin)
    private readonly binRepository: Repository<MasterWarehouseBin>,
    @InjectRepository(InventoryTracking)
    private readonly inventoryTrackingRepository: Repository<InventoryTracking>,
  ) { }

  async create(
    createMasterWarehouseSubDto: CreateMasterWarehouseSubDto,
  ): Promise<MasterWarehouseSub> {
    const warehouseSub = this.repository.create(createMasterWarehouseSubDto);
    return await this.repository.save(warehouseSub);
  }

  async findAll(organizationId: string): Promise<MasterWarehouseSub[]> {
    return await this.buildOrganizationScopedQuery(organizationId).getMany();
  }

  async findOne(id: string): Promise<MasterWarehouseSub | null> {
    const warehouseSub = await this.repository.findOne({ where: { id } });
    if (!warehouseSub) {
      return null;
    }
    return warehouseSub;
  }

  async findByWarehouseId(warehouse_id: string): Promise<MasterWarehouseSub[]> {
    return await this.repository.find({ where: { warehouse_id } });
  }

  async update(
    id: string,
    updateMasterWarehouseSubDto: UpdateMasterWarehouseSubDto,
  ): Promise<MasterWarehouseSub | null> {
    const warehouseSub = await this.findOne(id);
    if (!warehouseSub) {
      throw new NotFoundException('Warehouse not found');
    }
    await this.repository.update(id, updateMasterWarehouseSubDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const warehouseSub = await this.findOne(id);
    if (!warehouseSub) {
      throw new NotFoundException('Warehouse not found');
    }
    try {
      await this.repository.delete(id);
    } catch (error) {
      // PostgreSQL foreign key violation: record is still referenced by other tables.
      if (error instanceof QueryFailedError && (error as any).driverError?.code === '23503') {
        throw new ConflictException(
          'Warehouse sub cannot be deleted because it is still used by other data.',
        );
      }
      throw error;
    }
  }

  async findByIsStaging(
    is_staging: WarehouseSubStagingType,
    organizationId: string,
  ): Promise<MasterWarehouseSub[]> {
    return await this.buildOrganizationScopedQuery(organizationId)
      .andWhere('warehouseSub.is_staging = :is_staging', { is_staging })
      .getMany();
  }

  async findByIsStagingNull(organizationId: string): Promise<MasterWarehouseSub[]> {
    return await this.buildOrganizationScopedQuery(organizationId)
      .andWhere('warehouseSub.is_staging IS NULL')
      .getMany();
  }

  async findByIsGate(is_gate: boolean): Promise<MasterWarehouseSub[]> {
    return await this.repository.find({ where: { is_gate } });
  }

  async findAllWithBinsAndPalletCount(
    organizationId: string,
    filters: WarehouseSubWithBinsFilters = {},
  ): Promise<WarehouseSubWithBinsAndPalletCount[]> {
    const warehouseSubs = await this.applyWarehouseSubFilters(
      this.buildOrganizationScopedQuery(organizationId),
      filters,
    )
      .orderBy('warehouseSub.name', 'ASC')
      .getMany();

    if (!warehouseSubs.length) {
      return [];
    }

    const subIds = warehouseSubs.map((sub) => sub.id);
    const bins = await this.binRepository
      .createQueryBuilder('bin')
      .where('bin.warehouse_sub_id IN (:...subIds)', { subIds })
      .orderBy('bin.name', 'ASC')
      .getMany();

    const palletCountByBinId = await this.loadPalletCountByBinIds(bins.map((bin) => bin.id));
    const binsBySubId = new Map<string, WarehouseSubBinWithPalletCount[]>();

    for (const bin of bins) {
      const binWithCount: WarehouseSubBinWithPalletCount = {
        id: bin.id,
        locator_id: bin.locator_id,
        locator_name: bin.locator_name,
        warehouse_sub_id: bin.warehouse_sub_id,
        name: bin.name,
        code: bin.code,
        description: bin.description,
        capacity_pallet: bin.capacity_pallet,
        current_pallet: bin.current_pallet,
        current_pallet_count: palletCountByBinId.get(bin.id) ?? 0,
        createdAt: bin.createdAt,
        updatedAt: bin.updatedAt,
      };

      const existingBins = binsBySubId.get(bin.warehouse_sub_id) ?? [];
      existingBins.push(binWithCount);
      binsBySubId.set(bin.warehouse_sub_id, existingBins);
    }

    return warehouseSubs.map((sub) => ({
      id: sub.id,
      locator_id: sub.locator_id,
      locator_name: sub.locator_name,
      warehouse_id: sub.warehouse_id,
      name: sub.name,
      code: sub.code,
      description: sub.description,
      capacity_bin: sub.capacity_bin,
      is_staging: sub.is_staging,
      is_good_stock: sub.is_good_stock,
      is_gate: sub.is_gate,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
      bins: binsBySubId.get(sub.id) ?? [],
    }));
  }

  async findByFilters(
    organizationId: string,
    is_staging?: WarehouseSubStagingType,
    is_gate?: boolean,
  ): Promise<MasterWarehouseSub[]> {
    const qb = this.buildOrganizationScopedQuery(organizationId);

    if (is_staging !== undefined) {
      qb.andWhere('warehouseSub.is_staging = :is_staging', { is_staging });
    }
    if (is_gate !== undefined) {
      qb.andWhere('warehouseSub.is_gate = :is_gate', { is_gate });
    }

    return await qb.getMany();
  }

  private buildOrganizationScopedQuery(organizationId: string) {
    return this.repository
      .createQueryBuilder('warehouseSub')
      .leftJoin(MasterWarehouse, 'warehouse', 'warehouse.id::varchar = warehouseSub.warehouse_id')
      .where('warehouse.organization_id = :organizationId::uuid', { organizationId });
  }

  private applyWarehouseSubFilters(
    qb: ReturnType<MasterWarehouseSubRepository['buildOrganizationScopedQuery']>,
    filters: WarehouseSubWithBinsFilters,
  ) {
    if (filters.is_staging === null) {
      qb.andWhere('warehouseSub.is_staging IS NULL');
    } else if (filters.is_staging !== undefined) {
      qb.andWhere('warehouseSub.is_staging = :is_staging', { is_staging: filters.is_staging });
    }

    if (filters.is_good_stock !== undefined) {
      qb.andWhere('warehouseSub.is_good_stock = :is_good_stock', {
        is_good_stock: filters.is_good_stock,
      });
    }

    if (filters.is_gate !== undefined) {
      qb.andWhere('warehouseSub.is_gate = :is_gate', { is_gate: filters.is_gate });
    }

    return qb;
  }

  private async loadPalletCountByBinIds(binIds: string[]): Promise<Map<string, number>> {
    if (!binIds.length) {
      return new Map();
    }

    const rows = await this.inventoryTrackingRepository
      .createQueryBuilder('tracking')
      .select('tracking.warehouse_bin_id', 'binId')
      .addSelect('COUNT(DISTINCT tracking.pallet_id)', 'palletCount')
      .where('tracking.warehouse_bin_id IN (:...binIds)', { binIds })
      .andWhere('tracking.inventory_status = :status', { status: 'IN_INVENTORY' })
      .andWhere('tracking.pallet_id IS NOT NULL')
      .groupBy('tracking.warehouse_bin_id')
      .getRawMany<{ binId: string; palletCount: string }>();

    return new Map(rows.map((row) => [row.binId, Number(row.palletCount) || 0]));
  }
}
