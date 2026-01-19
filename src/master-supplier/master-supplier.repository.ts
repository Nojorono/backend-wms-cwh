import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterSupplier } from '../core/domain/entities/master-supplier.entity';
import { CreateMasterSupplierDto } from './dto/create-master-supplier.dto';
import { UpdateMasterSupplierDto } from './dto/update-master-supplier.dto';

@Injectable()
export class MasterSupplierRepository {
  constructor(
    @InjectRepository(MasterSupplier)
    private readonly repository: Repository<MasterSupplier>,
  ) {}

  async create(createMasterSupplierDto: CreateMasterSupplierDto): Promise<MasterSupplier> {
    const supplier = this.repository.create(createMasterSupplierDto);
    return await this.repository.save(supplier);
  }

  async findAll(): Promise<MasterSupplier[]> {
    return await this.repository.find();
  }

  async findOne(id: string): Promise<MasterSupplier | null> {
    const supplier = await this.repository.findOne({ where: { id } });
    if (!supplier) {
      return null;
    }
    return supplier;
  }

  async findByOrganizationId(organization_id: number): Promise<MasterSupplier | null> {
    const supplier = await this.repository.findOne({
      where: { organization_id },
    });
    if (!supplier) {
      return null;
    }
    return supplier;
  }

  async update(
    id: string,
    updateMasterSupplierDto: UpdateMasterSupplierDto,
  ): Promise<MasterSupplier | null> {
    const supplier = await this.findOne(id);
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }
    await this.repository.update(id, updateMasterSupplierDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const supplier = await this.findOne(id);
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }
    await this.repository.delete(id);
  }
}
