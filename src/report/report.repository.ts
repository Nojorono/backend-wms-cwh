import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inbound } from '../core/domain/entities/inbound.entity';
import { MasterItem } from '../core/domain/entities/master-item.entity';
import { OutboundDo, OutboundDoStatus } from '../core/domain/entities/outbound-do.entity';
import { AssignedGateLoad } from '../core/domain/entities/assigned-gate-load.entity';
import { Status as TransactionPickingStatus } from '../core/domain/entities/transaction-picking.entity';
import { OutboundDoPaginationDto } from '../outbound-do/dto/outbound-do-pagination.dto';

export type InboundReportPaginatedFilters = {
  status?: string;
  expedition?: string;
  origin?: string;
  inbound_type?: string;
  driver_name?: string;
  license_plate?: string;
  start_date?: string;
  end_date?: string;
};

@Injectable()
export class ReportRepository {
  constructor(
    @InjectRepository(Inbound)
    private readonly inboundOrm: Repository<Inbound>,
    @InjectRepository(OutboundDo)
    private readonly outboundDoOrm: Repository<OutboundDo>,
  ) { }

  async findAllInbounds(status?: string): Promise<Inbound[]> {
    const qb = this.inboundOrm.createQueryBuilder('inbound');
    if (status) {
      qb.andWhere('inbound.status = :status', { status });
    }
    return qb
      .leftJoinAndSelect('inbound.inbound_dos', 'inbound_dos')
      .leftJoinAndSelect('inbound_dos.inbound_items', 'inbound_items')
      .leftJoinAndMapOne(
        'inbound_items.item',
        MasterItem,
        'item',
        'item.id::uuid = inbound_items.item_id',
      )
      .leftJoinAndSelect('inbound.assigned_helpers', 'assigned_helpers')
      .getMany();
  }

  async findInboundsPaginated(
    filters: InboundReportPaginatedFilters,
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<{ data: Inbound[]; total: number }> {
    const queryBuilder = this.inboundOrm.createQueryBuilder('inbound');

    if (filters.status) {
      queryBuilder.andWhere('inbound.status = :status', { status: filters.status });
    }

    if (filters.start_date) {
      queryBuilder.andWhere('DATE(inbound.createdAt) >= :startDate', {
        startDate: filters.start_date,
      });
    }

    if (filters.end_date) {
      queryBuilder.andWhere('DATE(inbound.createdAt) <= :endDate', {
        endDate: filters.end_date,
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(inbound.inbound_number ILIKE :search OR inbound.expedition ILIKE :search OR inbound.origin ILIKE :search OR inbound.license_plate ILIKE :search OR inbound.driver_name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const total = await queryBuilder.getCount();

    const data = await queryBuilder
      .leftJoinAndSelect('inbound.inbound_dos', 'inbound_dos')
      .leftJoinAndSelect('inbound_dos.inbound_items', 'inbound_items')
      .leftJoinAndMapOne(
        'inbound_items.item',
        MasterItem,
        'item',
        'item.id::uuid = inbound_items.item_id',
      )
      .leftJoinAndSelect('inbound.assigned_helpers', 'assigned_helpers')
      .leftJoinAndSelect('inbound.transaction_scan_inbounds', 'transaction_scan_inbounds')
      .leftJoinAndSelect('transaction_scan_inbounds.item', 'transaction_scan_inbounds_item')
      .leftJoinAndSelect('transaction_scan_inbounds.pallet', 'transaction_scan_inbounds_pallet')
      .orderBy(`inbound.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total };
  }

  async findInboundNumbersByIds(ids: string[]): Promise<Map<string, string>> {
    if (!ids.length) {
      return new Map();
    }
    const distinctIds = [...new Set(ids)];
    const rows = await this.inboundOrm
      .createQueryBuilder('inbound')
      .select('inbound.id', 'id')
      .addSelect('inbound.inbound_number', 'inbound_number')
      .where('inbound.id IN (:...ids)', { ids: distinctIds })
      .getRawMany<{ id: string; inbound_number: string | null }>();
    const map = new Map<string, string>();
    for (const row of rows) {
      if (row.inbound_number != null) {
        map.set(row.id, row.inbound_number);
      }
    }
    return map;
  }

  private buildOutboundDoQueryWithAllRelations() {
    return this.outboundDoOrm
      .createQueryBuilder('outbound_do')
      .leftJoinAndSelect('outbound_do.outbound_memos', 'outbound_memos')
      .leftJoinAndSelect('outbound_memos.outbound_memo_items', 'outbound_memo_items')
      .leftJoinAndSelect('outbound_memo_items.item', 'memo_item')
      .leftJoinAndSelect(
        AssignedGateLoad,
        'assigned_gate_load',
        'assigned_gate_load.outbound_memo_id = outbound_memo_items.outbound_memo_id AND assigned_gate_load.item_id = outbound_memo_items.item_id',
      )
      .leftJoinAndSelect('assigned_gate_load.item', 'assigned_gate_load_item')
      .leftJoinAndSelect('assigned_gate_load.pallet', 'assigned_gate_load_pallet')
      .leftJoinAndSelect('assigned_gate_load.assigned_gate', 'assigned_gate')
      .leftJoinAndSelect(
        'outbound_memos.transaction_pickings',
        'transaction_pickings',
        'transaction_pickings.status != :reportTpCancelledStatus',
        { reportTpCancelledStatus: TransactionPickingStatus.CANCELLED },
      )
      .leftJoinAndSelect('transaction_pickings.item', 'picking_item')
      .leftJoinAndSelect('transaction_pickings.sourceWarehouseSub', 'source_warehouse_sub')
      .leftJoinAndSelect('transaction_pickings.sourceBin', 'source_bin')
      .leftJoinAndSelect('transaction_pickings.destinationWarehouseSub', 'destination_warehouse_sub')
      .leftJoinAndSelect('transaction_pickings.destinationBin', 'destination_bin')
      .leftJoinAndSelect('transaction_pickings.transactionScanPicking', 'transaction_scan_picking')
      .leftJoinAndSelect('transaction_scan_picking.item', 'scan_item')
      .leftJoinAndSelect('transaction_scan_picking.palletSource', 'pallet_source')
      .leftJoinAndSelect('transaction_scan_picking.palletUse', 'pallet_use')
      .leftJoinAndSelect('transaction_scan_picking.palletSwitch', 'pallet_switch')
      .leftJoinAndSelect('outbound_memos.assigned_pickings', 'assigned_pickings');
  }

  private addSequenceToMemos(outboundDo: OutboundDo): OutboundDo {
    if (outboundDo.outbound_memos && outboundDo.memo_id && outboundDo.memo_sequence) {
      const memosWithSequence = outboundDo.outbound_memos.map((memo) => {
        const memoIndex = outboundDo.memo_id!.indexOf(memo.id);
        const sequence = outboundDo.memo_sequence![memoIndex] || memoIndex + 1;

        return {
          ...memo,
          sequence,
        } as { sequence: number } & typeof memo;
      });

      outboundDo.outbound_memos = memosWithSequence.sort((a, b) => a.sequence - b.sequence) as OutboundDo['outbound_memos'];
    }
    return outboundDo;
  }

  private async nestAssignedGateLoad(outboundDo: OutboundDo): Promise<OutboundDo> {
    if (!outboundDo.outbound_memos) {
      return outboundDo;
    }

    const memoIds = new Set<string>();
    const itemKeys = new Set<string>();

    outboundDo.outbound_memos.forEach((memo) => {
      memoIds.add(memo.id);
      if (memo.outbound_memo_items) {
        memo.outbound_memo_items.forEach((item) => {
          const key = `${memo.id}_${item.item_id}`;
          itemKeys.add(key);
        });
      }
    });

    if (memoIds.size === 0 || itemKeys.size === 0) {
      return outboundDo;
    }

    const assignedGateLoads = await this.outboundDoOrm.manager
      .getRepository(AssignedGateLoad)
      .createQueryBuilder('assigned_gate_load')
      .leftJoinAndSelect('assigned_gate_load.item', 'item')
      .leftJoinAndSelect('assigned_gate_load.pallet', 'pallet')
      .leftJoinAndSelect('assigned_gate_load.assigned_gate', 'assigned_gate')
      .where('assigned_gate_load.outbound_memo_id IN (:...memoIds)', {
        memoIds: Array.from(memoIds),
      })
      .getMany();

    const assignedGateLoadMap = new Map<string, AssignedGateLoad[]>();
    assignedGateLoads.forEach((load) => {
      const key = `${load.outbound_memo_id}_${load.item_id}`;
      if (itemKeys.has(key)) {
        if (!assignedGateLoadMap.has(key)) {
          assignedGateLoadMap.set(key, []);
        }
        assignedGateLoadMap.get(key)!.push(load);
      }
    });

    outboundDo.outbound_memos.forEach((memo) => {
      if (memo.outbound_memo_items) {
        memo.outbound_memo_items = memo.outbound_memo_items.map((item) => {
          const key = `${memo.id}_${item.item_id}`;
          const loads = assignedGateLoadMap.get(key) || [];
          return {
            ...item,
            assigned_gate_load: loads.length > 0 ? loads : null,
          } as (typeof item) & { assigned_gate_load: AssignedGateLoad[] | null };
        });
      }
    });

    return outboundDo;
  }

  async findAllOutboundDos(): Promise<OutboundDo[]> {
    const outboundDos = await this.buildOutboundDoQueryWithAllRelations()
      .orderBy('outbound_do.createdAt', 'DESC')
      .distinct(true)
      .getMany();

    return Promise.all(
      outboundDos.map(async (outboundDo) => {
        const processed = this.addSequenceToMemos(outboundDo);
        return this.nestAssignedGateLoad(processed);
      }),
    );
  }

  async findOutboundDosPaginated(
    paginationDto: OutboundDoPaginationDto,
  ): Promise<{ data: OutboundDo[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      sortOrder = 'DESC',
      outbound_type,
      start_date,
      end_date,
    } = paginationDto;

    const qb = this.buildOutboundDoQueryWithAllRelations();
    qb.andWhere('outbound_do.status = :status', { status: OutboundDoStatus.APPROVED_LOAD });
    // if (status) {
    //   qb.andWhere('outbound_do.status = :status', { status });
    // }

    if (outbound_type) {
      qb.andWhere('outbound_do.outbound_type = :outbound_type', { outbound_type });
    }

    if (start_date) {
      qb.andWhere('DATE(outbound_do.createdAt) >= :startDate', { startDate: start_date });
    }

    if (end_date) {
      qb.andWhere('DATE(outbound_do.createdAt) <= :endDate', { endDate: end_date });
    }

    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(outbound_do.outbound_do_number) LIKE :search OR LOWER(outbound_do.driver_name) LIKE :search OR LOWER(outbound_do.driver_phone) LIKE :search)',
        { search: searchTerm },
      );
    }

    const sortableFields: Record<string, string> = {
      createdAt: 'outbound_do.createdAt',
      updatedAt: 'outbound_do.updatedAt',
      delivery_date: 'outbound_do.delivery_date',
      outbound_do_number: 'outbound_do.outbound_do_number',
      status: 'outbound_do.status',
      outbound_type: 'outbound_do.outbound_type',
      driver_name: 'outbound_do.driver_name',
    };

    const orderField =
      sortBy && sortableFields[sortBy] ? sortableFields[sortBy] : 'outbound_do.createdAt';
    const orderDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    qb.orderBy(orderField, orderDirection);

    const [entities, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const data = await Promise.all(
      entities.map(async (outboundDo) => {
        const processed = this.addSequenceToMemos(outboundDo);
        return this.nestAssignedGateLoad(processed);
      }),
    );

    return { data, total };
  }
}
