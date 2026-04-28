import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  InventoryTracking,
  ProgressionStatus,
} from '../core/domain/entities/inventory-tracking.entity';
import {
  InventoryTrackingHistory,
  InventoryTrackingAction,
} from '../core/domain/entities/inventory-tracking-history.entity';
import { MasterPallet } from '../core/domain/entities/master-pallet.entity';
import { PalletTransactionHistory } from '../core/domain/entities/transaction-pallet-history.entity';
import { CreateInventoryTrackingDto } from './dto/create-inventory-tracking.dto';
import { UpdateInventoryTrackingDto } from './dto/update-inventory-tracking.dto';

@Injectable()
export class InventoryTrackingRepository {
  constructor(
    @InjectRepository(InventoryTracking)
    private readonly repository: Repository<InventoryTracking>,
    @InjectRepository(InventoryTrackingHistory)
    private readonly historyRepository: Repository<InventoryTrackingHistory>,
    @InjectRepository(MasterPallet)
    private readonly palletRepository: Repository<MasterPallet>,
  ) { }

  async create(dto: CreateInventoryTrackingDto): Promise<InventoryTracking> {
    // Extract inbound_id from dto before creating to avoid saving to non-existent column
    const { inbound_id, ...createData } = dto;
    const entity = this.repository.create(createData);
    const saved = await this.repository.save(entity);

    // Cek apakah sudah ada history dengan pallet_id dan inbound_id yang sama
    if (inbound_id) {
      const existingHistory = await this.historyRepository.findOne({
        where: { pallet_id: saved.pallet_id, inbound_id: inbound_id },
      });

      if (!existingHistory) {
        await this.historyRepository.save(
          this.historyRepository.create({
            inventory_tracking_id: saved.id,
            pallet_id: saved.pallet_id,
            warehouse_id: saved.warehouse_id,
            warehouse_sub_id: saved.warehouse_sub_id,
            warehouse_bin_id: saved.warehouse_bin_id,
            inventory_date: saved.inventory_date,
            inventory_status: saved.inventory_status,
            inventory_note: saved.inventory_note,
            action: InventoryTrackingAction.CREATED,
            inbound_id: inbound_id,
          }),
        );
      }
    }

    return saved;
  }

  async createInventoryTrackingBad(dto: CreateInventoryTrackingDto): Promise<InventoryTracking> {
    const { ...createData } = dto;
    const inventoryTracking = await this.findOneInventoryTrackingId(createData.warehouse_id, createData.warehouse_sub_id, createData.warehouse_bin_id);
    if (!inventoryTracking) {
      const entity = this.repository.create(createData);
      const saved = await this.repository.save(entity);
      return saved;
    }
    return inventoryTracking;
  }

  async findAll(organizationId: string): Promise<InventoryTracking[]> {
    return await this.repository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.pallet', 'pallet')
      .leftJoinAndSelect('inventory.warehouse', 'warehouse')
      .leftJoinAndSelect('inventory.warehouseSub', 'warehouseSub')
      .leftJoinAndSelect('inventory.warehouseBin', 'warehouseBin')
      .where('warehouse.organization_id = :organizationId::uuid', { organizationId })
      .getMany();
  }

  async findAllPaginated(
    filters: {
      inventory_status?: string;
      warehouse_id?: string;
      warehouse_sub_id?: string;
      warehouse_bin_id?: string;
      pallet_id?: string;
      progression_status?: string;
      item_id?: string;
    },
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    organizationId?: string,
  ): Promise<{ data: InventoryTracking[]; total: number }> {
    const queryBuilder = this.repository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.warehouse', 'warehouse');

    if (organizationId) {
      queryBuilder.andWhere('warehouse.organization_id = :organizationId::uuid', { organizationId });
    }

    // Apply filters
    if (filters.inventory_status) {
      queryBuilder.andWhere('inventory.inventory_status = :inventory_status', {
        inventory_status: filters.inventory_status,
      });
    }

    if (filters.warehouse_id) {
      queryBuilder.andWhere('inventory.warehouse_id = :warehouse_id', {
        warehouse_id: filters.warehouse_id,
      });
    }

    if (filters.warehouse_sub_id) {
      queryBuilder.andWhere('inventory.warehouse_sub_id = :warehouse_sub_id', {
        warehouse_sub_id: filters.warehouse_sub_id,
      });
    }

    if (filters.warehouse_bin_id) {
      queryBuilder.andWhere('inventory.warehouse_bin_id = :warehouse_bin_id', {
        warehouse_bin_id: filters.warehouse_bin_id,
      });
    }

    if (filters.pallet_id) {
      queryBuilder.andWhere('inventory.pallet_id = :pallet_id', {
        pallet_id: filters.pallet_id,
      });
    }

    if (filters.progression_status) {
      queryBuilder.andWhere('inventory.progression_status = :progression_status', {
        progression_status: filters.progression_status,
      });
    }

    // Filter by item_id - need to join with transaction_pallet_history
    if (filters.item_id) {
      queryBuilder
        .leftJoin(
          PalletTransactionHistory,
          'pth',
          'pth.pallet_id = inventory.pallet_id AND pth.new_quantity > 0',
        )
        .andWhere('pth.item_id = :item_id', { item_id: filters.item_id });
    }

    // Apply search
    if (search) {
      queryBuilder.andWhere(
        '(inventory.inventory_note ILIKE :search OR inventory.inventory_status ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Define sortable fields mapping
    const sortableFields: Record<string, string> = {
      createdAt: 'inventory.createdAt',
      updatedAt: 'inventory.updatedAt',
      inventory_date: 'inventory.inventory_date',
      inventory_status: 'inventory.inventory_status',
      progression_status: 'inventory.progression_status',
    };

    const defaultOrderField = 'inventory.createdAt';
    const orderField = sortBy && sortableFields[sortBy] ? sortableFields[sortBy] : defaultOrderField;

    // Apply joins and pagination
    queryBuilder
      .leftJoinAndSelect('inventory.pallet', 'pallet')
      .leftJoinAndSelect('inventory.warehouseSub', 'warehouseSub')
      .leftJoinAndSelect('inventory.warehouseBin', 'warehouseBin')
      .leftJoinAndSelect('inventory.inventoryTrackingBad', 'inventoryTrackingBad')
      .orderBy(orderField, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    // Add DISTINCT if filtering by item_id to avoid duplicates
    if (filters.item_id) {
      queryBuilder.distinct(true);
    }

    const data = await queryBuilder.getMany();

    return { data, total };
  }

  async findAllByWarehouse(
    warehouse_sub_id?: string,
    warehouse_bin_id?: string,
  ): Promise<InventoryTracking[]> {
    const qb = this.repository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.pallet', 'pallet')
      .leftJoinAndSelect('inventory.warehouse', 'warehouse')
      .leftJoinAndSelect('inventory.warehouseSub', 'warehouseSub')
      .leftJoinAndSelect('inventory.warehouseBin', 'warehouseBin');

    if (warehouse_sub_id) {
      qb.andWhere('warehouseSub.id = :warehouse_sub_id', { warehouse_sub_id });
    }

    if (warehouse_bin_id) {
      qb.andWhere('warehouseBin.id = :warehouse_bin_id', { warehouse_bin_id });
    }

    return await qb.getMany();
  }

  async findOne(id: string): Promise<InventoryTracking | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['pallet', 'warehouse', 'warehouseSub', 'warehouseBin'],
    });
    return entity ?? null;
  }

  async findOneByParams(
    pallet_id: string,
    warehouse_sub_id: string,
    warehouse_id: string,
  ): Promise<InventoryTracking | null> {
    const entity = await this.repository.findOne({
      where: {
        pallet_id,
        warehouse_sub_id,
        warehouse_id,
      },
      relations: ['pallet', 'warehouse', 'warehouseSub', 'warehouseBin'],
    });
    return entity ?? null;
  }

  async findOneByPalletId(pallet_id: string): Promise<InventoryTracking | null> {
    const entity = await this.repository.findOne({
      where: { pallet_id },
      relations: ['pallet', 'warehouse', 'warehouseSub', 'warehouseBin'],
      order: { createdAt: 'DESC' },
    });
    return entity ?? null;
  }

  async findAllByPalletId(pallet_id: string, inventory_status?: string): Promise<InventoryTracking[]> {
    const whereCondition: any = { pallet_id };
    if (inventory_status) {
      whereCondition.inventory_status = inventory_status;
    }

    return await this.repository.find({
      where: whereCondition,
      relations: ['pallet', 'warehouse', 'warehouseSub', 'warehouseBin'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPalletById(pallet_id: string): Promise<MasterPallet | null> {
    const entity = await this.palletRepository.findOne({
      where: { id: pallet_id },
    });
    return entity ?? null;
  }

  async findPalletByCode(pallet_code: string): Promise<MasterPallet | null> {
    const entity = await this.palletRepository.findOne({
      where: { pallet_code },
    });
    return entity ?? null;
  }

  // find one history by pallet id
  async findHistoryByPalletId(pallet_id: string): Promise<InventoryTrackingHistory[] | null> {
    const entity = await this.historyRepository.find({
      where: { pallet_id },
      relations: ['pallet', 'warehouse', 'warehouseSub', 'warehouseBin'],
      order: { createdAt: 'DESC' },
    });
    return entity ?? null;
  }

  async update(id: string, dto: UpdateInventoryTrackingDto): Promise<InventoryTracking | null> {
    const existing = await this.findOne(id);
    if (!existing) {
      return null;
    }

    // Extract inbound_id from dto before updating to avoid updating non-existent column
    const { inbound_id, ...updateData } = dto;

    await this.repository.update(id, updateData as any);
    const updated = await this.findOne(id);

    if (updated) {
      // When inbound_id not provided (e.g. status revert), find latest history by pallet_id to avoid undefined in where
      const historyWhere: { pallet_id: string; inbound_id?: string | null } = {
        pallet_id: updated.pallet_id,
      };
      if (inbound_id !== undefined && inbound_id !== null) {
        historyWhere.inbound_id = inbound_id;
      }

      const existingHistory = await this.historyRepository.findOne({
        where: historyWhere as any,
        order: { createdAt: 'DESC' },
      });

      // Cek apakah warehouse_sub_id atau warehouse_bin_id berbeda dengan data sebelumnya
      const isLocationChanged =
        existingHistory &&
        (existingHistory.warehouse_sub_id !== updated.warehouse_sub_id ||
          existingHistory.warehouse_bin_id !== updated.warehouse_bin_id);

      const historyInboundId = inbound_id ?? existingHistory?.inbound_id ?? undefined;

      if (existingHistory && !isLocationChanged) {
        // Update existing history jika lokasi tidak berubah
        await this.historyRepository.update(existingHistory.id, {
          inventory_tracking_id: updated.id,
          pallet_id: updated.pallet_id,
          warehouse_id: updated.warehouse_id,
          warehouse_sub_id: updated.warehouse_sub_id,
          warehouse_bin_id: updated.warehouse_bin_id,
          inventory_date: updated.inventory_date,
          inventory_status: updated.inventory_status,
          inventory_note: updated.inventory_note,
          action: InventoryTrackingAction.UPDATED,
          ...(historyInboundId !== undefined && { inbound_id: historyInboundId }),
        });
      } else {
        // Buat history baru jika lokasi berubah atau belum ada history
        await this.historyRepository.save(
          this.historyRepository.create({
            inventory_tracking_id: updated.id,
            pallet_id: updated.pallet_id,
            warehouse_id: updated.warehouse_id,
            warehouse_sub_id: updated.warehouse_sub_id,
            warehouse_bin_id: updated.warehouse_bin_id,
            inventory_date: updated.inventory_date,
            inventory_status: updated.inventory_status,
            inventory_note: updated.inventory_note,
            action: isLocationChanged
              ? InventoryTrackingAction.MOVED
              : InventoryTrackingAction.CREATED,
            ...(historyInboundId !== undefined && { inbound_id: historyInboundId }),
          }),
        );
      }
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async updateProgressionStatus(
    id: string,
    progression_status: ProgressionStatus,
  ): Promise<InventoryTracking | null> {
    const existing = await this.findOne(id);
    if (!existing) {
      return null;
    }

    await this.repository.update(id, { progression_status });
    return await this.findOne(id);
  }

  /**
   * Direct update of inventory_status to IN_INVENTORY (e.g. for revert on cancel).
   * Uses QueryBuilder to ensure status is persisted without going through full update/history flow.
   */
  async updateStatusToInInventory(
    id: string,
    note: string,
  ): Promise<InventoryTracking | null> {
    const result = await this.repository
      .createQueryBuilder()
      .update(InventoryTracking)
      .set({
        inventory_status: 'IN_INVENTORY',
        inventory_note: note,
        inventory_date: () => 'CURRENT_TIMESTAMP',
      } as any)
      .where('id = :id', { id })
      .execute();

    if (!result.affected || result.affected === 0) {
      return null;
    }
    return await this.findOne(id);
  }

  // Method untuk mengecek apakah sudah ada history dengan inbound_id yang sama
  async findHistoryByInboundId(inbound_id: string): Promise<InventoryTrackingHistory | null> {
    const history = await this.historyRepository.findOne({
      where: { inbound_id },
    });
    return history ?? null;
  }

  // Method untuk mendapatkan semua history berdasarkan inbound_id
  async findAllHistoryByInboundId(inbound_id: string): Promise<InventoryTrackingHistory[]> {
    return await this.historyRepository.find({
      where: { inbound_id },
      relations: ['inventoryTracking', 'pallet', 'warehouse', 'warehouseSub', 'warehouseBin'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByItemId(item_id: string): Promise<any[]> {
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
        it.inventory_note,
        pth.week_number,
        pth.production_date,
        pth.item_id,
        pth.new_quantity as quantity,
        pth.uom,
        w.name as warehouse_name,
        ws.name as warehouse_sub_name,
        wb.name as bin_name,
        wb.code as bin_code,
        ROUND((pth.new_quantity::numeric / p.capacity::numeric) * 100, 2) as pallet_utilization
      FROM inventory_tracking it
      LEFT JOIN m_pallet p ON it.pallet_id = p.id
      LEFT JOIN transaction_pallet_history pth ON p.id = pth.pallet_id
      LEFT JOIN m_warehouse w ON it.warehouse_id = w.id
      LEFT JOIN m_warehouse_sub ws ON it.warehouse_sub_id = ws.id
      LEFT JOIN m_warehouse_bin wb ON it.warehouse_bin_id = wb.id
      WHERE pth.item_id = $1
        
        AND pth.new_quantity > 0
      ORDER BY it.inventory_date ASC, pth.production_date ASC
    `;

    const results = (await this.repository.query(query, [item_id])) as any[];
    return results;
  }

  async getVisibilityDashboard(organizationId: string, item_id?: string): Promise<any[]> {
    const itemFilter = item_id ? `AND pth.item_id::uuid = $2::uuid` : '';
    const queryParams = item_id ? [organizationId, item_id] : [organizationId];

    const query = `
      WITH latest_pallet_items AS (
        -- Get latest quantity per item per pallet (grouped by item_id, uom, week_number)
        -- Same logic as getPalletItemLatestQuantity - using subquery for MAX(created_at)
        SELECT 
          pth.id,
          pth.item_id::uuid as item_id,
          pth.pallet_id,
          pth.uom,
          pth.new_quantity::integer as new_quantity,
          pth.week_number,
          pth.production_date,
          pth.status_inventory,
          pth.created_at
        FROM transaction_pallet_history pth
        WHERE pth.deleted_at IS NULL
          AND pth.status_inventory = 'READY'
          ${itemFilter}
          AND pth.created_at = (
            SELECT MAX(pth2.created_at)
            FROM transaction_pallet_history pth2
            WHERE pth2.pallet_id = pth.pallet_id
              AND pth2.item_id = pth.item_id
              AND COALESCE(pth2.uom, '') = COALESCE(pth.uom, '')
              AND (pth2.week_number = pth.week_number OR (pth2.week_number IS NULL AND pth.week_number IS NULL))
              AND pth2.deleted_at IS NULL
          )
      ),
      item_inventory AS (
        -- Join with inventory tracking to get warehouse location info and master table names
        SELECT 
          lpi.item_id,
          lpi.pallet_id,
          lpi.uom,
          lpi.new_quantity,
          lpi.week_number,
          lpi.production_date,
          lpi.status_inventory,
          it.warehouse_id,
          it.warehouse_sub_id,
          it.warehouse_bin_id,
          it.inventory_status,
          p.pallet_code,
          w.name as warehouse_name,
          ws.name as warehouse_sub_name,
          ws.code as warehouse_sub_code,
          wb.name as warehouse_bin_name,
          wb.code as warehouse_bin_code,
          lpi.created_at as last_updated
        FROM latest_pallet_items lpi
        INNER JOIN inventory_tracking it ON it.pallet_id = lpi.pallet_id
        LEFT JOIN m_pallet p ON p.id = lpi.pallet_id
        LEFT JOIN m_warehouse w ON w.id = it.warehouse_id
        LEFT JOIN m_warehouse_sub ws ON ws.id = it.warehouse_sub_id
        LEFT JOIN m_warehouse_bin wb ON wb.id = it.warehouse_bin_id
        WHERE lpi.new_quantity > 0
          AND it.inventory_status IN ('IN_INVENTORY', 'INSPECTION_COMPLETED')
          AND it.deleted_at IS NULL
          AND w.organization_id = $1::uuid
      ),
      item_totals AS (
        -- Aggregate total quantity per item (ensure numeric sum)
        SELECT 
          item_id,
          COALESCE(uom, '') as uom,
          SUM(new_quantity::integer)::integer as total_quantity,
          COUNT(DISTINCT pallet_id)::integer as pallet_count,
          MIN(week_number) as min_week_number,
          MAX(week_number) as max_week_number,
          MIN(production_date) as earliest_production_date,
          MAX(production_date) as latest_production_date,
          json_agg(
            json_build_object(
              'pallet_id', pallet_id,
              'pallet_code', pallet_code,
              'warehouse_id', warehouse_id,
              'warehouse_name', warehouse_name,
              'warehouse_sub_id', warehouse_sub_id,
              'warehouse_sub_name', warehouse_sub_name,
              'warehouse_sub_code', warehouse_sub_code,
              'warehouse_bin_id', warehouse_bin_id,
              'warehouse_bin_name', warehouse_bin_name,
              'warehouse_bin_code', warehouse_bin_code,
              'quantity', new_quantity,
              'week_number', week_number,
              'production_date', production_date
            ) ORDER BY week_number ASC NULLS LAST, production_date ASC NULLS LAST
          ) as pallet_details
        FROM item_inventory
        GROUP BY item_id, COALESCE(uom, '')
      ),
      pending_bookings AS (
        -- Get pending bookings from transaction_picking with names/codes (ensure numeric sum)
        SELECT 
          tp.item_id::uuid as item_id,
          COALESCE(tp.uom, '') as uom,
          SUM(tp.quantity::integer)::integer as booked_quantity,
          COUNT(*)::integer as booking_count,
          json_agg(
            json_build_object(
              'transaction_id', tp.id,
              'do_id', tp.do_id,
              'do_number', od.outbound_do_number,
              'memo_id', tp.memo_id,
              'memo_number', om.outbound_memo_number,
              'quantity', tp.quantity,
              'week_number', tp.week_number,
              'source_warehouse_sub_id', tp.source_warehouse_sub_id,
              'source_warehouse_sub_name', ws_source.name,
              'source_warehouse_sub_code', ws_source.code,
              'source_bin_id', tp.source_bin_id,
              'source_bin_name', wb_source.name,
              'source_bin_code', wb_source.code
            )
          ) as booking_details
        FROM transaction_picking tp
        LEFT JOIN outbound_do od ON od.id = tp.do_id
        LEFT JOIN outbound_memo om ON om.id = tp.memo_id
        LEFT JOIN m_warehouse_sub ws_source ON ws_source.id = tp.source_warehouse_sub_id
        LEFT JOIN m_warehouse_bin wb_source ON wb_source.id = tp.source_bin_id
        WHERE tp.status = 'PENDING'
          AND tp.deleted_at IS NULL
          ${item_id ? `AND tp.item_id::uuid = $2::uuid` : ''}
        GROUP BY tp.item_id::uuid, COALESCE(tp.uom, '')
      ),
      combined_items AS (
        -- Combine item inventory and bookings to get all item-uom combinations
        SELECT DISTINCT
          COALESCE(it_totals.item_id, pb.item_id) as item_id,
          COALESCE(it_totals.uom, pb.uom) as uom
        FROM item_totals it_totals
        FULL OUTER JOIN pending_bookings pb 
          ON it_totals.item_id = pb.item_id 
          AND it_totals.uom = pb.uom
      )
      SELECT 
        it.id as item_id,
        it.sku,
        it.item_number,
        it.description as item_name,
        COALESCE(ci.uom, '') as uom,
        COALESCE(it_totals.total_quantity, 0)::integer as total_quantity,
        COALESCE(it_totals.pallet_count, 0)::integer as pallet_count,
        COALESCE(pb.booked_quantity, 0)::integer as booked_quantity,
        COALESCE(pb.booking_count, 0)::integer as booking_count,
        GREATEST(0, COALESCE(it_totals.total_quantity, 0)::integer - COALESCE(pb.booked_quantity, 0)::integer)::integer as available_quantity,
        it_totals.min_week_number,
        it_totals.max_week_number,
        it_totals.earliest_production_date,
        it_totals.latest_production_date,
        COALESCE(it_totals.pallet_details, '[]'::json) as pallet_details,
        COALESCE(pb.booking_details, '[]'::json) as booking_details,
        CASE 
          WHEN COALESCE(pb.booked_quantity, 0) > 0 THEN true
          ELSE false
        END as has_pending_booking
      FROM combined_items ci
      INNER JOIN m_item it ON it.id = ci.item_id
      LEFT JOIN item_totals it_totals 
        ON it_totals.item_id = ci.item_id 
        AND it_totals.uom = ci.uom
      LEFT JOIN pending_bookings pb 
        ON pb.item_id = ci.item_id 
        AND pb.uom = ci.uom
      ${item_id ? 'WHERE ci.item_id = $2::uuid' : ''}
      ORDER BY it.sku, ci.uom
    `;

    const results = (await this.repository.query(query, queryParams)) as any[];
    return results;
  }

  async findOneInventoryTrackingId(
    warehouse_id?: string,
    warehouse_sub_id?: string,
    warehouse_bin_id?: string,
  ): Promise<InventoryTracking | null> {
    const where: { warehouse_id?: string; warehouse_sub_id?: string; warehouse_bin_id?: string } = {};
    if (warehouse_id) where.warehouse_id = warehouse_id;
    if (warehouse_sub_id) where.warehouse_sub_id = warehouse_sub_id;
    if (warehouse_bin_id) where.warehouse_bin_id = warehouse_bin_id;

    if (Object.keys(where).length === 0) {
      return null;
    }
    return this.repository.findOne({ where });
  }
}
