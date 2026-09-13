import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WorkScheduled,
  WorkScheduledDayType,
} from '../core/domain/entities/work-scheduled.entity';
import { MasterIO } from '../core/domain/entities/master-io.entity';
import {
  isWorkingDay,
  resolveWorkScheduledDayType,
} from '../core/utils/work-scheduled-resolver.util';
import { IndonesiaNationalHolidayService } from './data/indonesia-national-holiday.service';
import { INDONESIA_HOLIDAY_API_BASE_URL } from './data/indonesia-national-holidays.data';
import { CreateWorkScheduledDto } from './dto/create-work-scheduled.dto';
import { GenerateWorkScheduledDto } from './dto/generate-work-scheduled.dto';
import { GetBtbDateQueryDto } from './dto/get-btb-date-query.dto';
import { GetCallplanDateQueryDto } from './dto/get-callplan-date-query.dto';
import { GetCallplanDateSubmittedQueryDto } from './dto/get-callplan-date-submitted-query.dto';
import { ResolveWorkScheduledQueryDto } from './dto/resolve-work-scheduled-query.dto';
import { UpdateWorkScheduledDto } from './dto/update-work-scheduled.dto';
import { WorkScheduledFilterQueryDto } from './dto/work-scheduled-filter-query.dto';
import {
  formatDateOnly,
  generateYearCalendarDays,
  GenerateYearCalendarSummary,
  toDateOnly,
} from './utils/work-scheduled-generator.util';
import {
  formatDateOnlyString,
  getTodayDateOnlyInIndonesia,
  shiftWorkingDays,
} from './utils/work-scheduled-business-day.util';
import { WorkScheduledRepository } from './work-scheduled.repository';

export interface GenerateWorkScheduledResult {
  year: number;
  organizationId?: string;
  inserted: number;
  updated: number;
  skipped: number;
  summary: GenerateYearCalendarSummary;
  hasNationalHolidayData: boolean;
  nationalHolidayCount: number;
  holidayApiSource: string;
}

export interface ResolveWorkScheduledResult {
  date: string;
  organizationId?: string;
  dayType: WorkScheduledDayType;
  isWorkingDay: boolean;
  source: 'branch' | 'default' | 'system';
  entry?: WorkScheduled;
}

export interface BusinessDateResult {
  date: string;
  baseDate: string;
  workingDaysShift: number;
  organizationId?: string;
}

const CALLPLAN_WORKING_DAYS_AHEAD = 2;
const WAREHOUSE_CALLPLAN_PREP_WORKING_DAYS_AHEAD = 1;
const BTB_WORKING_DAYS_BACK = 1;

@Injectable()
export class WorkScheduledService {
  constructor(
    private readonly repository: WorkScheduledRepository,
    @InjectRepository(MasterIO)
    private readonly masterIoRepository: Repository<MasterIO>,
    private readonly holidayService: IndonesiaNationalHolidayService,
  ) { }

  async create(dto: CreateWorkScheduledDto): Promise<WorkScheduled> {
    await this.ensureOrganizationExists(dto.organizationId);

    const existing = await this.repository.findByOrganizationAndDate(
      dto.organizationId,
      dto.calendarDate,
    );

    if (existing) {
      throw new ConflictException(
        'Kalender untuk tanggal dan cabang ini sudah ada. Gunakan update atau generate dengan overwrite.',
      );
    }

    return this.repository.create(dto);
  }

  async findAll(query: WorkScheduledFilterQueryDto): Promise<WorkScheduled[]> {
    return this.repository.findAll(query);
  }

  async findOne(id: string): Promise<WorkScheduled> {
    const entry = await this.repository.findOne(id);
    if (!entry) {
      throw new NotFoundException(`Work scheduled entry with ID ${id} not found`);
    }
    return entry;
  }

  async update(id: string, dto: UpdateWorkScheduledDto): Promise<WorkScheduled> {
    await this.findOne(id);
    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Work scheduled entry with ID ${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }

  async generateYear(dto: GenerateWorkScheduledDto): Promise<GenerateWorkScheduledResult> {
    await this.ensureOrganizationExists(dto.organizationId);

    const holidays = await this.holidayService.getHolidays(dto.year);
    const { days, summary } = generateYearCalendarDays({
      year: dto.year,
      includeJointLeave: dto.includeJointLeave ?? true,
      holidays,
    });

    const bulkResult = await this.repository.bulkUpsertYearDays(
      dto.organizationId,
      days,
      dto.overwrite ?? false,
      dto.createdBy,
    );

    return {
      year: dto.year,
      organizationId: dto.organizationId,
      inserted: bulkResult.inserted,
      updated: bulkResult.updated,
      skipped: bulkResult.skipped,
      summary,
      hasNationalHolidayData: holidays.length > 0,
      nationalHolidayCount: holidays.length,
      holidayApiSource: INDONESIA_HOLIDAY_API_BASE_URL,
    };
  }

  async getNationalHolidays(year: number) {
    const holidays = await this.holidayService.getHolidays(year);
    return {
      year,
      count: holidays.length,
      source: INDONESIA_HOLIDAY_API_BASE_URL,
      holidays,
    };
  }

  async resolveDay(query: ResolveWorkScheduledQueryDto): Promise<ResolveWorkScheduledResult> {
    const date = toDateOnly(query.date);
    const branchEntry = query.organizationId
      ? await this.repository.findByOrganizationAndDate(query.organizationId, date)
      : null;
    const defaultEntry = await this.repository.findByOrganizationAndDate(undefined, date);

    let source: ResolveWorkScheduledResult['source'] = 'system';
    if (branchEntry) {
      source = 'branch';
    } else if (defaultEntry) {
      source = 'default';
    }

    const dayType = resolveWorkScheduledDayType(
      date,
      branchEntry?.dayType,
      defaultEntry?.dayType,
    );

    return {
      date: query.date,
      organizationId: query.organizationId,
      dayType,
      isWorkingDay: isWorkingDay(dayType),
      source,
      entry: branchEntry ?? defaultEntry ?? undefined,
    };
  }

  getHolidayCacheInfo(): { cachedYears: number[] } {
    return { cachedYears: this.holidayService.getCachedYears() };
  }

  async getCallplanDate(query: GetCallplanDateQueryDto): Promise<BusinessDateResult> {
    await this.ensureOrganizationExists(query.organizationId);

    const baseDate = query.baseDate ? toDateOnly(query.baseDate) : getTodayDateOnlyInIndonesia();
    const resultDate = await this.shiftWorkingDaysSafely(
      baseDate,
      CALLPLAN_WORKING_DAYS_AHEAD,
      query.organizationId,
    );

    return this.buildBusinessDateResult({
      baseDate,
      resultDate,
      workingDaysShift: CALLPLAN_WORKING_DAYS_AHEAD,
      organizationId: query.organizationId,
    });
  }

  async getCallplanDateSubmitted(
    query: GetCallplanDateSubmittedQueryDto,
  ): Promise<BusinessDateResult> {
    await this.ensureOrganizationExists(query.organizationId);

    const baseDate = query.baseDate ? toDateOnly(query.baseDate) : getTodayDateOnlyInIndonesia();
    const resultDate = await this.shiftWorkingDaysSafely(
      baseDate,
      WAREHOUSE_CALLPLAN_PREP_WORKING_DAYS_AHEAD,
      query.organizationId,
    );

    return this.buildBusinessDateResult({
      baseDate,
      resultDate,
      workingDaysShift: WAREHOUSE_CALLPLAN_PREP_WORKING_DAYS_AHEAD,
      organizationId: query.organizationId,
    });
  }

  async getBtbDate(query: GetBtbDateQueryDto): Promise<BusinessDateResult> {
    await this.ensureOrganizationExists(query.organizationId);

    const baseDate = query.baseDate ? toDateOnly(query.baseDate) : getTodayDateOnlyInIndonesia();
    const resultDate = await this.shiftWorkingDaysSafely(
      baseDate,
      -BTB_WORKING_DAYS_BACK,
      query.organizationId,
    );

    return this.buildBusinessDateResult({
      baseDate,
      resultDate,
      workingDaysShift: -BTB_WORKING_DAYS_BACK,
      organizationId: query.organizationId,
    });
  }

  private async shiftWorkingDaysSafely(
    startDate: Date,
    workingDays: number,
    organizationId?: string,
  ): Promise<Date> {
    try {
      return await shiftWorkingDays(startDate, workingDays, (date) =>
        this.checkIsWorkingDay(date, organizationId),
      );
    } catch {
      throw new BadRequestException(
        `Unable to calculate business date within calendar range (${workingDays} working day shift)`,
      );
    }
  }

  private async checkIsWorkingDay(date: Date, organizationId?: string): Promise<boolean> {
    const resolved = await this.resolveDay({
      date: formatDateOnly(date),
      organizationId,
    });

    return resolved.isWorkingDay;
  }

  private buildBusinessDateResult(params: {
    baseDate: Date;
    resultDate: Date;
    workingDaysShift: number;
    organizationId?: string;
  }): BusinessDateResult {
    return {
      date: formatDateOnlyString(params.resultDate),
      baseDate: formatDateOnlyString(params.baseDate),
      workingDaysShift: params.workingDaysShift,
      organizationId: params.organizationId,
    };
  }

  private async ensureOrganizationExists(organizationId?: string): Promise<void> {
    if (!organizationId) {
      return;
    }

    const organization = await this.masterIoRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new BadRequestException(`Organization with ID ${organizationId} not found`);
    }
  }
}
