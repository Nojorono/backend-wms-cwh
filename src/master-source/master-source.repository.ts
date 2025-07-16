import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterSource } from '../core/domain/entities/master-source.entity';
import { CreateMasterSourceDto } from './dto/create-master-source.dto';
import { UpdateMasterSourceDto } from './dto/update-master-source.dto';

@Injectable()
export class MasterSourceRepository {
  constructor(
    @InjectRepository(MasterSource)
    private readonly repository: Repository<MasterSource>,
  ) {}

  async create(createMasterSourceDto: CreateMasterSourceDto): Promise<MasterSource> {
    const source = this.repository.create(createMasterSourceDto);
    return await this.repository.save(source);
  }

  async findAll(): Promise<MasterSource[]> {
    return await this.repository.find();
  }

  async findOne(id: number): Promise<MasterSource | null> {
    const source = await this.repository.findOne({ where: { id } });
    if (!source) {
      return null;
    }
    return source;
  }

  async findByOrganizationId(organization_id: number): Promise<MasterSource | null> {
    const source = await this.repository.findOne({ where: { organization_id } });
    if (!source) {
      return null;
    }
    return source;
  }

  async update(id: number, updateMasterSourceDto: UpdateMasterSourceDto): Promise<MasterSource | null> {
    const source = await this.findOne(Number(id));
    if (!source) {
      throw new NotFoundException('Source not found');
    }
    await this.repository.update(id, updateMasterSourceDto);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const source = await this.findOne(id);
    if (!source) {
      throw new NotFoundException('Source not found');
    }
    await this.repository.delete(id);
  }
}
