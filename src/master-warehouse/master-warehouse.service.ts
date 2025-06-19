import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { MasterWarehouseRepository } from './master-warehouse.repository';
import { CreateMasterWarehouseDto } from './dto/create-master-warehouse.dto';
import { UpdateMasterWarehouseDto } from './dto/update-master-warehouse.dto';
import { MasterWarehouse } from '../core/domain/entities/master-warehouse.entity';

@Injectable()
export class MasterWarehouseService {
  constructor(private readonly repository: MasterWarehouseRepository) {}

  async create(createMasterWarehouseDto: CreateMasterWarehouseDto): Promise<MasterWarehouse> {
    const organizationId = createMasterWarehouseDto.organization_id;
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }
    const existingWarehouse = await this.repository.findByOrganizationId(organizationId);
    if (existingWarehouse) {
      throw new ConflictException(`Warehouse with organization ID ${organizationId} already exists`);
    }
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
    const warehouse = await this.findOne(id);
    if (updateMasterWarehouseDto.organization_id && updateMasterWarehouseDto.organization_id !== warehouse.organization_id) {
      const existingWarehouse = await this.repository.findByOrganizationId(updateMasterWarehouseDto.organization_id);
      if (existingWarehouse) {
        throw new ConflictException(`Warehouse with organization ID ${updateMasterWarehouseDto.organization_id} already exists`);
      }
    }
    return await this.repository.update(id, updateMasterWarehouseDto);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }
}
