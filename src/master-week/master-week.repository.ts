import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { MoreThanOrEqual } from 'typeorm';
import { MasterWeek } from '../core/domain/entities/master-week.entity';
import { CreateMasterWeekDto } from './dto/create-master-week.dto';
import { UpdateMasterWeekDto } from './dto/update-master-week.dto';

@Injectable()
export class MasterWeekRepository {
  constructor(
    @InjectRepository(MasterWeek)
    private readonly repository: Repository<MasterWeek>,
  ) {}

  async create(createMasterWeekDto: CreateMasterWeekDto): Promise<MasterWeek> {
    const week = this.repository.create(createMasterWeekDto);
    return await this.repository.save(week);
  }

  async findAll(): Promise<MasterWeek[]> {
    return await this.repository.find();
  }

  async findAllWithFilters(filters: {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<MasterWeek[]> {
    const { search, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = filters;
    
    const queryBuilder = this.repository.createQueryBuilder('masterWeek');
    
    if (search) {
      queryBuilder.where(
        '(masterWeek.BULAN::text ILIKE :search OR masterWeek.MINGGU::text ILIKE :search OR masterWeek.QUARTER::text ILIKE :search OR masterWeek.TAHUN::text ILIKE :search)',
        { search: `%${search}%` }
      );
    }
    
    queryBuilder
      .orderBy(`masterWeek.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    
    return await queryBuilder.getMany();
  }

  async findOne(id: string): Promise<MasterWeek | null> {
    const week = await this.repository.findOne({ where: { id } });
    if (!week) {
      return null;
    }
    return week;
  }

  async findByDate(date: Date): Promise<MasterWeek | null> {
    // beetween TANGGAL_AWAL_MINGGU_REAL and TANGGAL_AKHIR_MINGGU_REAL
    const week = await this.repository.findOne({ where: { TANGGAL_AWAL_MINGGU_REAL: LessThanOrEqual(date), TANGGAL_AKHIR_MINGGU_REAL: MoreThanOrEqual(date) } });
    if (!week) {
      return null;
    }
    return week;
  }

  async update(
    id: string,
    updateMasterWeekDto: UpdateMasterWeekDto,
  ): Promise<MasterWeek | null> {
    const week = await this.findOne(id);
    if (!week) {
      throw new NotFoundException('Week not found');
    }
    await this.repository.update(id, updateMasterWeekDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const week = await this.findOne(id);
    if (!week) {
      throw new NotFoundException('Week not found');
    }
    await this.repository.delete(id);
  }
}
