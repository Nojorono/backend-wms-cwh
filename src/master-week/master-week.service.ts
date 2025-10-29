import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { MasterWeekRepository } from './master-week.repository';
import { CreateMasterWeekDto } from './dto/create-master-week.dto';
import { UpdateMasterWeekDto } from './dto/update-master-week.dto';
import { MasterWeek } from '../core/domain/entities/master-week.entity';
import {
  WeekListIntegrationService,
  WeekListResponseDto,
  WeekSalesResponseDto,
} from './integration/week-list-integration.service';

@Injectable()
export class MasterWeekService {
  constructor(
    private readonly repository: MasterWeekRepository,
    private readonly weekListIntegrationService: WeekListIntegrationService,
  ) {}

  async create(createMasterWeekDto: CreateMasterWeekDto): Promise<MasterWeek> {
    return await this.repository.create(createMasterWeekDto);
  }

  async findAll(): Promise<MasterWeek[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<MasterWeek> {
    const week = await this.repository.findOne(id);
    if (!week) {
      throw new NotFoundException(`Week with ID ${id} not found`);
    }
    return week;
  }

  async findByDate(date: Date): Promise<MasterWeek[]> {
    return await this.repository.findByDate(date);
  }

  async update(id: string, updateMasterWeekDto: UpdateMasterWeekDto): Promise<MasterWeek> {
    const updatedWeek = await this.repository.update(id, updateMasterWeekDto);
    if (!updatedWeek) {
      throw new NotFoundException(`Week with ID ${id} not found`);
    }
    return updatedWeek;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }

  async createOrUpdateFromMetaOracle(week: any): Promise<MasterWeek | null> {
    return await this.repository.create({
      BULAN: week.BULAN,
      MINGGU: week.MINGGU,
      QUARTER: week.QUARTER,
      TAHUN: week.TAHUN,
      TANGGAL_AKHIR_MINGGU: week.TANGGAL_AKHIR_MINGGU,
      TANGGAL_AKHIR_MINGGU_REAL: week.TANGGAL_AKHIR_MINGGU_REAL,
      TANGGAL_AWAL_MINGGU: week.TANGGAL_AWAL_MINGGU,
      TANGGAL_AWAL_MINGGU_REAL: week.TANGGAL_AWAL_MINGGU_REAL,
    });
  }

  async syncFromMetaOracle(year: string): Promise<WeekListResponseDto> {
    const weekLists = await this.weekListIntegrationService.getWeekSalesAll({ tahun: year });

    if (weekLists.status) {
      for (const week of weekLists.data) {
        await this.createOrUpdateFromMetaOracle(week);
      }
    }

    return weekLists;
  }

  async getWeekSalesAll(params?: {
    tahun?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<WeekSalesResponseDto> {
    return await this.weekListIntegrationService.getWeekSalesAll(params);
  }
}
