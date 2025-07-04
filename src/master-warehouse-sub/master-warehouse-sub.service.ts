import { Injectable, NotFoundException } from '@nestjs/common';
import { MasterWarehouseSubRepository } from './master-warehouse-sub.repository';
import { CreateMasterWarehouseSubDto } from './dto/create-master-warehouse-sub.dto';
import { UpdateMasterWarehouseSubDto } from './dto/update-master-warehouse-sub.dto';
import { MasterWarehouseSub } from 'src/core/domain/entities/master-warehouse-sub.entity';

@Injectable()
export class MasterWarehouseSubService {
  constructor(private readonly repository: MasterWarehouseSubRepository) {}

  async create(createMasterWarehouseSubDto: CreateMasterWarehouseSubDto): Promise<MasterWarehouseSub> {
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

  async findByOrganizationId(organization_id: number): Promise<MasterWarehouseSub[]> {
    return await this.repository.findByOrganizationId(organization_id);
  }

  async findByWarehouseId(warehouse_id: string): Promise<MasterWarehouseSub[]> {
    return await this.repository.findByWarehouseId(warehouse_id);
  }

  async update(id: string, updateMasterWarehouseSubDto: UpdateMasterWarehouseSubDto): Promise<MasterWarehouseSub> {
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
}
