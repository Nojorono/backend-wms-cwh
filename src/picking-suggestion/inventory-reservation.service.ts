import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PalletTransactionHistory, StatusInventory } from '../core/domain/entities/transaction-pallet-history.entity';
import { PickingTransaction } from '../core/domain/entities/transaction-picking.entity';

export interface LocationReservationInfo {
  warehouse_sub_id: string;
  warehouse_bin_id?: string;
  item_id: string;
  total_available: number;
  total_reserved: number;
  actual_available: number;
  pallets: Array<{
    pallet_id: string;
    available: number;
    reserved: number;
    week_number: number;
    production_date: Date;
  }>;
}

@Injectable()
export class InventoryReservationService {
  constructor(
    @InjectRepository(PalletTransactionHistory)
    private readonly palletHistoryRepository: Repository<PalletTransactionHistory>,
    @InjectRepository(PickingTransaction)
    private readonly pickingTransactionRepository: Repository<PickingTransaction>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Validate that location has enough inventory before creating transaction picking
   * This is a query-only method - NO data changes
   */
  async validateBeforeCreate(
    warehouseSubId: string,
    warehouseBinId: string | undefined,
    itemId: string,
    requiredQuantity: number,
  ): Promise<void> {
    const locationInfo = await this.getLocationReservationInfo(
      warehouseSubId,
      warehouseBinId,
      itemId,
    );

    if (locationInfo.actual_available < requiredQuantity) {
      throw new BadRequestException(
        `Quantity tidak cukup di lokasi. Available: ${locationInfo.actual_available}, Requested: ${requiredQuantity}, Reserved: ${locationInfo.total_reserved}`,
      );
    }
  }

  /**
   * Get detailed reservation info for a location
   * Used to check if quantity is available before creating transaction-picking
   */
  async getLocationReservationInfo(
    warehouseSubId: string,
    warehouseBinId: string | undefined,
    itemId: string,
  ): Promise<LocationReservationInfo> {
    // Build query based on bin or sub level
    const query = `
      SELECT 
        pth.pallet_id,
        pth.item_id,
        pth.new_quantity as available_quantity,
        pth.week_number,
        pth.production_date,
        pth.uom,
        it.warehouse_sub_id,
        it.warehouse_bin_id
      FROM transaction_pallet_history pth
      INNER JOIN inventory_tracking it ON it.pallet_id = pth.pallet_id
      WHERE pth.item_id = $1
        AND pth.status_inventory = 'READY'
        AND it.warehouse_sub_id = $2
        ${warehouseBinId ? 'AND it.warehouse_bin_id = $3' : ''}
        AND pth.new_quantity > 0
        AND pth.created_at = (
          SELECT MAX(pth2.created_at)
          FROM transaction_pallet_history pth2
          WHERE pth2.pallet_id = pth.pallet_id
            AND pth2.item_id = pth.item_id
            AND pth2.status_inventory = 'READY'
        )
      ORDER BY pth.production_date ASC, pth.created_at ASC
    `;

    const params = warehouseBinId 
      ? [itemId, warehouseSubId, warehouseBinId]
      : [itemId, warehouseSubId];

    const palletsInLocation = await this.dataSource.query(query, params);

    let totalAvailable = 0;
    let totalReserved = 0;
    const palletDetails: any[] = [];

    for (const pallet of palletsInLocation) {
      const reserved = await this.getReservedQuantity(pallet.pallet_id, itemId);
      totalAvailable += pallet.available_quantity;
      totalReserved += reserved;

      palletDetails.push({
        pallet_id: pallet.pallet_id,
        available: pallet.available_quantity,
        reserved: reserved,
        week_number: pallet.week_number,
        production_date: pallet.production_date,
      });
    }

    return {
      warehouse_sub_id: warehouseSubId,
      warehouse_bin_id: warehouseBinId,
      item_id: itemId,
      total_available: totalAvailable,
      total_reserved: totalReserved,
      actual_available: totalAvailable - totalReserved,
      pallets: palletDetails,
    };
  }

  /**
   * Check if a location has enough available inventory (considering reservations)
   * This is called BEFORE creating transaction-picking
   */
  async validateLocationAvailability(
    warehouseSubId: string,
    warehouseBinId: string | undefined,
    itemId: string,
    requiredQuantity: number,
  ): Promise<boolean> {
    const locationInfo = await this.getLocationReservationInfo(
      warehouseSubId,
      warehouseBinId,
      itemId,
    );

    return locationInfo.actual_available >= requiredQuantity;
  }

  /**
   * Get total quantity reserved (locked) for picking from a specific pallet
   * Counts all transaction_picking records that reference this location
   */
  async getReservedQuantity(palletId: string, itemId: string): Promise<number> {
    // Remaining unpicked PENDING qty only (exclude already scanned)
    const query = `
      SELECT COALESCE(SUM(
        GREATEST(
          0::numeric,
          COALESCE(tp.quantity::numeric, 0) - COALESCE(scanned.scanned_quantity, 0)
        )
      ), 0) as total_reserved
      FROM transaction_picking tp
      LEFT JOIN (
        SELECT
          tsp.transaction_picking_id,
          COALESCE(SUM(tsp.quantity_picked::numeric), 0)::numeric AS scanned_quantity
        FROM transaction_scan_picking tsp
        WHERE tsp.deleted_at IS NULL
        GROUP BY tsp.transaction_picking_id
      ) scanned ON scanned.transaction_picking_id = tp.id
      WHERE tp.item_id = $1
        AND tp.status = 'PENDING'
        AND tp.deleted_at IS NULL
        AND EXISTS (
          SELECT 1 FROM inventory_tracking it
          WHERE it.pallet_id = $2
            AND it.warehouse_sub_id = tp.source_warehouse_sub_id
            AND (tp.source_bin_id IS NULL OR it.warehouse_bin_id = tp.source_bin_id)
        )
        AND GREATEST(
          0::numeric,
          COALESCE(tp.quantity::numeric, 0) - COALESCE(scanned.scanned_quantity, 0)
        ) > 0
    `;

    const result = await this.dataSource.query(query, [itemId, palletId]);
    return parseInt(result[0]?.total_reserved || '0', 10);
  }

  /**
   * Get total reserved quantity for an entire location (all pallets in bin/sub)
   */
  async getReservedQuantityForLocation(
    warehouseSubId: string,
    warehouseBinId: string | undefined,
    itemId: string,
  ): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(
        GREATEST(
          0::numeric,
          COALESCE(tp.quantity::numeric, 0) - COALESCE(scanned.scanned_quantity, 0)
        )
      ), 0) as total_reserved
      FROM transaction_picking tp
      LEFT JOIN (
        SELECT
          tsp.transaction_picking_id,
          COALESCE(SUM(tsp.quantity_picked::numeric), 0)::numeric AS scanned_quantity
        FROM transaction_scan_picking tsp
        WHERE tsp.deleted_at IS NULL
        GROUP BY tsp.transaction_picking_id
      ) scanned ON scanned.transaction_picking_id = tp.id
      WHERE tp.item_id = $1
        AND tp.source_warehouse_sub_id = $2
        ${warehouseBinId ? 'AND tp.source_bin_id = $3' : ''}
        AND tp.status = 'PENDING'
        AND tp.deleted_at IS NULL
        AND GREATEST(
          0::numeric,
          COALESCE(tp.quantity::numeric, 0) - COALESCE(scanned.scanned_quantity, 0)
        ) > 0
    `;

    const params = warehouseBinId 
      ? [itemId, warehouseSubId, warehouseBinId]
      : [itemId, warehouseSubId];

    const result = await this.dataSource.query(query, params);
    return parseInt(result[0]?.total_reserved || '0', 10);
  }

  /**
   * Get available quantity for a pallet considering active picking reservations
   */
  async getAvailableQuantity(palletId: string, itemId: string): Promise<number> {
    // Get latest ready quantity
    const latestHistory = await this.palletHistoryRepository.findOne({
      where: {
        pallet_id: palletId,
        item_id: itemId,
        status_inventory: StatusInventory.READY,
      },
      order: { createdAt: 'DESC' },
    });

    if (!latestHistory) {
      return 0;
    }

    // Subtract reserved quantity from transaction_picking
    const reservedQty = await this.getReservedQuantity(palletId, itemId);
    return Math.max(0, latestHistory.new_quantity - reservedQty);
  }

  /**
   * Get all pending picking transactions for a location
   * Used to show what's currently reserved/locked
   */
  async getPendingPickingsForLocation(
    warehouseSubId: string,
    warehouseBinId: string | undefined,
    itemId: string,
  ): Promise<PickingTransaction[]> {
    const queryBuilder = this.pickingTransactionRepository
      .createQueryBuilder('tp')
      .where('tp.item_id = :itemId', { itemId })
      .andWhere('tp.source_warehouse_sub_id = :warehouseSubId', { warehouseSubId })
      .andWhere('tp.status = :status', { status: 'PENDING' });

    if (warehouseBinId) {
      queryBuilder.andWhere('tp.source_bin_id = :warehouseBinId', { warehouseBinId });
    }

    return await queryBuilder
      .leftJoinAndSelect('tp.do', 'do')
      .leftJoinAndSelect('tp.memo', 'memo')
      .leftJoinAndSelect('tp.item', 'item')
      .orderBy('tp.createdAt', 'DESC')
      .getMany();
  }
}

