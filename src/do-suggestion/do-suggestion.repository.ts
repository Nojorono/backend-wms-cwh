import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';import { DoSuggestion } from '../core/domain/entities/do-suggestion.entity';
import { DoSuggestionStatus } from '../core/domain/entities/do-suggestion.entity';import { DoSuggestionDetail } from '../core/domain/entities/do-suggestion-detail.entity';
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
    | 'sales_spv_nik'
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

export interface DoSuggestionItemCallplanSumRow {
  organization_id: string;
  item_code: string;
  total_qty_submitted: number;
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

      for (const line of lines) {
        if (line.id) {
          await this.updateDetailLine(queryRunner.manager, id, line);
          continue;
        }

        const { id: _lineId, ...lineData } = line;
        const patch = Object.fromEntries(
          Object.entries(lineData).filter(([, value]) => value !== undefined),
        );

        await queryRunner.manager.save(
          DoSuggestionDetail,
          this.detailRepository.create({
            ...patch,
            do_suggestion_uuid: id,
          }),
        );
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
  async findAll(status?: DoSuggestionStatus): Promise<DoSuggestion[]> {
    const qb = this.headerRepository
      .createQueryBuilder('ds')
      .leftJoinAndSelect('ds.details', 'details')
      .leftJoinAndSelect('ds.organization', 'organization');

    if (status) {
      qb.andWhere('ds.status = :status', { status });
    }

    return await qb.orderBy('ds.createdAt', 'DESC').getMany();
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

  async findByCallplanDateStartOrganizationAndSalesSpvNik(
    callplanDateStart: Date,
    organizationId: string,
    salesSpvNik?: string,
    status?: DoSuggestionStatus,
  ): Promise<DoSuggestion[]> {
    const qb = this.headerRepository
      .createQueryBuilder('ds')
      .leftJoinAndSelect('ds.details', 'details')
      .leftJoinAndSelect('ds.organization', 'organization')
      .where('ds.callplan_date_start = :callplanDateStart', { callplanDateStart })
      .andWhere('ds.organization_id = :organizationId', { organizationId });

    if (salesSpvNik) {
      qb.andWhere('ds.sales_spv_nik = :salesSpvNik', { salesSpvNik });
    }

    if (status) {
      qb.andWhere('ds.status = :status', { status });
    }

    return await qb.orderBy('ds.createdAt', 'DESC').getMany();
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

  async findByOrganizationIdAndItemCodeAndDate(
    organizationId: string,
    itemCode?: string,
    date?: string,
    status?: DoSuggestionStatus,
  ): Promise<DoSuggestionItemCallplanSumRow[]> {
    const qb = this.headerRepository
      .createQueryBuilder('ds')
      .innerJoin('ds.details', 'details', 'details.deleted_at IS NULL')
      .select('ds.organization_id', 'organization_id')
      .addSelect('details.item_code', 'item_code')
      .addSelect(
        'COALESCE(SUM(COALESCE(details.item_qty_submitted, 0)), 0)',
        'total_qty_submitted',
      )
      .where('ds.organization_id = :organizationId', { organizationId })
      .andWhere('ds.deleted_at IS NULL')
      .groupBy('ds.organization_id')
      .addGroupBy('details.item_code');

    if (itemCode?.trim()) {
      qb.andWhere('details.item_code = :itemCode', { itemCode: itemCode.trim() });
    }

    if (date?.trim()) {
      const callplanDateStart = new Date(date.trim().split('T')[0]);
      qb.andWhere('ds.callplan_date_start = :callplanDateStart', { callplanDateStart });
    }

    if (status) {
      qb.andWhere('ds.status = :status', { status });
    }

    const rows = await qb
      .orderBy('details.item_code', 'ASC')
      .getRawMany<{
        organization_id: string;
        item_code: string;
        total_qty_submitted: string;
      }>();

    return rows.map((row) => ({
      organization_id: row.organization_id,
      item_code: row.item_code,
      total_qty_submitted: Number(row.total_qty_submitted) || 0,
    }));
  }

  private async updateDetailLine(
    manager: EntityManager,
    suggestionId: string,
    line: DoSuggestionDetailData,
  ): Promise<void> {
    const lineId = line.id as string;
    const existingLine = await manager.findOne(DoSuggestionDetail, {
      where: { id: lineId },
      withDeleted: true,
    });

    if (!existingLine) {
      throw new NotFoundException(`DO suggestion detail with ID ${lineId} not found`);
    }

    if (existingLine.do_suggestion_uuid !== suggestionId) {
      throw new BadRequestException(
        `DO suggestion detail with ID ${lineId} does not belong to DO suggestion ${suggestionId}`,
      );
    }

    if (existingLine.deletedAt) {
      await manager.restore(DoSuggestionDetail, lineId);
    }

    const { id: _lineId, ...linePatch } = line;
    const patch = Object.fromEntries(
      Object.entries(linePatch).filter(([, value]) => value !== undefined),
    );

    if (Object.keys(patch).length > 0) {
      await manager.update(DoSuggestionDetail, lineId, patch);
    }
  }
}