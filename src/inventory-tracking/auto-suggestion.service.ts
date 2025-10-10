import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryTracking } from '../core/domain/entities/inventory-tracking.entity';
import { MasterPallet } from '../core/domain/entities/master-pallet.entity';
import { MasterItem } from '../core/domain/entities/master-item.entity';
import { MasterWarehouse } from '../core/domain/entities/master-warehouse.entity';
import { MasterWarehouseSub } from '../core/domain/entities/master-warehouse-sub.entity';
import { MasterWarehouseBin } from '../core/domain/entities/master-warehouse-bin.entity';

@Injectable()
export class InventoryAutoSuggestionService {
  constructor(
    @InjectRepository(InventoryTracking)
    private readonly inventoryTrackingRepository: Repository<InventoryTracking>,
    @InjectRepository(MasterPallet)
    private readonly palletRepository: Repository<MasterPallet>,
    @InjectRepository(MasterItem)
    private readonly itemRepository: Repository<MasterItem>,
    @InjectRepository(MasterWarehouse)
    private readonly warehouseRepository: Repository<MasterWarehouse>,
    @InjectRepository(MasterWarehouseSub)
    private readonly warehouseSubRepository: Repository<MasterWarehouseSub>,
    @InjectRepository(MasterWarehouseBin)
    private readonly warehouseBinRepository: Repository<MasterWarehouseBin>,
  ) {}

  // Auto suggestion untuk IN operations
  async getInSuggestions(palletId: string): Promise<any[]> {
    const suggestions: any[] = [];

    // 1. Suggestion berdasarkan week production code
    const weekSuggestion = await this.getWeekProductionInSuggestion(palletId);
    if (weekSuggestion) {
      suggestions.push(weekSuggestion as any);
    }

    // 2. Suggestion berdasarkan kapasitas warehouse
    const capacitySuggestion = await this.getCapacityInSuggestion(palletId);
    if (capacitySuggestion) {
      suggestions.push(capacitySuggestion as any);
    }

    // 3. Suggestion berdasarkan lokasi optimal
    const locationSuggestion = await this.getOptimalLocationInSuggestion(palletId);
    if (locationSuggestion) {
      suggestions.push(locationSuggestion as any);
    }

    return suggestions;
  }

  // Auto suggestion untuk OUT operations
  async getOutSuggestions(itemId: string): Promise<any[]> {
    const suggestions: any[] = [];

    // 1. Suggestion berdasarkan FIFO (First In First Out)
    const fifoSuggestion = await this.getFifoOutSuggestion(itemId);
    if (fifoSuggestion) {
      suggestions.push(fifoSuggestion as any);
    }

    // 2. Suggestion berdasarkan week production code
    const weekOutSuggestion = await this.getWeekProductionOutSuggestion(itemId);
    if (weekOutSuggestion) {
      suggestions.push(weekOutSuggestion as any);
    }

    // 3. Suggestion berdasarkan priority
    const prioritySuggestion = await this.getPriorityOutSuggestion(itemId);
    if (prioritySuggestion) {
      suggestions.push(prioritySuggestion as any);
    }

    return suggestions;
  }

  private async getWeekProductionInSuggestion(palletId: string): Promise<any> {
    // Query untuk mendapatkan week production code dari pallet
    const query = `
      SELECT 
        pth.week_number,
        pth.item_id,
        pth.production_date,
        COUNT(DISTINCT it.id) as existing_inventory_count
      FROM transaction_pallet_history pth
      LEFT JOIN inventory_tracking it ON pth.pallet_id = it.pallet_id
      WHERE pth.pallet_id = $1
        AND pth.week_number IS NOT NULL
      GROUP BY pth.week_number, pth.item_id, pth.production_date
    `;

    const results = await this.inventoryTrackingRepository.query(query, [palletId]) as any[];
    
    if (results.length === 0) return null;

    const weekNumber = results[0].week_number;
    const existingCount = results[0].existing_inventory_count;

    // Cari lokasi optimal untuk week production ini
    const optimalLocation = await this.findOptimalLocationForWeek(weekNumber);

    return {
      type: 'WEEK_PRODUCTION_IN',
      title: `Week ${weekNumber} Production Optimization`,
      description: `Place pallet in optimal location for week ${weekNumber} production`,
      reasoning: `Items from week ${weekNumber} should be grouped together for better FIFO management`,
      suggested_warehouse_id: optimalLocation?.warehouse_id,
      suggested_warehouse_sub_id: optimalLocation?.warehouse_sub_id,
      suggested_warehouse_bin_id: optimalLocation?.warehouse_bin_id,
      priority: this.calculateWeekPriority(weekNumber),
      confidence_score: 85,
      estimated_savings: existingCount * 2,
    };
  }

  private async getCapacityInSuggestion(palletId: string): Promise<any> {
    // Query untuk menganalisis kapasitas warehouse
    const query = `
      SELECT 
        wb.id as warehouse_bin_id,
        wb.capacity,
        COUNT(it.id) as current_inventory,
        wb.capacity - COUNT(it.id) as available_space,
        w.id as warehouse_id,
        ws.id as warehouse_sub_id,
        w.warehouse_name,
        ws.warehouse_sub_name,
        wb.bin_name
      FROM m_warehouse_bin wb
      LEFT JOIN m_warehouse_sub ws ON wb.warehouse_sub_id = ws.id
      LEFT JOIN m_warehouse w ON ws.warehouse_id = w.id
      LEFT JOIN inventory_tracking it ON wb.id = it.warehouse_bin_id 
        AND it.inventory_status = 'IN_INVENTORY'
      GROUP BY wb.id, wb.capacity, w.id, ws.id, w.warehouse_name, ws.warehouse_sub_name, wb.bin_name
      HAVING wb.capacity - COUNT(it.id) > 0
      ORDER BY available_space DESC
      LIMIT 5
    `;

    const results = await this.inventoryTrackingRepository.query(query) as any[];
    
    if (results.length === 0) return null;

    const bestLocation = results[0];

    return {
      type: 'CAPACITY_OPTIMIZATION_IN',
      title: `Optimal Capacity Location`,
      description: `Place pallet in location with best available capacity`,
      reasoning: `Location has ${bestLocation.available_space} available space, optimal for new inventory`,
      suggested_warehouse_id: bestLocation.warehouse_id,
      suggested_warehouse_sub_id: bestLocation.warehouse_sub_id,
      suggested_warehouse_bin_id: bestLocation.warehouse_bin_id,
      priority: 3,
      confidence_score: 90,
      estimated_savings: 5,
    };
  }

  private async getOptimalLocationInSuggestion(palletId: string): Promise<any> {
    // Query untuk mencari lokasi optimal berdasarkan aksesibilitas
    const query = `
      SELECT 
        wb.id as warehouse_bin_id,
        w.id as warehouse_id,
        ws.id as warehouse_sub_id,
        w.warehouse_name,
        ws.warehouse_sub_name,
        wb.bin_name,
        COUNT(it.id) as current_inventory,
        wb.capacity,
        ROUND((COUNT(it.id)::float / wb.capacity::float) * 100, 2) as utilization_percentage
      FROM m_warehouse_bin wb
      LEFT JOIN m_warehouse_sub ws ON wb.warehouse_sub_id = ws.id
      LEFT JOIN m_warehouse w ON ws.warehouse_id = w.id
      LEFT JOIN inventory_tracking it ON wb.id = it.warehouse_bin_id 
        AND it.inventory_status = 'IN_INVENTORY'
      GROUP BY wb.id, w.id, ws.id, w.warehouse_name, ws.warehouse_sub_name, wb.bin_name, wb.capacity
      HAVING (COUNT(it.id)::float / wb.capacity::float) < 0.8
      ORDER BY utilization_percentage ASC
      LIMIT 3
    `;

    const results = await this.inventoryTrackingRepository.query(query) as any[];
    
    if (results.length === 0) return null;

    const optimalLocation = results[0];

    return {
      type: 'LOCATION_OPTIMIZATION_IN',
      title: `Optimal Accessibility Location`,
      description: `Place pallet in easily accessible location`,
      reasoning: `Location has ${optimalLocation.utilization_percentage}% utilization, good for frequent access`,
      suggested_warehouse_id: optimalLocation.warehouse_id,
      suggested_warehouse_sub_id: optimalLocation.warehouse_sub_id,
      suggested_warehouse_bin_id: optimalLocation.warehouse_bin_id,
      priority: 2,
      confidence_score: 80,
      estimated_savings: 10,
    };
  }

  private async getFifoOutSuggestion(itemId: string): Promise<any> {
    // Query untuk mendapatkan inventory berdasarkan FIFO untuk item tertentu
    const query = `
      SELECT 
        it.id,
        it.pallet_id,
        it.inventory_date,
        it.warehouse_id,
        it.warehouse_sub_id,
        it.warehouse_bin_id,
        p.pallet_code,
        pth.week_number,
        pth.production_date,
        pth.item_id
      FROM inventory_tracking it
      LEFT JOIN m_pallet p ON it.pallet_id = p.id
      LEFT JOIN transaction_pallet_history pth ON p.id = pth.pallet_id
      WHERE pth.item_id = $1
        AND it.inventory_status = 'IN_INVENTORY'
      ORDER BY it.inventory_date ASC, pth.production_date ASC
      LIMIT 1
    `;

    const results = await this.inventoryTrackingRepository.query(query, [itemId]) as any[];
    
    if (results.length === 0) return null;

    const oldestInventory = results[0];

    return {
      type: 'FIFO_OUT',
      title: `FIFO Priority for Outbound`,
      description: `This pallet should be prioritized for outbound due to FIFO principle`,
      reasoning: `Pallet has oldest inventory date (${oldestInventory.inventory_date}) and production date (${oldestInventory.production_date})`,
      pallet_id: oldestInventory.pallet_id,
      item_id: oldestInventory.item_id,
      priority: 1,
      confidence_score: 95,
      estimated_savings: 15,
    };
  }

  private async getWeekProductionOutSuggestion(itemId: string): Promise<any> {
    // Query untuk mendapatkan week production dan inventory terkait untuk item tertentu
    const query = `
      SELECT 
        pth.week_number,
        COUNT(DISTINCT it.id) as total_inventory_count,
        COUNT(DISTINCT CASE WHEN it.inventory_status = 'IN_INVENTORY' THEN it.id END) as available_count,
        MIN(it.inventory_date) as oldest_inventory_date
      FROM transaction_pallet_history pth
      LEFT JOIN inventory_tracking it ON pth.pallet_id = it.pallet_id
      WHERE pth.item_id = $1
        AND pth.week_number IS NOT NULL
      GROUP BY pth.week_number
      ORDER BY pth.week_number ASC
    `;

    const results = await this.inventoryTrackingRepository.query(query, [itemId]) as any[];
    
    if (results.length === 0) return null;

    const weekData = results[0];

    return {
      type: 'WEEK_PRODUCTION_OUT',
      title: `Week ${weekData.week_number} Production Outbound Priority`,
      description: `Prioritize outbound for week ${weekData.week_number} production`,
      reasoning: `Week ${weekData.week_number} has ${weekData.available_count} available items, oldest from ${weekData.oldest_inventory_date}`,
      item_id: itemId,
      week_number: weekData.week_number,
      priority: this.calculateWeekOutPriority(weekData.week_number),
      confidence_score: 85,
      estimated_savings: weekData.available_count * 3,
    };
  }

  private async getPriorityOutSuggestion(itemId: string): Promise<any> {
    // Query untuk mendapatkan priority berdasarkan item dan demand
    const query = `
      SELECT 
        pth.item_id,
        pth.week_number,
        COUNT(DISTINCT it.id) as inventory_count,
        AVG(EXTRACT(EPOCH FROM (NOW() - it.inventory_date))/86400) as days_in_inventory
      FROM transaction_pallet_history pth
      LEFT JOIN inventory_tracking it ON pth.pallet_id = it.pallet_id
      WHERE pth.item_id = $1
        AND it.inventory_status = 'IN_INVENTORY'
      GROUP BY pth.item_id, pth.week_number
    `;

    const results = await this.inventoryTrackingRepository.query(query, [itemId]) as any[];
    
    if (results.length === 0) return null;

    const itemData = results[0];
    const daysInInventory = Math.floor(itemData.days_in_inventory);

    return {
      type: 'PRIORITY_OUT',
      title: `High Priority Outbound`,
      description: `This item should be prioritized for outbound due to long storage time`,
      reasoning: `Item has been in inventory for ${daysInInventory} days, exceeding optimal storage time`,
      item_id: itemData.item_id,
      week_number: itemData.week_number,
      days_in_inventory: daysInInventory,
      priority: daysInInventory > 30 ? 1 : daysInInventory > 14 ? 2 : 3,
      confidence_score: Math.min(95, 70 + daysInInventory),
      estimated_savings: daysInInventory * 2,
    };
  }

  private async findOptimalLocationForWeek(weekNumber: number): Promise<any> {
    // Query untuk mencari lokasi optimal berdasarkan week production
    const query = `
      WITH week_inventory AS (
        SELECT 
          it.warehouse_id,
          it.warehouse_sub_id,
          it.warehouse_bin_id,
          COUNT(*) as week_inventory_count
        FROM inventory_tracking it
        LEFT JOIN m_pallet p ON it.pallet_id = p.id
        LEFT JOIN transaction_pallet_history pth ON p.id = pth.pallet_id
        WHERE pth.week_number = $1
          AND it.inventory_status = 'IN_INVENTORY'
        GROUP BY it.warehouse_id, it.warehouse_sub_id, it.warehouse_bin_id
      )
      SELECT 
        wi.warehouse_id,
        wi.warehouse_sub_id,
        wi.warehouse_bin_id,
        wi.week_inventory_count,
        w.warehouse_name,
        ws.warehouse_sub_name,
        wb.bin_name
      FROM week_inventory wi
      LEFT JOIN m_warehouse w ON wi.warehouse_id = w.id
      LEFT JOIN m_warehouse_sub ws ON wi.warehouse_sub_id = ws.id
      LEFT JOIN m_warehouse_bin wb ON wi.warehouse_bin_id = wb.id
      ORDER BY wi.week_inventory_count DESC
      LIMIT 1
    `;

    const results = await this.inventoryTrackingRepository.query(query, [weekNumber]);
    return results[0] || null;
  }

  private calculateWeekPriority(weekNumber: number): number {
    const currentWeek = this.getCurrentWeek();
    const weekDifference = Math.abs(currentWeek - weekNumber);
    return Math.max(1, 5 - weekDifference);
  }

  private calculateWeekOutPriority(weekNumber: number): number {
    const currentWeek = this.getCurrentWeek();
    const weekDifference = currentWeek - weekNumber;
    
    // Higher priority for older weeks
    if (weekDifference > 4) return 1; // Very high priority
    if (weekDifference > 2) return 2; // High priority
    return 3; // Normal priority
  }

  private getCurrentWeek(): number {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + start.getDay() + 1) / 7);
  }
}
