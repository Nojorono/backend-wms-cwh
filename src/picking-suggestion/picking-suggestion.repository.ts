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
  ) { }

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
    organizationId?: string,
  ): Promise<any[]> {
    // Determine sort direction: FIFO = ASC (oldest first), LIFO = DESC (newest first)
    const weekNumberSort = sortMethod === 'FIFO' ? 'ASC' : 'DESC';
    const dateSort = sortMethod === 'FIFO' ? 'ASC' : 'DESC';

    // Secondary location priority within the same week/batch.
    // LIFO: Prefer staging INBOUND; FIFO: Prefer staging OUTBOUND.
    const locationPriorityCase = sortMethod === 'LIFO'
      ? `CASE
          WHEN lit.warehouse_sub_id IS NOT NULL AND COALESCE(ws.is_staging::text, '') = 'INBOUND' THEN 1
          WHEN lit.warehouse_bin_id IS NOT NULL AND (lit.warehouse_sub_id IS NULL OR COALESCE(ws.is_staging::text, '') != 'INBOUND') THEN 2
          WHEN lit.warehouse_sub_id IS NOT NULL THEN 3
          ELSE 4
        END`
      : `CASE
          WHEN lit.warehouse_sub_id IS NOT NULL AND COALESCE(ws.is_staging::text, '') = 'OUTBOUND' THEN 1
          WHEN lit.warehouse_bin_id IS NOT NULL AND (lit.warehouse_sub_id IS NULL OR COALESCE(ws.is_staging::text, '') != 'OUTBOUND') THEN 2
          WHEN lit.warehouse_sub_id IS NOT NULL THEN 3
          ELSE 4
        END`;

    // Mirror getVisibilityDashboard stock source exactly:
    // - latest READY/PENDING history per (pallet, item, uom, week)
    // - one inventory_tracking row per pallet (DISTINCT ON)
    // - inventory_status IN ('IN_INVENTORY', 'INSPECTION_COMPLETED')
    // Booking reservations are applied later in the service (by week), not here —
    // location-level reserved filters were wrongly dropping whole locations (e.g. PRELOAD).
    const organizationFilter = organizationId
      ? 'AND w.organization_id = $3::uuid'
      : '';

    const query = `
      WITH latest_pallet_items AS (
        SELECT DISTINCT ON (
          pth.pallet_id,
          pth.item_id,
          COALESCE(pth.uom, ''),
          COALESCE(pth.week_number, -2147483648)
        )
          pth.id,
          pth.item_id,
          pth.pallet_id,
          pth.uom,
          pth.new_quantity::numeric AS new_quantity,
          pth.week_number,
          pth.production_date,
          pth.status_inventory,
          pth.created_at
        FROM transaction_pallet_history pth
        WHERE pth.deleted_at IS NULL
          AND pth.status_inventory = 'READY'
          AND pth.new_quantity > 0
          AND pth.item_id::text = $1::text
          AND ($2::text IS NULL OR COALESCE(pth.uom, '') = $2::text)
        ORDER BY
          pth.pallet_id,
          pth.item_id,
          COALESCE(pth.uom, ''),
          COALESCE(pth.week_number, -2147483648),
          pth.created_at DESC,
          pth.id DESC
      ),
      latest_inventory_tracking AS (
        SELECT DISTINCT ON (it.pallet_id)
          it.id,
          it.pallet_id,
          it.warehouse_id,
          it.warehouse_sub_id,
          it.warehouse_bin_id,
          it.inventory_status,
          it.progression_status,
          it.inventory_date
        FROM inventory_tracking it
        INNER JOIN m_warehouse w ON w.id = it.warehouse_id
        WHERE it.deleted_at IS NULL
          AND it.pallet_id IS NOT NULL
          AND it.inventory_status IN ('IN_INVENTORY', 'INSPECTION_COMPLETED')
          ${organizationId ? 'AND w.organization_id = $3::uuid' : ''}
        ORDER BY it.pallet_id, it.created_at DESC, it.id DESC
      )
      SELECT
        lit.id AS inventory_tracking_id,
        lit.pallet_id,
        p.pallet_code,
        lit.warehouse_id,
        lit.warehouse_sub_id,
        lit.warehouse_bin_id,
        lit.inventory_date,
        lit.inventory_status,
        lit.progression_status,
        lpi.week_number,
        lpi.production_date,
        lpi.item_id,
        lpi.new_quantity AS quantity,
        lpi.uom,
        lpi.created_at AS pallet_history_created_at,
        w.name AS warehouse_name,
        w.description AS warehouse_description,
        ws.name AS warehouse_sub_name,
        ws.code AS warehouse_sub_code,
        ws.description AS warehouse_sub_description,
        ws.is_staging AS warehouse_sub_staging_type,
        wb.name AS bin_name,
        wb.code AS bin_code,
        wb.description AS bin_description,
        CASE
          WHEN p.capacity IS NOT NULL AND p.capacity > 0
            THEN ROUND((lpi.new_quantity::numeric / p.capacity::numeric) * 100, 2)
          ELSE NULL
        END AS pallet_utilization,
        CASE
          WHEN lit.warehouse_bin_id IS NOT NULL THEN 'BIN_LEVEL'
          WHEN lit.warehouse_sub_id IS NOT NULL THEN 'SUB_LEVEL'
          ELSE 'WAREHOUSE_LEVEL'
        END AS search_level,
        CASE
          WHEN lit.warehouse_bin_id IS NOT NULL THEN 'BIN'
          WHEN lit.warehouse_sub_id IS NOT NULL THEN 'WAREHOUSE_SUB'
          ELSE 'WAREHOUSE'
        END AS location_type,
        ${locationPriorityCase} AS location_priority,
        EXTRACT(EPOCH FROM (NOW() - lit.inventory_date)) AS age_seconds,
        lpi.new_quantity AS location_total_quantity,
        0::numeric AS reserved_quantity,
        lpi.new_quantity AS available_quantity,
        lpi.new_quantity AS location_net_available
      FROM latest_pallet_items lpi
      INNER JOIN latest_inventory_tracking lit ON lit.pallet_id = lpi.pallet_id
      LEFT JOIN m_pallet p ON p.id = lpi.pallet_id
      LEFT JOIN m_warehouse w ON w.id = lit.warehouse_id
      LEFT JOIN m_warehouse_sub ws ON ws.id = lit.warehouse_sub_id
      LEFT JOIN m_warehouse_bin wb ON wb.id = lit.warehouse_bin_id
      WHERE (lit.warehouse_bin_id IS NOT NULL OR lit.warehouse_sub_id IS NOT NULL)
        ${organizationFilter}
      ORDER BY
        lpi.week_number ${weekNumberSort} NULLS LAST,
        lpi.production_date ${dateSort} NULLS LAST,
        location_priority ASC,
        lpi.new_quantity DESC
    `;

    const params = organizationId
      ? [itemId, uom ?? null, organizationId]
      : [itemId, uom ?? null];
    return await this.inventoryTrackingRepository.query(query, params);
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
        statuses: ['IN_INVENTORY', 'INSPECTION_COMPLETED', 'INSPECTION_APPROVED', 'STAGING', 'PICKED'],
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
        statuses: ['IN_INVENTORY', 'INSPECTION_COMPLETED', 'INSPECTION_APPROVED', 'STAGING', 'PICKED'],
      })
      .andWhere('it.pallet_id IS NOT NULL')
      .orderBy('it.created_at', 'DESC')
      .limit(10);

    return await debugQuery.getRawMany();
  }

  async findItemById(itemId: string): Promise<MasterItem | null> {
    return await this.itemRepository.findOne({ where: { id: itemId } });
  }

  async getAlreadyPickedQuantityForMemoItem(itemId: string, memoId?: string): Promise<number> {
    const memoFilter = memoId ? `AND tp.memo_id::text = $2` : '';
    const params: string[] = memoId ? [itemId, memoId] : [itemId];

    const query = `
      SELECT COALESCE(SUM(tp.quantity), 0) as total_picked
      FROM transaction_picking tp
      WHERE
        tp.item_id::text = $1
        ${memoFilter}
        AND tp.status IN ('PENDING', 'COMPLETED')
        AND tp.deleted_at IS NULL
    `;

    const result = await this.outboundDoRepository.query(query, params);
    return parseInt(result[0]?.total_picked || '0', 10);
  }

  /**
   * Pending transaction_picking booked qty with source location (aligned with visibility).
   * Uses remaining unpicked qty: PENDING quantity minus scanned quantity_picked.
   * Bookings without week_number are unscoped.
   */
  async getPendingBookedByWeek(
    itemId: string,
    uom: string | undefined,
    organizationId: string,
  ): Promise<{
    byWeek: Array<{
      week_number: number;
      booked_quantity: number;
      source_warehouse_sub_id?: string | null;
      source_bin_id?: string | null;
    }>;
    unscoped: number;
  }> {
    const query = `
      SELECT
        tp.week_number,
        tp.source_warehouse_sub_id,
        tp.source_bin_id,
        COALESCE(SUM(
          GREATEST(
            0::numeric,
            COALESCE(tp.quantity::numeric, 0)
              - COALESCE(scanned.scanned_quantity, 0)
          )
        ), 0)::numeric AS booked_quantity
      FROM transaction_picking tp
      INNER JOIN outbound_do od ON od.id = tp.do_id
      LEFT JOIN (
        SELECT
          tsp.transaction_picking_id,
          COALESCE(SUM(tsp.quantity_picked::numeric), 0)::numeric AS scanned_quantity
        FROM transaction_scan_picking tsp
        WHERE tsp.deleted_at IS NULL
        GROUP BY tsp.transaction_picking_id
      ) scanned ON scanned.transaction_picking_id = tp.id
      WHERE tp.item_id::text = $1
        AND tp.status::text = 'PENDING'
        AND tp.deleted_at IS NULL
        AND od.organization_id = $3::uuid
        AND ($2::text IS NULL OR COALESCE(tp.uom, '') = $2::text)
        AND GREATEST(
          0::numeric,
          COALESCE(tp.quantity::numeric, 0) - COALESCE(scanned.scanned_quantity, 0)
        ) > 0
      GROUP BY tp.week_number, tp.source_warehouse_sub_id, tp.source_bin_id
    `;

    const rows = (await this.outboundDoRepository.query(query, [
      itemId,
      uom ?? null,
      organizationId,
    ])) as Array<{
      week_number: number | null;
      booked_quantity: string | number;
      source_warehouse_sub_id?: string | null;
      source_bin_id?: string | null;
    }>;

    const byWeek: Array<{
      week_number: number;
      booked_quantity: number;
      source_warehouse_sub_id?: string | null;
      source_bin_id?: string | null;
    }> = [];
    let unscoped = 0;

    for (const row of rows) {
      const qty = parseFloat(String(row.booked_quantity ?? 0)) || 0;
      if (row.week_number == null) {
        unscoped += qty;
      } else {
        byWeek.push({
          week_number: Number(row.week_number),
          booked_quantity: qty,
          source_warehouse_sub_id: row.source_warehouse_sub_id ?? null,
          source_bin_id: row.source_bin_id ?? null,
        });
      }
    }

    return { byWeek, unscoped };
  }
}


