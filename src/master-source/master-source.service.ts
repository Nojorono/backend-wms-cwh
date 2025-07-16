import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { MasterSourceRepository } from './master-source.repository';
import { CreateMasterSourceDto } from './dto/create-master-source.dto';
import { UpdateMasterSourceDto } from './dto/update-master-source.dto';
import { MasterSource } from '../core/domain/entities/master-source.entity';

@Injectable()
export class MasterSourceService {
  constructor(private readonly repository: MasterSourceRepository) {}

  async create(createMasterSourceDto: CreateMasterSourceDto): Promise<MasterSource> {
    const organizationId = createMasterSourceDto.organization_id;
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }
    const existingSource = await this.repository.findByOrganizationId(organizationId);
    if (existingSource) {
      throw new ConflictException(`Source with code ${createMasterSourceDto.organization_id} already exists`);
    }
    return await this.repository.create(createMasterSourceDto);
  }

  async findAll(): Promise<MasterSource[]> {
    return await this.repository.findAll();
  }

  async findOne(id: number): Promise<MasterSource> {
    const source = await this.repository.findOne(id);
    if (!source) {
      throw new NotFoundException(`Source with ID ${id} not found`);
    }
    return source;
  }

  async update(id: number, updateMasterSourceDto: UpdateMasterSourceDto): Promise<MasterSource> {
    const source = await this.findOne(id);
    if (!source) {
      throw new NotFoundException(`Source with ID ${id} not found`);
    }
    const updatedSource = await this.repository.update(id, updateMasterSourceDto);
    if (!updatedSource) {
      throw new NotFoundException(`Source with ID ${id} not found`);
    }
    return updatedSource;
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }
}
