import { Injectable, NotFoundException } from '@nestjs/common';
import { MasterWarehouseSubRepository } from './master-warehouse-sub.repository';
import { CreateMasterWarehouseSubDto } from './dto/create-master-warehouse-sub.dto';
import { UpdateMasterWarehouseSubDto } from './dto/update-master-warehouse-sub.dto';
import {
  MasterWarehouseSub,
  WarehouseSubStagingType,
} from 'src/core/domain/entities/master-warehouse-sub.entity';

@Injectable()
export class MasterWarehouseSubService {
  constructor(
    private readonly repository: MasterWarehouseSubRepository,
  ) { }

  async create(
    createMasterWarehouseSubDto: CreateMasterWarehouseSubDto,
  ): Promise<MasterWarehouseSub> {
    return await this.repository.create(createMasterWarehouseSubDto);
  }

  async findAll(): Promise<MasterWarehouseSub[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<MasterWarehouseSub> {
    const warehouseSub = await this.repository.findOne(id);
    if (!warehouseSub) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    return warehouseSub;
  }

  async findByWarehouseId(warehouse_id: string): Promise<MasterWarehouseSub[]> {
    return await this.repository.findByWarehouseId(warehouse_id);
  }

  async update(
    id: string,
    updateMasterWarehouseSubDto: UpdateMasterWarehouseSubDto,
  ): Promise<MasterWarehouseSub> {
    const warehouseSub = await this.findOne(id);
    if (!warehouseSub) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    const updatedWarehouseSub = await this.repository.update(id, updateMasterWarehouseSubDto);
    if (!updatedWarehouseSub) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    return updatedWarehouseSub;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }

  async findByIsStaging(is_staging: WarehouseSubStagingType): Promise<MasterWarehouseSub[]> {
    return await this.repository.findByIsStaging(is_staging);
  }

  async findByIsStagingNull(): Promise<MasterWarehouseSub[]> {
    return await this.repository.findByIsStagingNull();
  }

  async findByIsGate(is_gate: boolean): Promise<MasterWarehouseSub[]> {
    return await this.repository.findByIsGate(is_gate);
  }

  async findByFilters(
    is_staging?: WarehouseSubStagingType,
    is_gate?: boolean,
  ): Promise<MasterWarehouseSub[]> {
    return await this.repository.findByFilters(is_staging, is_gate);
  }
}
