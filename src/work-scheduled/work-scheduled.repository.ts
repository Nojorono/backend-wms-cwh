import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { WorkScheduled } from '../core/domain/entities/work-scheduled.entity';
import { CreateWorkScheduledDto } from './dto/create-work-scheduled.dto';
import { UpdateWorkScheduledDto } from './dto/update-work-scheduled.dto';
import { WorkScheduledFilterQueryDto } from './dto/work-scheduled-filter-query.dto';
import { GeneratedWorkScheduledDay } from './utils/work-scheduled-generator.util';

export interface WorkScheduledBulkUpsertResult {
  inserted: number;
  updated: number;
  skipped: number;
}

@Injectable()
export class WorkScheduledRepository {
  constructor(
    @InjectRepository(WorkScheduled)
    private readonly repository: Repository<WorkScheduled>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateWorkScheduledDto): Promise<WorkScheduled> {
    const entity = this.repository.create({
      organizationId: dto.organizationId,
      calendarDate: dto.calendarDate,
      dayType: dto.dayType,
      name: dto.name,
      description: dto.description,
      createdBy: dto.createdBy,
    });

    return this.repository.save(entity);
  }

  async findAll(filters: WorkScheduledFilterQueryDto): Promise<WorkScheduled[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('workScheduled')
      .leftJoinAndSelect('workScheduled.organization', 'organization')
      .orderBy('workScheduled.calendarDate', 'ASC');

    if (filters.defaultOnly) {
      queryBuilder.andWhere('workScheduled.organizationId IS NULL');
    } else if (filters.organizationId) {
      queryBuilder.andWhere('workScheduled.organizationId = :organizationId', {
        organizationId: filters.organizationId,
      });
    }

    if (filters.year) {
      queryBuilder.andWhere('EXTRACT(YEAR FROM workScheduled.calendarDate) = :year', {
        year: filters.year,
      });
    }

    if (filters.month) {
      queryBuilder.andWhere('EXTRACT(MONTH FROM workScheduled.calendarDate) = :month', {
        month: filters.month,
      });
    }

    if (filters.dayType) {
      queryBuilder.andWhere('workScheduled.dayType = :dayType', {
        dayType: filters.dayType,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<WorkScheduled | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['organization'],
    });
  }

  async findByOrganizationAndDate(
    organizationId: string | null | undefined,
    calendarDate: Date,
  ): Promise<WorkScheduled | null> {
    return this.repository.findOne({
      where: {
        organizationId: organizationId ? organizationId : IsNull(),
        calendarDate,
      },
    });
  }

  async findByYear(
    year: number,
    organizationId?: string | null,
  ): Promise<WorkScheduled[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('workScheduled')
      .where('EXTRACT(YEAR FROM workScheduled.calendarDate) = :year', { year });

    if (organizationId === undefined) {
      return queryBuilder.getMany();
    }

    if (organizationId === null) {
      queryBuilder.andWhere('workScheduled.organizationId IS NULL');
    } else {
      queryBuilder.andWhere('workScheduled.organizationId = :organizationId', {
        organizationId,
      });
    }

    return queryBuilder.getMany();
  }

  async update(id: string, dto: UpdateWorkScheduledDto): Promise<WorkScheduled | null> {
    await this.repository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async bulkUpsertYearDays(
    organizationId: string | undefined,
    days: GeneratedWorkScheduledDay[],
    overwrite: boolean,
    createdBy?: string,
  ): Promise<WorkScheduledBulkUpsertResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const result: WorkScheduledBulkUpsertResult = {
      inserted: 0,
      updated: 0,
      skipped: 0,
    };

    try {
      for (const day of days) {
        const existing = await queryRunner.manager.findOne(WorkScheduled, {
          where: {
            organizationId: organizationId ? organizationId : IsNull(),
            calendarDate: day.calendarDate,
          },
        });

        if (existing) {
          if (!overwrite) {
            result.skipped += 1;
            continue;
          }

          await queryRunner.manager.update(WorkScheduled, existing.id, {
            dayType: day.dayType,
            name: day.name,
            description: day.description,
            updatedBy: createdBy,
          });
          result.updated += 1;
          continue;
        }

        await queryRunner.manager.save(
          WorkScheduled,
          queryRunner.manager.create(WorkScheduled, {
            organizationId,
            calendarDate: day.calendarDate,
            dayType: day.dayType,
            name: day.name,
            description: day.description,
            createdBy,
          }),
        );
        result.inserted += 1;
      }

      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
