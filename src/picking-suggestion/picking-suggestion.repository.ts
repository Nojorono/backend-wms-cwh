import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboundDo } from '../core/domain/entities/outbound-do.entity';
import { OutboundMemo } from '../core/domain/entities/outbound-memo.entity';
import { InventoryTracking } from '../core/domain/entities/inventory-tracking.entity';
import { MasterItem } from '../core/domain/entities/master-item.entity';

@Injectable()
export class PickingSuggestionRepository {
  constructor(
    @InjectRepository(OutboundDo)
    private readonly outboundDoRepository: Repository<OutboundDo>,
    @InjectRepository(OutboundMemo)
    private readonly outboundMemoRepository: Repository<OutboundMemo>,
    @InjectRepository(InventoryTracking)
    private readonly inventoryTrackingRepository: Repository<InventoryTracking>,
    @InjectRepository(MasterItem)
    private readonly itemRepository: Repository<MasterItem>,
  ) {}

  async getOutboundDoWithMemos(outboundDoId: string): Promise<any[]> {
    const query = `
      SELECT 
        od.id as outbound_do_id,
        od.outbound_do_number,
        od.expedition,
        od.driver_name,
        od.delivery_date,
        od.status as do_status,
        om.id as memo_id,
        om.requestor,
        om.origin,
        om.ship_to,
        om.destination,
        om.delivery_date as memo_delivery_date,
        om.status as memo_status,
        omi.id as memo_item_id,
        omi.item_id,
        omi.quantity_plan,
        omi.uom,
        mi.description as item_name,
        mi.item_number as item_code
      FROM outbound_do od
      LEFT JOIN outbound_do_memo odm ON od.id = odm.outbound_do_id
      LEFT JOIN outbound_memo om ON odm.outbound_memo_id = om.id
      LEFT JOIN outbound_memo_item omi ON om.id = omi.outbound_memo_id
      LEFT JOIN m_item mi ON omi.item_id = mi.id
      WHERE od.id = $1
      ORDER BY om.created_at, omi.created_at
    `;

    return await this.outboundDoRepository.query(query, [outboundDoId]);
  }

  async getMemoWithItems(memoId: string): Promise<any[]> {
    const query = `
      SELECT 
        om.id as memo_id,
        om.requestor,
        om.origin,
        om.ship_to,
        om.destination,
        om.delivery_date,
        om.status,
        omi.id as memo_item_id,
        omi.item_id,
        omi.quantity_plan,
        omi.uom,
        mi.description as item_name,
        mi.item_number as item_code
      FROM outbound_memo om
      LEFT JOIN outbound_memo_item omi ON om.id = omi.outbound_memo_id
      LEFT JOIN m_item mi ON omi.item_id = mi.id
      WHERE om.id = $1
      ORDER BY omi.created_at
    `;

    return await this.outboundMemoRepository.query(query, [memoId]);
  }

  async searchInventoryWithPalletHistory(itemId: string): Promise<any[]> {
    const queryBuilder = this.inventoryTrackingRepository
      .createQueryBuilder('it')
      .leftJoin('it.pallet', 'p', 'it.pallet_id = p.id')
      .leftJoin('transaction_pallet_history', 'pth', 'p.id = pth.pallet_id')
      .leftJoin('it.warehouse', 'w')
      .leftJoin('it.warehouseSub', 'ws')
      .leftJoin('it.warehouseBin', 'wb')
      .select([
        'it.id as inventory_tracking_id',
        'it.pallet_id',
        'p.pallet_code',
        'it.warehouse_id',
        'it.warehouse_sub_id',
        'it.warehouse_bin_id',
        'it.inventory_date',
        'it.inventory_status',
        'it.progression_status',
        'pth.week_number',
        'pth.production_date',
        'pth.item_id',
        'pth.new_quantity as quantity',
        'pth.uom',
        'pth.created_at as pallet_history_created_at',
        'w.name as warehouse_name',
        'w.description as warehouse_description',
        'ws.name as warehouse_sub_name',
        'ws.code as warehouse_sub_code',
        'ws.description as warehouse_sub_description',
        'wb.name as bin_name',
        'wb.code as bin_code',
        'wb.description as bin_description',
        'ROUND((pth.new_quantity::numeric / p.capacity::numeric) * 100, 2) as pallet_utilization',
        `CASE 
          WHEN it.warehouse_bin_id IS NOT NULL THEN 'BIN_LEVEL'
          WHEN it.warehouse_sub_id IS NOT NULL THEN 'SUB_LEVEL'
          ELSE 'WAREHOUSE_LEVEL'
        END as search_level`,
        `CASE 
          WHEN it.warehouse_bin_id IS NOT NULL THEN 'BIN'
          WHEN it.warehouse_sub_id IS NOT NULL THEN 'WAREHOUSE_SUB'
          ELSE 'WAREHOUSE'
        END as location_type`,
        `CASE 
          WHEN it.warehouse_bin_id IS NOT NULL THEN 1
          WHEN it.warehouse_sub_id IS NOT NULL THEN 2
          ELSE 3
        END as location_priority`,
        'EXTRACT(EPOCH FROM (NOW() - it.inventory_date)) as age_seconds',
      ])
      .where('pth.item_id = :itemId', { itemId })
      .andWhere('it.inventory_status IN (:...statuses)', {
        statuses: ['IN_INVENTORY', 'INSPECTION_COMPLETED', 'INSPECTION_APPROVED'],
      })
      .andWhere('pth.status_inventory = :statusInventory', { statusInventory: 'READY' })
      .andWhere('pth.new_quantity > 0')
      .andWhere('(it.warehouse_bin_id IS NOT NULL OR it.warehouse_sub_id IS NOT NULL)')
      .andWhere('pth.item_id IS NOT NULL')
      .andWhere('it.pallet_id IS NOT NULL')
      .andWhere('pth.pallet_id IS NOT NULL')
      .andWhere('p.id IS NOT NULL')
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('MAX(pth2.created_at)')
          .from('transaction_pallet_history', 'pth2')
          .where('pth2.item_id = pth.item_id')
          .andWhere('pth2.pallet_id = pth.pallet_id')
          .andWhere('pth2.status_inventory = :statusInventory')
          .getQuery();
        return `pth.created_at = ${subQuery}`;
      })
      .orderBy('location_priority', 'ASC')
      .addOrderBy('it.inventory_date', 'ASC')
      .addOrderBy('pth.production_date', 'ASC')
      .addOrderBy('pth.new_quantity', 'DESC');

    return await queryBuilder.getRawMany();
  }

  async debugInventorySimpleQuery(): Promise<any[]> {
    const simpleQuery = this.inventoryTrackingRepository
      .createQueryBuilder('it')
      .select([
        'it.id',
        'it.pallet_id',
        'it.warehouse_id',
        'it.warehouse_sub_id',
        'it.warehouse_bin_id',
        'it.inventory_status',
        'it.progression_status',
      ])
      .where('it.inventory_status IN (:...statuses)', {
        statuses: ['IN_INVENTORY', 'INSPECTION_COMPLETED', 'INSPECTION_APPROVED', 'STAGING'],
      })
      .orderBy('it.created_at', 'DESC')
      .limit(10);

    return await simpleQuery.getRawMany();
  }

  async debugInventoryWithJoins(): Promise<any[]> {
    const debugQuery = this.inventoryTrackingRepository
      .createQueryBuilder('it')
      .leftJoin('it.pallet', 'p', 'it.pallet_id = p.id')
      .leftJoin('it.warehouse', 'w')
      .leftJoin('it.warehouseSub', 'ws')
      .leftJoin('it.warehouseBin', 'wb')
      .select([
        'it.id',
        'it.pallet_id',
        'it.warehouse_id',
        'it.warehouse_sub_id',
        'it.warehouse_bin_id',
        'it.inventory_status',
        'it.progression_status',
        'p.pallet_code',
        'p.currentQuantity',
        'w.name as warehouse_name',
        'ws.name as warehouse_sub_name',
        'ws.is_staging',
        'wb.name as bin_name',
      ])
      .where('it.inventory_status IN (:...statuses)', {
        statuses: ['IN_INVENTORY', 'INSPECTION_COMPLETED', 'INSPECTION_APPROVED', 'STAGING'],
      })
      .andWhere('it.pallet_id IS NOT NULL')
      .orderBy('it.created_at', 'DESC')
      .limit(10);

    return await debugQuery.getRawMany();
  }

  async findItemById(itemId: string): Promise<MasterItem | null> {
    return await this.itemRepository.findOne({ where: { id: itemId } });
  }
}

