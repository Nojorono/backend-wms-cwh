import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboundDo } from '../core/domain/entities/outbound-do.entity';
import { OutboundMemo } from '../core/domain/entities/outbound-memo.entity';
import { OutboundMemoItem } from '../core/domain/entities/outbound-memo-item.entity';
import { InventoryTracking } from '../core/domain/entities/inventory-tracking.entity';
import { MasterItem } from '../core/domain/entities/master-item.entity';
import { MasterWarehouseBin } from '../core/domain/entities/master-warehouse-bin.entity';
import { MasterWarehouseSub } from '../core/domain/entities/master-warehouse-sub.entity';
import { MasterWarehouse } from '../core/domain/entities/master-warehouse.entity';

@Injectable()
export class PickingSuggestionService {
  constructor(
    @InjectRepository(OutboundDo)
    private readonly outboundDoRepository: Repository<OutboundDo>,
    @InjectRepository(OutboundMemo)
    private readonly outboundMemoRepository: Repository<OutboundMemo>,
    @InjectRepository(OutboundMemoItem)
    private readonly outboundMemoItemRepository: Repository<OutboundMemoItem>,
    @InjectRepository(InventoryTracking)
    private readonly inventoryTrackingRepository: Repository<InventoryTracking>,
    @InjectRepository(MasterItem)
    private readonly itemRepository: Repository<MasterItem>,
    @InjectRepository(MasterWarehouseBin)
    private readonly warehouseBinRepository: Repository<MasterWarehouseBin>,
    @InjectRepository(MasterWarehouseSub)
    private readonly warehouseSubRepository: Repository<MasterWarehouseSub>,
    @InjectRepository(MasterWarehouse)
    private readonly warehouseRepository: Repository<MasterWarehouse>,
  ) {}

  async getPickingSuggestionsForOutboundDo(outboundDoId: string): Promise<any> {
    // Get outbound DO with memos and items
    const outboundDo = await this.getOutboundDoWithDetails(outboundDoId);
    if (!outboundDo) {
      throw new Error('Outbound DO not found');
    }

    const suggestions: any = {
      outboundDo: outboundDo,
      pickingSuggestions: [],
      routeOptimization: null,
      priorityItems: [],
      estimatedPickingTime: 0,
    };

    // Generate picking suggestions for each memo
    for (const memo of outboundDo.outbound_memos) {
      const memoSuggestions = await this.generatePickingSuggestionsForMemo(memo);
      suggestions.pickingSuggestions.push(...(memoSuggestions as any[]));
    }

    // Generate route optimization
    suggestions.routeOptimization = await this.generateRouteOptimization(suggestions.pickingSuggestions);

    // Generate priority items
    suggestions.priorityItems = await this.generatePriorityItems(suggestions.pickingSuggestions);

    // Calculate estimated picking time
    suggestions.estimatedPickingTime = this.calculateEstimatedPickingTime(suggestions.pickingSuggestions);

    return suggestions.pickingSuggestions;
  }

  private async getOutboundDoWithDetails(outboundDoId: string): Promise<any> {
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

    const results = await this.outboundDoRepository.query(query, [outboundDoId]) as any[];
    
    if (results.length === 0) return null;

    // Group results by memo
    const groupedResults = this.groupResultsByMemo(results);
    return groupedResults as any;
  }

  private groupResultsByMemo(results: any[]): any {
    const outboundDo: any = {
      id: results[0].outbound_do_id,
      outbound_do_number: results[0].outbound_do_number,
      expedition: results[0].expedition,
      driver_name: results[0].driver_name,
      delivery_date: results[0].delivery_date,
      status: results[0].do_status,
      outbound_memos: []
    };

    const memoMap = new Map();

    for (const result of results) {
      if (!result.memo_id) continue;

      if (!memoMap.has(result.memo_id)) {
        memoMap.set(result.memo_id, {
          id: result.memo_id,
          requestor: result.requestor,
          origin: result.origin,
          ship_to: result.ship_to,
          destination: result.destination,
          delivery_date: result.memo_delivery_date,
          status: result.memo_status,
          items: []
        });
      }

      if (result.memo_item_id) {
        memoMap.get(result.memo_id).items.push({
          id: result.memo_item_id,
          item_id: result.item_id,
          item_name: result.item_name,
          item_code: result.item_code,
          quantity_plan: result.quantity_plan,
          uom: result.uom
        });
      }
    }

    outboundDo.outbound_memos = Array.from(memoMap.values()) as any[];
    return outboundDo;
  }

  private async generatePickingSuggestionsForMemo(memo: any): Promise<any[]> {
    const suggestions: any[] = [];

    for (const item of memo.items) {
      // Find available inventory for this item
      const availableInventory = await this.findAvailableInventoryForItem(item.item_id, item.quantity_plan);
      
      if (availableInventory.length > 0) {
        const suggestion = {
          memo_id: memo.id,
          item_id: item.item_id,
          item_name: item.item_name,
          item_code: item.item_code,
          required_quantity: item.quantity_plan,
          available_quantity: availableInventory.reduce((sum, inv) => sum + inv.quantity, 0),
          suggested_bins: this.formatSuggestedBins(availableInventory),
          total_suggested_quantity: this.calculateTotalSuggestedQuantity(availableInventory, item.quantity_plan),
          status: this.determineFulfillmentStatus(availableInventory, item.quantity_plan),
          notes: this.generateNotes(item, memo, availableInventory),
        };
        suggestions.push(suggestion as any);
      }
    }

    return suggestions;
  }

  private async findAvailableInventoryForItem(itemId: string, requiredQuantity: number): Promise<any[]> {
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
        AND it.inventory_status = 'IN_INVENTORY'
        AND pth.new_quantity > 0
      ORDER BY it.inventory_date ASC, pth.production_date ASC
    `;

    const results = await this.inventoryTrackingRepository.query(query, [itemId]) as any[];
    
    // Filter and sort by availability and accessibility
    return results
      .filter(inv => inv.quantity >= requiredQuantity || inv.pallet_utilization < 100)
      .sort((a, b) => {
        // Prioritize by FIFO (oldest first)
        const dateA = new Date(a.inventory_date);
        const dateB = new Date(b.inventory_date);
        return dateA.getTime() - dateB.getTime();
      });
  }

  private optimizePickingLocations(inventory: any[]): any[] {
    // Group by warehouse and bin for efficient picking
    const locationGroups = new Map();

    for (const inv of inventory) {
      const key = `${inv.warehouse_id}-${inv.warehouse_sub_id}-${inv.warehouse_bin_id}`;
      
      if (!locationGroups.has(key)) {
        locationGroups.set(key, {
          warehouse_id: inv.warehouse_id,
          warehouse_sub_id: inv.warehouse_sub_id,
          warehouse_bin_id: inv.warehouse_bin_id,
          warehouse_name: inv.warehouse_name,
          warehouse_sub_name: inv.warehouse_sub_name,
          bin_name: inv.bin_name,
          bin_code: inv.bin_code,
          items: [],
          total_quantity: 0,
          estimated_picking_time: 0
        });
      }

      const group = locationGroups.get(key);
      group.items.push(inv);
      group.total_quantity += inv.quantity;
      group.estimated_picking_time += 2; // 2 minutes per pallet
    }

    // Sort by efficiency (most items in same location first)
    return Array.from(locationGroups.values())
      .sort((a, b) => b.items.length - a.items.length);
  }

  private calculateItemPriority(item: any, memo: any): number {
    let priority = 3; // Default priority

    // Higher priority for urgent delivery dates
    const deliveryDate = new Date(memo.delivery_date);
    const today = new Date();
    const daysUntilDelivery = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDelivery <= 1) priority = 1; // Very high priority
    else if (daysUntilDelivery <= 3) priority = 2; // High priority

    // Higher priority for larger quantities
    if (item.quantity_plan > 100) priority = Math.max(1, priority - 1);

    return priority;
  }

  private calculateItemPickingTime(inventory: any[]): number {
    // Base time: 2 minutes per pallet + 1 minute per location change
    const baseTime = inventory.length * 2;
    const locationChanges = new Set(inventory.map(inv => `${inv.warehouse_bin_id}`)).size - 1;
    return baseTime + locationChanges;
  }

  private analyzeWeekOptimization(inventory: any[]): any {
    const weekGroups = new Map();
    
    for (const inv of inventory) {
      const week = inv.week_number;
      if (!weekGroups.has(week)) {
        weekGroups.set(week, []);
      }
      weekGroups.get(week).push(inv);
    }

    const weekAnalysis = Array.from(weekGroups.entries()).map(([week, items]) => ({
      week_number: week,
      item_count: items.length,
      total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
      oldest_production_date: Math.min(...items.map(item => new Date(item.production_date).getTime())),
      suggested_picking_order: items.sort((a, b) => new Date(a.production_date).getTime() - new Date(b.production_date).getTime())
    }));

    return {
      week_groups: weekAnalysis,
      optimization_suggestion: weekAnalysis.length > 1 ? 
        'Consider grouping by week for efficient FIFO picking' : 
        'All items from same week - optimal for FIFO'
    };
  }

  private async generateRouteOptimization(pickingSuggestions: any[]): Promise<any> {
    // Group by warehouse and sub for route optimization
    const routeGroups = new Map();

    for (const suggestion of pickingSuggestions) {
      for (const location of suggestion.suggested_picking_locations) {
        const key = `${location.warehouse_id}-${location.warehouse_sub_id}`;
        
        if (!routeGroups.has(key)) {
          routeGroups.set(key, {
            warehouse_id: location.warehouse_id,
            warehouse_sub_id: location.warehouse_sub_id,
            warehouse_name: location.warehouse_name,
            warehouse_sub_name: location.warehouse_sub_name,
            bins: [],
            total_estimated_time: 0
          });
        }

        const group = routeGroups.get(key);
        group.bins.push(location);
        group.total_estimated_time += location.estimated_picking_time;
      }
    }

    // Sort by efficiency and create optimal route
    const optimalRoute = Array.from(routeGroups.values())
      .sort((a, b) => b.total_estimated_time - a.total_estimated_time);

    return {
      optimal_route: optimalRoute,
      total_estimated_time: optimalRoute.reduce((sum, route) => sum + route.total_estimated_time, 0),
      route_efficiency_score: this.calculateRouteEfficiency(optimalRoute)
    };
  }

  private async generatePriorityItems(pickingSuggestions: any[]): Promise<any[]> {
    return pickingSuggestions
      .sort((a, b) => a.priority - b.priority)
      .map(suggestion => ({
        item_name: suggestion.item_name,
        item_code: suggestion.item_code,
        priority: suggestion.priority,
        required_quantity: suggestion.required_quantity,
        estimated_picking_time: suggestion.estimated_picking_time,
        week_optimization: suggestion.week_optimization
      }));
  }

  private calculateEstimatedPickingTime(pickingSuggestions: any[]): number {
    return pickingSuggestions.reduce((total, suggestion) => 
      total + suggestion.estimated_picking_time, 0);
  }

  private calculateRouteEfficiency(route: any[]): number {
    // Calculate efficiency based on warehouse proximity and bin accessibility
    let efficiency = 100;
    
    for (let i = 1; i < route.length; i++) {
      // Penalize for warehouse changes
      if (route[i].warehouse_id !== route[i-1].warehouse_id) {
        efficiency -= 20;
      }
      // Penalize for sub-warehouse changes
      else if (route[i].warehouse_sub_id !== route[i-1].warehouse_sub_id) {
        efficiency -= 10;
      }
    }

    return Math.max(0, efficiency);
  }

  async getPickingSuggestionsByMemo(memoId: string): Promise<any> {
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

    const results = await this.outboundMemoRepository.query(query, [memoId]) as any[];
    
    if (results.length === 0) return null;

    const memo = {
      id: results[0].memo_id,
      requestor: results[0].requestor,
      origin: results[0].origin,
      ship_to: results[0].ship_to,
      destination: results[0].destination,
      delivery_date: results[0].delivery_date,
      status: results[0].status,
      items: results.filter(r => r.memo_item_id).map(r => ({
        id: r.memo_item_id,
        item_id: r.item_id,
        item_name: r.item_name,
        item_code: r.item_code,
        quantity_plan: r.quantity_plan,
        uom: r.uom
      }))
    };

    return await this.generatePickingSuggestionsForMemo(memo);
  }

  private formatSuggestedBins(availableInventory: any[]): any[] {
    const binMap = new Map();
    
    for (const inv of availableInventory) {
      const key = `${inv.warehouse_bin_id}`;
      
      if (!binMap.has(key)) {
        binMap.set(key, {
          bin_id: inv.warehouse_bin_id,
          bin_code: inv.bin_code || inv.bin_name,
          quantity_to_pick: 0,
          warehouse_name: inv.warehouse_name,
          warehouse_sub_name: inv.warehouse_sub_name,
          bin_name: inv.bin_name,
          week_number: inv.week_number,
          production_date: inv.production_date,
          pallet_id: inv.pallet_id,
          pallet_code: inv.pallet_code,
          pallet_utilization: inv.pallet_utilization
        });
      }
      
      const bin = binMap.get(key);
      bin.quantity_to_pick += inv.quantity;
    }
    
    return Array.from(binMap.values()).sort((a, b) => {
      // Sort by week number (FIFO) and then by quantity
      if (a.week_number !== b.week_number) {
        return a.week_number - b.week_number;
      }
      return b.quantity_to_pick - a.quantity_to_pick;
    });
  }

  private calculateTotalSuggestedQuantity(availableInventory: any[], requiredQuantity: number): number {
    const totalAvailable = availableInventory.reduce((sum, inv) => sum + inv.quantity, 0);
    return Math.min(totalAvailable, requiredQuantity);
  }

  private determineFulfillmentStatus(availableInventory: any[], requiredQuantity: number): string {
    const totalAvailable = availableInventory.reduce((sum, inv) => sum + inv.quantity, 0);
    
    if (totalAvailable >= requiredQuantity) {
      return 'FULFILLED';
    } else if (totalAvailable > 0) {
      return 'PARTIAL';
    } else {
      return 'UNFULFILLED';
    }
  }

  private generateNotes(item: any, memo: any, availableInventory: any[]): string {
    const totalAvailable = availableInventory.reduce((sum, inv) => sum + inv.quantity, 0);
    const requiredQuantity = item.quantity_plan;
    
    if (totalAvailable >= requiredQuantity) {
      return `Item tersedia dengan jumlah yang cukup. Total tersedia: ${totalAvailable} ${item.uom}`;
    } else if (totalAvailable > 0) {
      return `Item tersedia sebagian. Tersedia: ${totalAvailable} ${item.uom}, Dibutuhkan: ${requiredQuantity} ${item.uom}`;
    } else {
      return `Item tidak tersedia di inventory. Dibutuhkan: ${requiredQuantity} ${item.uom}`;
    }
  }
}
