import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { MasterIORepository } from './master-io.repository';
import { CreateMasterIODto } from './dto/create-master-io.dto';
import { UpdateMasterIODto } from './dto/update-master-io.dto';
import { MasterIO } from '../core/domain/entities/master-io.entity';

@Injectable()
export class MasterIOService {
  constructor(private readonly repository: MasterIORepository) {}

  async create(createMasterIODto: CreateMasterIODto): Promise<MasterIO> {
    const organizationId = createMasterIODto.organization_id;
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }
    const existingIO = await this.repository.findByOrganizationId(organizationId);
    if (existingIO) {
      throw new ConflictException(`IO with code ${createMasterIODto.organization_id} already exists`);
    }
    return await this.repository.create(createMasterIODto);
  }

  async findAll(): Promise<MasterIO[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<MasterIO> {
    const io = await this.repository.findOne(id);
    if (!io) {
      throw new NotFoundException(`IO with ID ${id} not found`);
    }
    return io;
  }

  async update(id: string, updateMasterIODto: UpdateMasterIODto): Promise<MasterIO> {
    const io = await this.findOne(id);
    if (updateMasterIODto.organization_id && updateMasterIODto.organization_id !== io.organization_id) {
      const existingIO = await this.repository.findByOrganizationId(updateMasterIODto.organization_id);
      if (existingIO) {
        throw new ConflictException(`IO with code ${updateMasterIODto.organization_id} already exists`);
      }
    }
    const updatedIO = await this.repository.update(id, updateMasterIODto);
    if (!updatedIO) {
      throw new NotFoundException(`IO with ID ${id} not found`);
    }
    return updatedIO;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }
}
