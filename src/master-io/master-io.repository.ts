import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterIO } from '../core/domain/entities/master-io.entity';
import { CreateMasterIODto } from './dto/create-master-io.dto';
import { UpdateMasterIODto } from './dto/update-master-io.dto';
import { MasterIOFilter } from './dto/master-io-filter-query.dto';

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

  async findAll(filters?: MasterIOFilter): Promise<MasterIO[]> {
    const qb = this.repository.createQueryBuilder('io');

    if (filters?.organization_types?.length) {
      qb.andWhere('io.organization_type IN (:...organization_types)', {
        organization_types: filters.organization_types,
      });
    }

    if (filters?.region_code === null) {
      qb.andWhere('io.region_code IS NULL');
    } else if (filters?.region_code !== undefined) {
      qb.andWhere('io.region_code = :region_code', { region_code: filters.region_code });
    }

    if (filters?.end_date_active === null) {
      qb.andWhere('io.end_date_active IS NULL');
    } else if (filters?.end_date_active !== undefined) {
      qb.andWhere('io.end_date_active = :end_date_active', {
        end_date_active: filters.end_date_active,
      });
    }

    qb.orderBy('io.createdAt', 'DESC');
    return await qb.getMany();
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
