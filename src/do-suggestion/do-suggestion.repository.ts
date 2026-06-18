import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DoSuggestion } from '../core/domain/entities/do-suggestion.entity';
import { DoSuggestionDetail } from '../core/domain/entities/do-suggestion-detail.entity';
import { formatSpbNumber, parseSpbSequence } from './do-suggestion-spb.util';

const DO_SUGGESTION_RELATIONS = ['details', 'organization'] as const;

export type DoSuggestionHeaderData = Partial<
  Pick<
    DoSuggestion,
    | 'organization_id'
    | 'callplan_number'
    | 'callplan_date_start'
    | 'callplan_date_end'
    | 'route_number'
    | 'trip_type'
    | 'sales_nik'
    | 'sales_name'
    | 'sales_spv'
    | 'status'
    | 'created_by'
    | 'updated_by'
    | 'spb_date'
    | 'spb_number'
  >
>;

export type DoSuggestionDetailData = Partial<
  Pick<
    DoSuggestionDetail,
    | 'id'
    | 'item_code'
    | 'item_qty_suggestion'
    | 'item_qty_revision'
    | 'item_qty_final'
    | 'contribution_percentage'
    | 'item_uom'
  >
>;

export interface DoSuggestionPersistData extends DoSuggestionHeaderData {
  lines: DoSuggestionDetailData[];
}

@Injectable()
export class DoSuggestionRepository {
  constructor(
    @InjectRepository(DoSuggestion)
    private readonly headerRepository: Repository<DoSuggestion>,
    @InjectRepository(DoSuggestionDetail)
    private readonly detailRepository: Repository<DoSuggestionDetail>,
    private readonly dataSource: DataSource,
  ) { }

  async create(data: DoSuggestionPersistData): Promise<DoSuggestion> {
    const { lines, ...header } = data;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const savedHeader = await queryRunner.manager.save(
        DoSuggestion,
        this.headerRepository.create(header),
      );

      if (lines.length) {
        const detailEntities = lines.map((line) =>
          this.detailRepository.create({
            ...line,
            do_suggestion_uuid: savedHeader.id,
          }),
        );
        await queryRunner.manager.save(DoSuggestionDetail, detailEntities);
      }

      await queryRunner.commitTransaction();
      return (await this.findById(savedHeader.id)) as DoSuggestion;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, data: DoSuggestionPersistData): Promise<DoSuggestion> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(`DO suggestion with ID ${id} not found`);
    }

    const { lines, ...header } = data;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (Object.keys(header).length > 0) {
        await queryRunner.manager.update(DoSuggestion, id, header);
      }

      await queryRunner.manager.softDelete(DoSuggestionDetail, {
        do_suggestion_uuid: id,
      });

      if (lines.length) {
        const detailEntities = lines.map((line) => {
          const { id: _lineId, ...lineData } = line;
          return this.detailRepository.create({
            ...lineData,
            do_suggestion_uuid: id,
          });
        });
        await queryRunner.manager.save(DoSuggestionDetail, detailEntities);
      }

      await queryRunner.commitTransaction();
      return (await this.findById(id)) as DoSuggestion;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<DoSuggestion[]> {
    return await this.headerRepository.find({
      relations: [...DO_SUGGESTION_RELATIONS],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<DoSuggestion | null> {
    return await this.headerRepository.findOne({
      where: { id },
      relations: [...DO_SUGGESTION_RELATIONS],
    });
  }

  async findByCallplanNumber(callplanNumber: string): Promise<DoSuggestion[]> {
    return await this.headerRepository.find({
      where: { callplan_number: callplanNumber },
      relations: [...DO_SUGGESTION_RELATIONS],
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(`DO suggestion with ID ${id} not found`);
    }

    await this.headerRepository.softDelete(id);
  }

  // SPB/{callplan_number}/5{NNN} — sequence increments per callplan_date_start + callplan_number
  async generateNextSpbNumber(
    callplanNumber: string,
    callplanDateStart: Date,
  ): Promise<string> {
    const rows = await this.headerRepository
      .createQueryBuilder('ds')
      .select('ds.spb_number', 'spb_number')
      .where('ds.callplan_number = :callplanNumber', { callplanNumber })
      .andWhere('ds.callplan_date_start = :callplanDateStart', { callplanDateStart })
      .andWhere('ds.spb_number IS NOT NULL')
      .getRawMany<{ spb_number: string }>();

    let maxSequence = 0;
    for (const row of rows) {
      const sequence = parseSpbSequence(row.spb_number);
      if (sequence != null && sequence > maxSequence) {
        maxSequence = sequence;
      }
    }

    return formatSpbNumber(callplanNumber, maxSequence + 1);
  }
}
