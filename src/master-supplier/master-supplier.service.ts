import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { MasterSupplierRepository } from './master-supplier.repository';
import { CreateMasterSupplierDto } from './dto/create-master-supplier.dto';
import { UpdateMasterSupplierDto } from './dto/update-master-supplier.dto';
import { MasterSupplier } from '../core/domain/entities/master-supplier.entity';

@Injectable()
export class MasterSupplierService {
  constructor(private readonly repository: MasterSupplierRepository) {}

  async create(createMasterSupplierDto: CreateMasterSupplierDto): Promise<MasterSupplier> {
    const organizationId = createMasterSupplierDto.organization_id;
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }
    const existingSupplier = await this.repository.findByOrganizationId(organizationId);
    if (existingSupplier) {
      throw new ConflictException(
        `Supplier with code ${createMasterSupplierDto.organization_id} already exists`,
      );
    }
    return await this.repository.create(createMasterSupplierDto);
  }

  async findAll(): Promise<MasterSupplier[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<MasterSupplier> {
    const supplier = await this.repository.findOne(id);
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }
    return supplier;
  }

  async update(
    id: string,
    updateMasterSupplierDto: UpdateMasterSupplierDto,
  ): Promise<MasterSupplier> {
    const supplier = await this.findOne(id);
    if (
      updateMasterSupplierDto.organization_id &&
      updateMasterSupplierDto.organization_id !== supplier.organization_id
    ) {
      const existingSupplier = await this.repository.findByOrganizationId(
        updateMasterSupplierDto.organization_id,
      );
      if (existingSupplier) {
        throw new ConflictException(
          `Supplier with code ${updateMasterSupplierDto.organization_id} already exists`,
        );
      }
    }
    const updatedSupplier = await this.repository.update(id, updateMasterSupplierDto);
    if (!updatedSupplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }
    return updatedSupplier;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }
}
