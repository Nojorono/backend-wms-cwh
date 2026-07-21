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
    const organizationFilter = organizationId ? 'AND w.organization_id = $3::uuid' : '';
    // Determine sort direction: FIFO = ASC (oldest first), LIFO = DESC (newest first)
    const weekNumberSort = sortMethod === 'FIFO' ? 'ASC' : 'DESC';
    const dateSort = sortMethod === 'FIFO' ? 'ASC' : 'DESC';

    // Build location priority CASE (secondary after week/date for FIFO/LIFO).
    // LIFO: Prefer staging INBOUND within the same week
    // FIFO: Prefer staging OUTBOUND within the same week
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
        -- Total READY quantity across ALL pallets in this bin (for correct net available calculation)
        COALESCE((
          SELECT SUM(pth_loc.new_quantity)
          FROM transaction_pallet_history pth_loc
          INNER JOIN inventory_tracking it_loc ON it_loc.pallet_id = pth_loc.pallet_id
          WHERE it_loc.warehouse_sub_id = it.warehouse_sub_id
            AND (
              (it_loc.warehouse_bin_id IS NULL AND it.warehouse_bin_id IS NULL) OR
              (it_loc.warehouse_bin_id IS NOT NULL AND it.warehouse_bin_id IS NOT NULL AND it_loc.warehouse_bin_id = it.warehouse_bin_id)
            )
            AND pth_loc.item_id = pth.item_id
            AND COALESCE(pth_loc.uom, '') = COALESCE(pth.uom, '')
            AND pth_loc.deleted_at IS NULL
            AND it_loc.deleted_at IS NULL
            AND pth_loc.status_inventory = 'READY'
            AND pth_loc.new_quantity > 0
            AND pth_loc.created_at = (
              SELECT MAX(pth3.created_at)
              FROM transaction_pallet_history pth3
              WHERE pth3.pallet_id = pth_loc.pallet_id
                AND pth3.item_id = pth_loc.item_id
                AND COALESCE(pth3.uom, '') = COALESCE(pth_loc.uom, '')
                AND (pth3.week_number = pth_loc.week_number OR (pth3.week_number IS NULL AND pth_loc.week_number IS NULL))
                AND pth3.deleted_at IS NULL
                AND pth3.status_inventory = 'READY'
            )
        ), 0) as location_total_quantity,
        -- Remaining reserved qty from PENDING pickings minus already scanned
        COALESCE((
          SELECT SUM(
            GREATEST(
              0::numeric,
              COALESCE(tp.quantity::numeric, 0) - COALESCE((
                SELECT SUM(tsp.quantity_picked::numeric)
                FROM transaction_scan_picking tsp
                WHERE tsp.transaction_picking_id = tp.id
                  AND tsp.deleted_at IS NULL
              ), 0)
            )
          )
          FROM transaction_picking tp
          WHERE tp.item_id::text = pth.item_id::text
            AND (
              (tp.source_warehouse_sub_id IS NULL AND it.warehouse_sub_id IS NULL) OR
              (tp.source_warehouse_sub_id IS NOT NULL AND it.warehouse_sub_id IS NOT NULL AND tp.source_warehouse_sub_id::text = it.warehouse_sub_id::text)
            )
            AND (
              (tp.source_bin_id IS NULL AND it.warehouse_bin_id IS NULL) OR
              (tp.source_bin_id IS NOT NULL AND it.warehouse_bin_id IS NOT NULL AND tp.source_bin_id::text = it.warehouse_bin_id::text)
            )
            AND tp.status::text = 'PENDING'
            AND tp.deleted_at IS NULL
        ), 0) as reserved_quantity,
        -- Calculate actual available quantity (total - remaining reserved)
        pth.new_quantity - COALESCE((
          SELECT SUM(
            GREATEST(
              0::numeric,
              COALESCE(tp.quantity::numeric, 0) - COALESCE((
                SELECT SUM(tsp.quantity_picked::numeric)
                FROM transaction_scan_picking tsp
                WHERE tsp.transaction_picking_id = tp.id
                  AND tsp.deleted_at IS NULL
              ), 0)
            )
          )
          FROM transaction_picking tp
          WHERE tp.item_id::text = pth.item_id::text
            AND (
              (tp.source_warehouse_sub_id IS NULL AND it.warehouse_sub_id IS NULL) OR
              (tp.source_warehouse_sub_id IS NOT NULL AND it.warehouse_sub_id IS NOT NULL AND tp.source_warehouse_sub_id::text = it.warehouse_sub_id::text)
            )
            AND (
              (tp.source_bin_id IS NULL AND it.warehouse_bin_id IS NULL) OR
              (tp.source_bin_id IS NOT NULL AND it.warehouse_bin_id IS NOT NULL AND tp.source_bin_id::text = it.warehouse_bin_id::text)
            )
            AND tp.status::text = 'PENDING'
            AND tp.deleted_at IS NULL
        ), 0) as available_quantity,
        -- Net available for the whole bin (location_total - reserved); use this in service to avoid partial-row miscalculation
        COALESCE((
          SELECT SUM(pth_loc2.new_quantity)
          FROM transaction_pallet_history pth_loc2
          INNER JOIN inventory_tracking it_loc2 ON it_loc2.pallet_id = pth_loc2.pallet_id
          WHERE it_loc2.warehouse_sub_id = it.warehouse_sub_id
            AND (
              (it_loc2.warehouse_bin_id IS NULL AND it.warehouse_bin_id IS NULL) OR
              (it_loc2.warehouse_bin_id IS NOT NULL AND it.warehouse_bin_id IS NOT NULL AND it_loc2.warehouse_bin_id = it.warehouse_bin_id)
            )
            AND pth_loc2.item_id = pth.item_id
            AND COALESCE(pth_loc2.uom, '') = COALESCE(pth.uom, '')
            AND pth_loc2.deleted_at IS NULL
            AND it_loc2.deleted_at IS NULL
            AND pth_loc2.status_inventory = 'READY'
            AND pth_loc2.new_quantity > 0
            AND pth_loc2.created_at = (
              SELECT MAX(pth4.created_at)
              FROM transaction_pallet_history pth4
              WHERE pth4.pallet_id = pth_loc2.pallet_id
                AND pth4.item_id = pth_loc2.item_id
                AND COALESCE(pth4.uom, '') = COALESCE(pth_loc2.uom, '')
                AND (pth4.week_number = pth_loc2.week_number OR (pth4.week_number IS NULL AND pth_loc2.week_number IS NULL))
                AND pth4.deleted_at IS NULL
                AND pth4.status_inventory = 'READY'
            )
        ), 0)
        - COALESCE((
          SELECT SUM(
            GREATEST(
              0::numeric,
              COALESCE(tp2.quantity::numeric, 0) - COALESCE((
                SELECT SUM(tsp2.quantity_picked::numeric)
                FROM transaction_scan_picking tsp2
                WHERE tsp2.transaction_picking_id = tp2.id
                  AND tsp2.deleted_at IS NULL
              ), 0)
            )
          )
          FROM transaction_picking tp2
          WHERE tp2.item_id::text = pth.item_id::text
            AND (
              (tp2.source_warehouse_sub_id IS NULL AND it.warehouse_sub_id IS NULL) OR
              (tp2.source_warehouse_sub_id IS NOT NULL AND it.warehouse_sub_id IS NOT NULL AND tp2.source_warehouse_sub_id::text = it.warehouse_sub_id::text)
            )
            AND (
              (tp2.source_bin_id IS NULL AND it.warehouse_bin_id IS NULL) OR
              (tp2.source_bin_id IS NOT NULL AND it.warehouse_bin_id IS NOT NULL AND tp2.source_bin_id::text = it.warehouse_bin_id::text)
            )
            AND tp2.status::text = 'PENDING'
            AND tp2.deleted_at IS NULL
        ), 0) as location_net_available
      FROM transaction_pallet_history pth
      INNER JOIN inventory_tracking it ON it.pallet_id = pth.pallet_id
      LEFT JOIN m_pallet p ON p.id = pth.pallet_id
      LEFT JOIN m_warehouse w ON w.id = it.warehouse_id
      LEFT JOIN m_warehouse_sub ws ON ws.id = it.warehouse_sub_id
      LEFT JOIN m_warehouse_bin wb ON wb.id = it.warehouse_bin_id
      WHERE pth.item_id = $1
        AND ($2::text IS NULL OR pth.uom::text = $2::text)
        ${organizationFilter}
        AND pth.deleted_at IS NULL
        AND it.deleted_at IS NULL
        AND pth.status_inventory = 'READY'
        AND it.inventory_status IN ('IN_INVENTORY', 'INSPECTION_COMPLETED', 'INSPECTION_APPROVED', 'PICKED')
        AND it.progression_status NOT IN ('IN_PROGRESS')
        AND pth.new_quantity > 0
        AND p.current_quantity > 0
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
            AND COALESCE(pth2.uom, '') = COALESCE(pth.uom, '')
            AND (pth2.week_number = pth.week_number OR (pth2.week_number IS NULL AND pth.week_number IS NULL))
            AND pth2.deleted_at IS NULL
            AND pth2.status_inventory = 'READY'
        )
        -- Only show locations that still have net available qty (location total - reserved > 0)
        AND (
          COALESCE((
            SELECT SUM(pth_loc.new_quantity)
            FROM transaction_pallet_history pth_loc
            INNER JOIN inventory_tracking it_loc ON it_loc.pallet_id = pth_loc.pallet_id
            WHERE it_loc.warehouse_sub_id = it.warehouse_sub_id
              AND (
                (it_loc.warehouse_bin_id IS NULL AND it.warehouse_bin_id IS NULL) OR
                (it_loc.warehouse_bin_id IS NOT NULL AND it.warehouse_bin_id IS NOT NULL AND it_loc.warehouse_bin_id = it.warehouse_bin_id)
              )
              AND pth_loc.item_id = pth.item_id
              AND COALESCE(pth_loc.uom, '') = COALESCE(pth.uom, '')
              AND pth_loc.deleted_at IS NULL
              AND it_loc.deleted_at IS NULL
              AND pth_loc.status_inventory = 'READY'
              AND pth_loc.new_quantity > 0
              AND pth_loc.created_at = (
                SELECT MAX(pth3.created_at)
                FROM transaction_pallet_history pth3
                WHERE pth3.pallet_id = pth_loc.pallet_id
                  AND pth3.item_id = pth_loc.item_id
                  AND COALESCE(pth3.uom, '') = COALESCE(pth_loc.uom, '')
                  AND (pth3.week_number = pth_loc.week_number OR (pth3.week_number IS NULL AND pth_loc.week_number IS NULL))
                  AND pth3.deleted_at IS NULL
                  AND pth3.status_inventory = 'READY'
              )
          ), 0)
          -
          COALESCE((
            SELECT SUM(
              GREATEST(
                0::numeric,
                COALESCE(tp.quantity::numeric, 0) - COALESCE((
                  SELECT SUM(tsp.quantity_picked::numeric)
                  FROM transaction_scan_picking tsp
                  WHERE tsp.transaction_picking_id = tp.id
                    AND tsp.deleted_at IS NULL
                ), 0)
              )
            )
            FROM transaction_picking tp
            WHERE tp.item_id::text = pth.item_id::text
              AND (
                (tp.source_warehouse_sub_id IS NULL AND it.warehouse_sub_id IS NULL) OR
                (tp.source_warehouse_sub_id IS NOT NULL AND it.warehouse_sub_id IS NOT NULL AND tp.source_warehouse_sub_id::text = it.warehouse_sub_id::text)
              )
              AND (
                (tp.source_bin_id IS NULL AND it.warehouse_bin_id IS NULL) OR
                (tp.source_bin_id IS NOT NULL AND it.warehouse_bin_id IS NOT NULL AND tp.source_bin_id::text = it.warehouse_bin_id::text)
              )
              AND tp.status::text = 'PENDING'
              AND tp.deleted_at IS NULL
          ), 0)
        ) > 0
      ORDER BY 
        pth.week_number ${weekNumberSort} NULLS LAST,
        pth.production_date ${dateSort} NULLS LAST,
        location_priority ASC,
        pth.new_quantity DESC
    `;



    const params = organizationId ? [itemId, uom ?? null, organizationId] : [itemId, uom ?? null];
    const result = await this.inventoryTrackingRepository.query(query, params);
    return result;
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
   * Pending transaction_picking booked qty grouped by week (aligned with visibility dashboard).
   * Uses remaining unpicked qty: PENDING quantity minus scanned quantity_picked.
   * Fully scanned bookings are excluded. Bookings without week_number are unscoped.
   */
  async getPendingBookedByWeek(
    itemId: string,
    uom: string | undefined,
    organizationId: string,
  ): Promise<{ byWeek: Array<{ week_number: number; booked_quantity: number }>; unscoped: number }> {
    const query = `
      SELECT
        tp.week_number,
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
      GROUP BY tp.week_number
    `;

    const rows = (await this.outboundDoRepository.query(query, [
      itemId,
      uom ?? null,
      organizationId,
    ])) as Array<{ week_number: number | null; booked_quantity: string | number }>;

    const byWeek: Array<{ week_number: number; booked_quantity: number }> = [];
    let unscoped = 0;

    for (const row of rows) {
      const qty = parseFloat(String(row.booked_quantity ?? 0)) || 0;
      if (row.week_number == null) {
        unscoped += qty;
      } else {
        byWeek.push({ week_number: Number(row.week_number), booked_quantity: qty });
      }
    }

    return { byWeek, unscoped };
  }
}


