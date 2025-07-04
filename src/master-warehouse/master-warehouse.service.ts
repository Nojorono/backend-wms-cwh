import { Injectable, NotFoundException } from '@nestjs/common';
import { MasterWarehouseRepository } from './master-warehouse.repository';
import { CreateMasterWarehouseDto } from './dto/create-master-warehouse.dto';
import { UpdateMasterWarehouseDto } from './dto/update-master-warehouse.dto';
import { MasterWarehouse } from '../core/domain/entities/master-warehouse.entity';

@Injectable()
export class MasterWarehouseService {
  constructor(private readonly repository: MasterWarehouseRepository) {}

  async create(createMasterWarehouseDto: CreateMasterWarehouseDto): Promise<MasterWarehouse> {
    return await this.repository.create(createMasterWarehouseDto);
  }

  async findAll(): Promise<MasterWarehouse[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<MasterWarehouse> {
    const warehouse = await this.repository.findOne(id);
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    return warehouse;
  }

  async update(id: string, updateMasterWarehouseDto: UpdateMasterWarehouseDto): Promise<MasterWarehouse> {
    const updatedWarehouse = await this.repository.update(id, updateMasterWarehouseDto);
    if (!updatedWarehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    return updatedWarehouse;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }
}
