import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, QueryFailedError } from 'typeorm';
import { CreateMasterWarehouseSubDto } from './dto/create-master-warehouse-sub.dto';
import { UpdateMasterWarehouseSubDto } from './dto/update-master-warehouse-sub.dto';
import {
  MasterWarehouseSub,
  WarehouseSubStagingType,
} from '../core/domain/entities/master-warehouse-sub.entity';

@Injectable()
export class MasterWarehouseSubRepository {
  constructor(
    @InjectRepository(MasterWarehouseSub)
    private readonly repository: Repository<MasterWarehouseSub>,
  ) {}

  async create(
    createMasterWarehouseSubDto: CreateMasterWarehouseSubDto,
  ): Promise<MasterWarehouseSub> {
    const warehouseSub = this.repository.create(createMasterWarehouseSubDto);
    return await this.repository.save(warehouseSub);
  }

  async findAll(): Promise<MasterWarehouseSub[]> {
    return await this.repository.find();
  }

  async findOne(id: string): Promise<MasterWarehouseSub | null> {
    const warehouseSub = await this.repository.findOne({ where: { id } });
    if (!warehouseSub) {
      return null;
    }
    return warehouseSub;
  }

  async findByOrganizationId(organization_id: number): Promise<MasterWarehouseSub[]> {
    return await this.repository.find({ where: { organization_id } });
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

  async findByIsStaging(is_staging: WarehouseSubStagingType): Promise<MasterWarehouseSub[]> {
    return await this.repository.find({ where: { is_staging } });
  }

  async findByIsStagingNull(): Promise<MasterWarehouseSub[]> {
    return await this.repository.find({ where: { is_staging: IsNull() } });
  }

  async findByIsGate(is_gate: boolean): Promise<MasterWarehouseSub[]> {
    return await this.repository.find({ where: { is_gate } });
  }

  async findByFilters(
    is_staging?: WarehouseSubStagingType,
    is_gate?: boolean,
  ): Promise<MasterWarehouseSub[]> {
    const where: Partial<MasterWarehouseSub> = {};
    if (is_staging !== undefined) {
      where.is_staging = is_staging;
    }
    if (is_gate !== undefined) {
      where.is_gate = is_gate;
    }
    return await this.repository.find({ where });
  }
}
