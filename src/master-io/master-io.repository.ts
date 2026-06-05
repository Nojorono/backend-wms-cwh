import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterIO } from '../core/domain/entities/master-io.entity';
import { CreateMasterIODto } from './dto/create-master-io.dto';
import { UpdateMasterIODto } from './dto/update-master-io.dto';

@Injectable()
export class MasterIORepository {
  constructor(
    @InjectRepository(MasterIO)
    private readonly repository: Repository<MasterIO>,
  ) {}

  async create(createMasterIODto: CreateMasterIODto): Promise<MasterIO> {
    const io = this.repository.create(createMasterIODto);
    return await this.repository.save(io);
  }

  async findAll(): Promise<MasterIO[]> {
    return await this.repository.find();
  }

  async findOne(id: string): Promise<MasterIO | null> {
    const io = await this.repository.findOne({ where: { id } });
    if (!io) {
      return null;
    }
    return io;
  }

  async findByOrganizationId(organization_id: number): Promise<MasterIO | null> {
    const io = await this.repository.findOne({ where: { organization_id } });
    if (!io) {
      return null;
    }
    return io;
  }

  async findByOrganizationCode(organization_code: string): Promise<MasterIO | null> {
    const io = await this.repository.findOne({ where: { organization_code } });
    if (!io) {
      return null;
    }
    return io;
  }

  async findByOrganizationName(organization_name: string): Promise<MasterIO | null> {
    const io = await this.repository.findOne({ where: { organization_name } });
    if (!io) {
      return null;
    }
    return io;
  }

  async update(id: string, updateMasterIODto: UpdateMasterIODto): Promise<MasterIO | null> {
    const io = await this.findOne(id);
    if (!io) {
      throw new NotFoundException('IO not found');
    }
    await this.repository.update(id, updateMasterIODto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const io = await this.findOne(id);
    if (!io) {
      throw new NotFoundException('IO not found');
    }
    await this.repository.delete(id);
  }
}
