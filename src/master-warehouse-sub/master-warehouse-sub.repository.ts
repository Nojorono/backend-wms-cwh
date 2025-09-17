import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMasterWarehouseSubDto } from './dto/create-master-warehouse-sub.dto';
import { UpdateMasterWarehouseSubDto } from './dto/update-master-warehouse-sub.dto';
import { MasterWarehouseSub, WarehouseSubStagingType } from '../core/domain/entities/master-warehouse-sub.entity';

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

  async findByOrganizationId(
    organization_id: number,
  ): Promise<MasterWarehouseSub[]> {
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
    await this.repository.delete(id);
  }

  async findByIsStaging(is_staging: WarehouseSubStagingType): Promise<MasterWarehouseSub[]> {
    return await this.repository.find({ where: { is_staging } });
  }
}
