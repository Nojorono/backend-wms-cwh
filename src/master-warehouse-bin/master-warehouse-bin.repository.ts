import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMasterWarehouseBinDto } from './dto/create-master-warehouse-bin.dto';
import { UpdateMasterWarehouseBinDto } from './dto/update-master-warehouse-bin.dto';
import { MasterWarehouseBin } from '../core/domain/entities/master-warehouse-bin.entity';

@Injectable()
export class MasterWarehouseBinRepository {
  constructor(
    @InjectRepository(MasterWarehouseBin)
    private readonly repository: Repository<MasterWarehouseBin>,
  ) {}

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

  async findByOrganizationId(
    organization_id: number,
  ): Promise<MasterWarehouseBin[]> {
    return await this.repository.find({ where: { organization_id } });
  }

  async findByWarehouseSubId(
    warehouse_sub_id: string,
  ): Promise<MasterWarehouseBin[]> {
    return await this.repository.find({ where: { warehouse_sub_id } });
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
