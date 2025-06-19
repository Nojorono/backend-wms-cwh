import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterWarehouse } from '../core/domain/entities/master-warehouse.entity';
import { CreateMasterWarehouseDto } from './dto/create-master-warehouse.dto';
import { UpdateMasterWarehouseDto } from './dto/update-master-warehouse.dto';

@Injectable()
export class MasterWarehouseRepository {
  constructor(
    @InjectRepository(MasterWarehouse)
    private readonly repository: Repository<MasterWarehouse>,
  ) {}

  async create(createMasterWarehouseDto: CreateMasterWarehouseDto): Promise<MasterWarehouse> {
    const warehouse = this.repository.create(createMasterWarehouseDto);
    return await this.repository.save(warehouse);
  }

  async findAll(): Promise<MasterWarehouse[]> {
    return await this.repository.find();
  }

  async findOne(id: string): Promise<MasterWarehouse> {
    const warehouse = await this.repository.findOne({ where: { id } });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }
    return warehouse;
  }

  async findByOrganizationId(organization_id: number): Promise<MasterWarehouse> {
    const warehouse = await this.repository.findOne({ where: { organization_id } });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }
    return warehouse;
  }

  async update(id: string, updateMasterWarehouseDto: UpdateMasterWarehouseDto): Promise<MasterWarehouse> {
    const warehouse = await this.findOne(id);
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }
    await this.repository.update(id, updateMasterWarehouseDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const warehouse = await this.findOne(id);
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }
    await this.repository.delete(id);
  }
}
