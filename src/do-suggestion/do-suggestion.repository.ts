import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'; import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm'; import { DoSuggestion } from '../core/domain/entities/do-suggestion.entity';
import { DoSuggestionStatus } from '../core/domain/entities/do-suggestion.entity'; import { DoSuggestionDetail } from '../core/domain/entities/do-suggestion-detail.entity';
import { MoveOrderIntegration } from '../core/domain/entities/move-order-integration.entity';
import { formatSpbNumber, parseSpbSequence, formatOrganizationCallplanNumber, buildOrganizationCallplanPrefix, parseOrganizationCallplanSequence } from './do-suggestion-spb.util';
import {
  DO_SUGGESTION_VOID_BACK_TO_KECIL_SUFFIX,
  parseDoSuggestionIdFromVoidSourceHeaderId,
} from './do-suggestion-void.util';

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
    | 'spb_type'
    | 'mo_type'
    | 'preparation_date'
  >
>;

export type DoSuggestionDetailData = Partial<
  Pick<
    DoSuggestionDetail,
    | 'id'
    | 'item_code'
    | 'inventory_item_id'
    | 'item_qty_suggestion'
    | 'item_qty_revision'
    | 'item_qty_submitted'
    | 'item_qty_final'
    | 'item_qty_void'
    | 'contribution_percentage'
    | 'item_uom'
    | 'line_number'
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

export interface DoSuggestionPendingSubmissionFilters {
  callplanDateStart?: Date;
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

  async findAllReturn(
    organizationId: string,
    callplanDateStart: string,
  ): Promise<DoSuggestion[]> {
    return await this.headerRepository
      .createQueryBuilder('ds')
      .select([
        'ds.id',
        'ds.spb_number',
        'ds.spb_type',
        'ds.mo_type',
        'ds.spb_date',
        'ds.callplan_number',
        'ds.callplan_date_start',
        'ds.callplan_date_end',
        'ds.sales_nik',
        'ds.sales_name',
        'ds.status',
        'ds.createdAt',
      ])
      .innerJoin(
        'ds.details',
        'details',
        'details.deleted_at IS NULL AND (details.item_qty_revision < 0 OR details.item_qty_void < 0)',
      )
      .addSelect([
        'details.id',
        'details.do_suggestion_uuid',
        'details.item_code',
        'details.inventory_item_id',
        'details.item_qty_final',
        'details.item_qty_submitted',
        'details.item_qty_void',
        'details.item_qty_revision',
        'details.item_uom',
        'details.line_number',
      ])
      .where('ds.organization_id = :organizationId', { organizationId })
      .andWhere('ds.callplan_date_start = :callplanDateStart', { callplanDateStart })
      .andWhere('ds.deleted_at IS NULL')
      .andWhere('ds.status IN (:...statuses)', {
        statuses: [
          DoSuggestionStatus.FINAL,
          DoSuggestionStatus.REVISED,
          DoSuggestionStatus.VOID,
          DoSuggestionStatus.VOID_NEED_ACTION,
        ],
      })
      .orderBy('ds.createdAt', 'DESC')
      .addOrderBy('details.line_number', 'ASC')
      .getMany();
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

  async findPendingForSubmission(
    filters: DoSuggestionPendingSubmissionFilters = {},
  ): Promise<DoSuggestion[]> {
    const qb = this.headerRepository
      .createQueryBuilder('ds')
      .leftJoinAndSelect('ds.details', 'details', 'details.deleted_at IS NULL')
      .leftJoinAndSelect('ds.organization', 'organization')
      .where('ds.deleted_at IS NULL')
      .andWhere('ds.status IS DISTINCT FROM :submitted', {
        submitted: DoSuggestionStatus.SUBMITTED,
      })
      .andWhere('ds.status IS DISTINCT FROM :final', {
        final: DoSuggestionStatus.FINAL,
      });

    if (filters.callplanDateStart) {
      qb.andWhere('ds.callplan_date_start = :callplanDateStart', {
        callplanDateStart: filters.callplanDateStart,
      });
    }

    return await qb.orderBy('ds.createdAt', 'ASC').getMany();
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
      .leftJoinAndMapOne(
        'ds.move_order_integration',
        MoveOrderIntegration,
        'move_order_integration',
        'move_order_integration.source_header_id = CAST(ds.id AS varchar) AND move_order_integration.deleted_at IS NULL',
      )
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

  async generateNextOrganizationCallplanNumber(
    organizationId: string,
    organizationCode: string,
    callplanDateStart: Date,
  ): Promise<string> {
    const prefix = buildOrganizationCallplanPrefix(organizationCode, callplanDateStart);
    const rows = await this.headerRepository
      .createQueryBuilder('ds')
      .select('ds.callplan_number', 'callplan_number')
      .where('ds.organization_id = :organizationId', { organizationId })
      .andWhere('ds.callplan_number LIKE :prefix', { prefix: `${prefix}/%` })
      .andWhere('ds.deleted_at IS NULL')
      .getRawMany<{ callplan_number: string }>();

    let maxSequence = 0;
    for (const row of rows) {
      const sequence = parseOrganizationCallplanSequence(row.callplan_number, prefix);
      if (sequence != null && sequence > maxSequence) {
        maxSequence = sequence;
      }
    }

    return formatOrganizationCallplanNumber(
      organizationCode,
      callplanDateStart,
      maxSequence + 1,
    );
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

  async findBySpbNumber(spbNumber: string): Promise<
    (DoSuggestion & { move_order_integration?: MoveOrderIntegration | null }) | null
  > {
    const result = await this.headerRepository
      .createQueryBuilder('ds')
      .leftJoinAndSelect('ds.details', 'details')
      .leftJoinAndSelect('ds.organization', 'organization')
      .leftJoinAndMapOne(
        'ds.move_order_integration',
        MoveOrderIntegration,
        'move_order_integration',
        'move_order_integration.source_header_id = CAST(ds.id AS varchar) AND move_order_integration.deleted_at IS NULL',
      )
      .where('ds.spb_number = :spbNumber', { spbNumber })
      .andWhere('ds.deleted_at IS NULL')
      .getOne();

    return result as
      | (DoSuggestion & { move_order_integration?: MoveOrderIntegration | null })
      | null;
  }

  async updateStatus(
    id: string,
    status: DoSuggestionStatus,
    updatedBy?: string,
  ): Promise<DoSuggestion> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(`DO suggestion with ID ${id} not found`);
    }

    const patch: Partial<DoSuggestion> = { status };
    if (updatedBy !== undefined) {
      patch.updated_by = updatedBy;
    }

    await this.headerRepository.update(id, patch);
    return (await this.findById(id)) as DoSuggestion;
  }

  /**
   * Void DO suggestion: update header status and set each detail
   * item_qty_void = -item_qty_final.
   */
  async voidWithQuantities(
    id: string,
    status: DoSuggestionStatus,
    updatedBy?: string,
  ): Promise<DoSuggestion> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(`DO suggestion with ID ${id} not found`);
    }

    await this.dataSource.transaction(async (manager) => {
      const headerPatch: Partial<DoSuggestion> = { status };
      if (updatedBy !== undefined) {
        headerPatch.updated_by = updatedBy;
      }
      await manager.update(DoSuggestion, id, headerPatch);

      await manager
        .createQueryBuilder()
        .update(DoSuggestionDetail)
        .set({
          item_qty_void: () => '-COALESCE(item_qty_final, 0)',
        })
        .where('do_suggestion_uuid = :id', { id })
        .andWhere('deleted_at IS NULL')
        .execute();
    });

    return (await this.findById(id)) as DoSuggestion;
  }

  /**
   * After back-to-kecil move order polling succeeds (`source_header_id` ends with `-V`),
   * finalize DO suggestion status from VOID_NEED_ACTION to VOID.
   */
  async completeVoidAfterBackToKecil(
    sourceHeaderId: string,
  ): Promise<DoSuggestion | null> {
    const doSuggestionId = parseDoSuggestionIdFromVoidSourceHeaderId(sourceHeaderId);
    if (!doSuggestionId) {
      return null;
    }

    const existing = await this.findById(doSuggestionId);
    if (!existing) {
      return null;
    }

    if (existing.status !== DoSuggestionStatus.VOID_NEED_ACTION) {
      return existing;
    }

    return await this.updateStatus(doSuggestionId, DoSuggestionStatus.VOID);
  }

  async findByOrganizationId(organizationId: string): Promise<DoSuggestion[]> {
    return await this.headerRepository.find({
      where: { organization_id: organizationId },
      relations: [...DO_SUGGESTION_RELATIONS],
    });
  }
}