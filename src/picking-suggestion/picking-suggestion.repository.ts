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

  async searchInventoryWithPalletHistory(
    itemId: string,
    uom?: string,
    sortMethod: 'FIFO' | 'LIFO' = 'FIFO',
  ): Promise<any[]> {
    // Determine sort direction: FIFO = ASC (oldest first), LIFO = DESC (newest first)
    const weekNumberSort = sortMethod === 'FIFO' ? 'ASC' : 'DESC';
    const dateSort = sortMethod === 'FIFO' ? 'ASC' : 'DESC';

    // Build location priority CASE statement based on sort method
    // LIFO: Priority 1 = staging INBOUND at warehouseSub level (with or without bin)
    // FIFO: Priority 1 = staging OUTBOUND (PRELOAD) at warehouseSub level (with or without bin)
    // Note: Staging areas are checked first, even if they have bins
    const locationPriorityCase = sortMethod === 'LIFO'
      ? `CASE 
          WHEN it.warehouse_sub_id IS NOT NULL AND COALESCE(ws.is_staging::text, '') = 'INBOUND' THEN 1
          WHEN it.warehouse_bin_id IS NOT NULL AND (it.warehouse_sub_id IS NULL OR COALESCE(ws.is_staging::text, '') != 'INBOUND') THEN 2
          WHEN it.warehouse_sub_id IS NOT NULL THEN 3
          ELSE 4
        END`
      : `CASE 
          WHEN it.warehouse_sub_id IS NOT NULL AND COALESCE(ws.is_staging::text, '') = 'OUTBOUND' THEN 1
          WHEN it.warehouse_bin_id IS NOT NULL AND (it.warehouse_sub_id IS NULL OR COALESCE(ws.is_staging::text, '') != 'OUTBOUND') THEN 2
          WHEN it.warehouse_sub_id IS NOT NULL THEN 3
          ELSE 4
        END`;

    // Build staging area filter condition based on sort method
    // FIFO: Include staging OUTBOUND (PRELOAD) if they have stock
    // LIFO: Include staging INBOUND if they have stock
    const stagingCondition = sortMethod === 'FIFO'
      ? `it.warehouse_sub_id IS NOT NULL AND COALESCE(ws.is_staging::text, '') = 'OUTBOUND' AND pth.new_quantity > 0`
      : `it.warehouse_sub_id IS NOT NULL AND COALESCE(ws.is_staging::text, '') = 'INBOUND' AND pth.new_quantity > 0`;

    // Build non-staging filter condition
    const nonStagingCondition = sortMethod === 'FIFO'
      ? `it.warehouse_sub_id IS NULL OR COALESCE(ws.is_staging::text, '') != 'OUTBOUND'`
      : `it.warehouse_sub_id IS NULL OR COALESCE(ws.is_staging::text, '') != 'INBOUND'`;

    // Use raw SQL to include reserved quantity calculation
    const query = `
      SELECT 
        it.id as inventory_tracking_id,
        it.pallet_id,
        p.pallet_code,
        it.warehouse_id,
        it.warehouse_sub_id,
        it.warehouse_bin_id,
        it.inventory_date,
        it.inventory_status,
        it.progression_status,
        pth.week_number,
        pth.production_date,
        pth.item_id,
        pth.new_quantity as quantity,
        pth.uom,
        pth.created_at as pallet_history_created_at,
        w.name as warehouse_name,
        w.description as warehouse_description,
        ws.name as warehouse_sub_name,
        ws.code as warehouse_sub_code,
        ws.description as warehouse_sub_description,
        ws.is_staging as warehouse_sub_staging_type,
        wb.name as bin_name,
        wb.code as bin_code,
        wb.description as bin_description,
        ROUND((pth.new_quantity::numeric / p.capacity::numeric) * 100, 2) as pallet_utilization,
        CASE 
          WHEN it.warehouse_bin_id IS NOT NULL THEN 'BIN_LEVEL'
          WHEN it.warehouse_sub_id IS NOT NULL THEN 'SUB_LEVEL'
          ELSE 'WAREHOUSE_LEVEL'
        END as search_level,
        CASE 
          WHEN it.warehouse_bin_id IS NOT NULL THEN 'BIN'
          WHEN it.warehouse_sub_id IS NOT NULL THEN 'WAREHOUSE_SUB'
          ELSE 'WAREHOUSE'
        END as location_type,
        ${locationPriorityCase} as location_priority,
        EXTRACT(EPOCH FROM (NOW() - it.inventory_date)) as age_seconds,
        -- Calculate reserved quantity from pending transaction_picking
        COALESCE((
          SELECT SUM(tp.quantity)
          FROM transaction_picking tp
          WHERE tp.item_id::text = pth.item_id::text
            AND tp.source_warehouse_sub_id::text = it.warehouse_sub_id::text
            AND (
              (tp.source_bin_id IS NULL AND it.warehouse_bin_id IS NULL) OR
              (tp.source_bin_id IS NOT NULL AND tp.source_bin_id::text = it.warehouse_bin_id::text)
            )
            AND tp.status::text = 'PENDING'
            AND tp.deleted_at IS NULL
        ), 0) as reserved_quantity,
        -- Calculate actual available quantity (total - reserved)
        pth.new_quantity - COALESCE((
          SELECT SUM(tp.quantity)
          FROM transaction_picking tp
          WHERE tp.item_id::text = pth.item_id::text
            AND tp.source_warehouse_sub_id::text = it.warehouse_sub_id::text
            AND (
              (tp.source_bin_id IS NULL AND it.warehouse_bin_id IS NULL) OR
              (tp.source_bin_id IS NOT NULL AND tp.source_bin_id::text = it.warehouse_bin_id::text)
            )
            AND tp.status::text = 'PENDING'
            AND tp.deleted_at IS NULL
        ), 0) as available_quantity
      FROM transaction_pallet_history pth
      INNER JOIN inventory_tracking it ON it.pallet_id = pth.pallet_id
      LEFT JOIN m_pallet p ON p.id = pth.pallet_id
      LEFT JOIN m_warehouse w ON w.id = it.warehouse_id
      LEFT JOIN m_warehouse_sub ws ON ws.id = it.warehouse_sub_id
      LEFT JOIN m_warehouse_bin wb ON wb.id = it.warehouse_bin_id
      WHERE pth.item_id = $1
        AND ($2::text IS NULL OR pth.uom::text = $2::text)
        AND pth.status_inventory = 'READY'
        AND it.inventory_status IN ('IN_INVENTORY', 'INSPECTION_COMPLETED', 'INSPECTION_APPROVED')
        AND it.progression_status NOT IN ('IN_PROGRESS')
        AND pth.new_quantity > 0
        AND (it.warehouse_bin_id IS NOT NULL OR it.warehouse_sub_id IS NOT NULL)
        AND pth.item_id IS NOT NULL
        AND it.pallet_id IS NOT NULL
        AND pth.pallet_id IS NOT NULL
        AND p.id IS NOT NULL
        AND pth.created_at = (
          SELECT MAX(pth2.created_at)
          FROM transaction_pallet_history pth2
          WHERE pth2.pallet_id = pth.pallet_id
            AND pth2.item_id = pth.item_id
            AND pth2.status_inventory = 'READY'
        )
        -- Only show locations with available quantity after reservations
        -- For staging areas (PRELOAD OUTBOUND for FIFO, staging INBOUND for LIFO), always show if they have stock
        AND (
          -- Staging areas: show if they have any stock (new_quantity > 0), regardless of reservations
          (${stagingCondition})
          -- Regular locations: must have available quantity after reservations
          OR (
            (${nonStagingCondition})
            AND pth.new_quantity > COALESCE((
              SELECT SUM(tp.quantity)
              FROM transaction_picking tp
              WHERE tp.item_id::text = pth.item_id::text
                AND tp.source_warehouse_sub_id::text = it.warehouse_sub_id::text
                AND (
                  (tp.source_bin_id IS NULL AND it.warehouse_bin_id IS NULL) OR
                  (tp.source_bin_id IS NOT NULL AND tp.source_bin_id::text = it.warehouse_bin_id::text)
                )
                AND tp.status::text = 'PENDING'
                AND tp.deleted_at IS NULL
            ), 0)
          )
        )
      ORDER BY 
        location_priority ASC,
        pth.week_number ${weekNumberSort},
        pth.production_date ${dateSort},
        it.inventory_date ${dateSort},
        pth.new_quantity DESC
    `;

    return await this.inventoryTrackingRepository.query(query, [itemId, uom ?? null]);
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

  async getAlreadyPickedQuantityForMemoItem(memoId: string, itemId: string): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(tp.quantity), 0) as total_picked
      FROM transaction_picking tp
      WHERE tp.memo_id::text = $1
        AND tp.item_id::text = $2
        AND tp.status IN ('PENDING')
        AND tp.deleted_at IS NULL
    `;

    const result = await this.outboundDoRepository.query(query, [memoId, itemId]);
    return parseInt(result[0]?.total_picked || '0', 10);
  }
}


