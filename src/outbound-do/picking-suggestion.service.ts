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
    // Validate outboundDoId before proceeding
    if (!outboundDoId || outboundDoId.trim() === '') {
      throw new Error('Outbound DO ID is required');
    }

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
    // Validate outboundDoId before proceeding
    if (!outboundDoId || outboundDoId.trim() === '') {
      console.warn('getOutboundDoWithDetails: outboundDoId is empty or null');
      return null;
    }

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

    try {
    const results = await this.outboundDoRepository.query(query, [outboundDoId]) as any[];
    
    if (results.length === 0) return null;

    // Group results by memo
    const groupedResults = this.groupResultsByMemo(results);
    return groupedResults as any;
    } catch (error) {
      console.error('Error in getOutboundDoWithDetails:', error);
      console.error('Query parameters:', { outboundDoId });
      return null;
    }
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

    // Calculate priority for each item and sort by priority
    const itemsWithPriority = memo.items.map(item => ({
      ...item,
      priority: this.calculateItemPriority(item, memo)
    })).sort((a, b) => a.priority - b.priority); // Lower number = higher priority

    for (const item of itemsWithPriority) {
      // Validate item before processing
      if (!item.item_id || item.item_id.trim() === '') {
        console.warn('generatePickingSuggestionsForMemo: item_id is empty or null for item:', item);
        continue;
      }

      // Find available inventory for this item
      const availableInventory = await this.findAvailableInventoryForItem(item.item_id, item.quantity_plan);
      
      if (availableInventory.length > 0) {
        const suggestion = {
          memo_id: memo.id,
          item_id: item.item_id,
          item_name: item.item_name,
          item_code: item.item_code,
          required_quantity: item.quantity_plan,
          suggested_locations: this.getAllAvailableInventory(availableInventory, item.quantity_plan),
          total_suggested_quantity: this.calculateTotalSuggestedQuantity(availableInventory, item.quantity_plan),
          status: this.determineFulfillmentStatus(availableInventory, item.quantity_plan),
          priority: item.priority,
          notes: this.generateNotes(item, memo, availableInventory),
        };
        suggestions.push(suggestion as any);
      } else {
        // Include items with no available inventory
        const suggestion = {
          memo_id: memo.id,
          item_id: item.item_id,
          item_name: item.item_name,
          item_code: item.item_code,
          required_quantity: item.quantity_plan,
          available_quantity: 0,
          suggested_locations: [],
          total_suggested_quantity: 0,
          status: 'UNFULFILLED',
          priority: item.priority,
          notes: `Item tidak tersedia di inventory. Dibutuhkan: ${item.quantity_plan} ${item.uom}`,
        };
        suggestions.push(suggestion as any);
      }
    }

    // Sort suggestions by priority and fulfillment status
    return this.sortSuggestionsByPriority(suggestions);
  }

  private async findAvailableInventoryForItem(itemId: string, requiredQuantity: number): Promise<any[]> {
    // Validate itemId before proceeding
    if (!itemId || itemId.trim() === '') {
      console.warn('findAvailableInventoryForItem: itemId is empty or null');
      return [];
    }

    // Validate UUID format
    if (!this.isValidUUID(itemId)) {
      console.warn('findAvailableInventoryForItem: itemId is not a valid UUID:', itemId);
      return [];
    }

    try {
            // Try multiple search strategies in order of preference
            const searchStrategies = [
              () => this.searchInventoryWithPalletHistory(itemId),
            ];

      let results: any[] = [];

      for (const strategy of searchStrategies) {
        try {
          const strategyResults = await strategy();
          if (strategyResults.length > 0) {
            results = strategyResults;
            break;
          }
        } catch (error) {
          console.warn('Search strategy failed:', error);
          continue;
        }
      }

      // Debug if no results found
      if (results.length === 0) {
        await this.debugInventorySearch(itemId);
      }

      // Filter and sort results
      return this.filterAndSortInventory(results, requiredQuantity);
    } catch (error) {
      console.error('Error in findAvailableInventoryForItem:', error);
      console.error('Query parameters:', { itemId, requiredQuantity });
      return [];
    }
  }

  private async searchInventoryWithPalletHistory(itemId: string): Promise<any[]> {
    try {
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
        'EXTRACT(EPOCH FROM (NOW() - it.inventory_date)) as age_seconds'
      ])
      .where('pth.item_id = :itemId', { itemId })
      .andWhere('it.inventory_status IN (:...statuses)', { 
        statuses: ['IN_INVENTORY', 'INSPECTION_COMPLETED', 'INSPECTION_APPROVED'] 
      })
      .andWhere('pth.new_quantity > 0')
      .andWhere('(it.warehouse_bin_id IS NOT NULL OR it.warehouse_sub_id IS NOT NULL)')
      .andWhere('pth.item_id IS NOT NULL')
      .andWhere('it.pallet_id IS NOT NULL')
      .andWhere('pth.pallet_id IS NOT NULL')
      .andWhere('p.id IS NOT NULL')
      .andWhere(qb => {
        const subQuery = qb.subQuery()
          .select('MAX(pth2.created_at)')
          .from('transaction_pallet_history', 'pth2')
          .where('pth2.item_id = pth.item_id')
          .andWhere('pth2.pallet_id = pth.pallet_id')
          .getQuery();
        return `pth.created_at = ${subQuery}`;
      })
      .orderBy('location_priority', 'ASC')
      .addOrderBy('it.inventory_date', 'ASC')
      .addOrderBy('pth.production_date', 'ASC')
      .addOrderBy('pth.new_quantity', 'DESC');

      const results = await queryBuilder.getRawMany();
      
      return results;
    } catch (error) {
      console.warn('searchInventoryWithPalletHistory failed:', error.message);
      return [];
    }
  }

  private async debugInventorySearch(itemId: string): Promise<void> {
    try {
      console.log(`Still no results found for item ${itemId}, showing all inventory tracking records for debugging...`);
      
      // Try simple query first without complex joins
      const simpleQuery = this.inventoryTrackingRepository
        .createQueryBuilder('it')
        .select([
          'it.id',
          'it.pallet_id',
          'it.warehouse_id',
          'it.warehouse_sub_id',
          'it.warehouse_bin_id',
          'it.inventory_status',
          'it.progression_status'
        ])
        .where('it.inventory_status IN (:...statuses)', { 
          statuses: ['IN_INVENTORY', 'INSPECTION_COMPLETED', 'INSPECTION_APPROVED', 'STAGING'] 
        })
        .orderBy('it.created_at', 'DESC')
        .limit(10);

      const simpleResults = await simpleQuery.getRawMany();
      console.log(`Debug - Found ${simpleResults.length} simple inventory tracking records:`, simpleResults);
      
      // Try with pallet join if simple query works
      if (simpleResults.length > 0) {
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
          'wb.name as bin_name'
        ])
        .where('it.inventory_status IN (:...statuses)', { 
          statuses: ['IN_INVENTORY', 'INSPECTION_COMPLETED', 'INSPECTION_APPROVED', 'STAGING'] 
        })
        .andWhere('it.pallet_id IS NOT NULL')
        .orderBy('it.created_at', 'DESC')
        .limit(10);

        const debugResults = await debugQuery.getRawMany();
        console.log(`Debug - Found ${debugResults.length} detailed inventory tracking records:`, debugResults);
      }
    } catch (error) {
      console.warn('debugInventorySearch failed:', error.message);
    }
  }

  private isValidUUID(uuid: string): boolean {
    if (!uuid || typeof uuid !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  private filterAndSortInventory(inventory: any[], requiredQuantity: number): any[] {
    return inventory
      .filter(inv => {
        // Filter based on quantity and utilization
        const hasEnoughQuantity = inv.quantity >= requiredQuantity;
        const hasPartialQuantity = inv.quantity > 0 && inv.pallet_utilization < 100;
        return hasEnoughQuantity || hasPartialQuantity;
      })
      .sort((a, b) => {
        // Primary sort: Location priority (bin > sub > warehouse)
        if (a.location_priority !== b.location_priority) {
          return a.location_priority - b.location_priority;
        }
        
        // Secondary sort: FIFO (oldest first)
        const dateA = new Date(a.inventory_date);
        const dateB = new Date(b.inventory_date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        
        // Tertiary sort: Production date
        if (a.production_date !== b.production_date) {
          return new Date(a.production_date).getTime() - new Date(b.production_date).getTime();
        }
        
        // Final sort: Quantity (higher first for same date)
        return b.quantity - a.quantity;
      });
  }

  private calculateItemPriority(item: any, memo: any): number {
    let priority = 5; // Default priority (lower number = higher priority)

    // Priority 1: Critical items (urgent delivery + high quantity)
    const deliveryDate = new Date(memo.delivery_date);
    const today = new Date();
    const daysUntilDelivery = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Very high priority for urgent delivery dates
    if (daysUntilDelivery <= 1) {
      priority = 1; // Critical priority
    } else if (daysUntilDelivery <= 3) {
      priority = 2; // High priority
    } else if (daysUntilDelivery <= 7) {
      priority = 3; // Medium priority
    }

    // Adjust priority based on quantity (higher quantity = higher priority)
    if (item.quantity_plan > 500) {
      priority = Math.max(1, priority - 2); // Boost priority significantly
    } else if (item.quantity_plan > 100) {
      priority = Math.max(1, priority - 1); // Boost priority moderately
    }

    // Priority boost for specific item types or codes
    if (item.item_code && item.item_code.includes('URGENT')) {
      priority = Math.max(1, priority - 1);
    }

    // Priority boost for items with special requirements
    if (item.uom === 'DUS' && item.quantity_plan > 1000) {
      priority = Math.max(1, priority - 1);
    }

    return priority;
  }

  private sortSuggestionsByPriority(suggestions: any[]): any[] {
    return suggestions.sort((a, b) => {
      // First sort by priority (lower number = higher priority)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      
      // Then sort by fulfillment status (FULFILLED first, then OVERFULFILLED, then PARTIAL, then UNFULFILLED)
      const statusOrder = { 'FULFILLED': 1, 'OVERFULFILLED': 2, 'PARTIAL': 3, 'UNFULFILLED': 4 };
      const aStatusOrder = statusOrder[a.status] || 5;
      const bStatusOrder = statusOrder[b.status] || 5;
      
      if (aStatusOrder !== bStatusOrder) {
        return aStatusOrder - bStatusOrder;
      }
      
      // Finally sort by available quantity (higher quantity first)
      return b.available_quantity - a.available_quantity;
    });
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
    // Validate memoId before proceeding
    if (!memoId || memoId.trim() === '') {
      console.warn('getPickingSuggestionsByMemo: memoId is empty or null');
      return null;
    }

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

    try {
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
    } catch (error) {
      console.error('Error in getPickingSuggestionsByMemo:', error);
      console.error('Query parameters:', { memoId });
      return null;
    }
  }

  private getLocationPlace(inv: any): string {
    // Intelligent place determination based on location hierarchy
    if (inv.warehouse_bin_id && inv.bin_name) {
      return `${inv.warehouse_sub_name} - ${inv.bin_name}`;
    } else if (inv.warehouse_sub_id && inv.warehouse_sub_name) {
      return inv.warehouse_sub_name;
    } else {
      return inv.warehouse_name;
    }
  }

  private getAllAvailableInventory(availableInventory: any[], requiredQuantity: number): any[] {
    // Return all available inventory that can contribute to fulfilling the required quantity
    const allSuggestions: any[] = [];
    let remainingQuantity = requiredQuantity;
    
    // Sort inventory by priority: exact match > location priority > FIFO > age > quantity
    const sortedInventory = [...availableInventory].sort((a, b) => {
      // 1. Exact match priority
      const aExactMatch = a.quantity === requiredQuantity ? 1 : 0;
      const bExactMatch = b.quantity === requiredQuantity ? 1 : 0;
      if (aExactMatch !== bExactMatch) {
        return bExactMatch - aExactMatch;
      }
      
      // 2. Location priority (bin > sub > warehouse)
      if (a.location_priority !== b.location_priority) {
        return a.location_priority - b.location_priority;
      }
      
      // 3. FIFO: older inventory first
      if (a.week_number !== b.week_number) {
        return a.week_number - b.week_number;
      }
      
      // 4. Age: older first
      if (a.age_seconds !== b.age_seconds) {
        return parseFloat(b.age_seconds) - parseFloat(a.age_seconds);
      }
      
      // 5. Quantity: higher quantity first
      return b.quantity - a.quantity;
    });
    
    // Add all inventory that can contribute to fulfilling the requirement
    for (const inv of sortedInventory) {
      if (remainingQuantity <= 0) break;
      
      const quantityToTake = Math.min(inv.quantity, remainingQuantity);
      
      allSuggestions.push({
        available_quantity: inv.quantity,
        quantity_ready_to_pick: quantityToTake,
        uom: inv.pth_uom || 'DUS',
        inventory_progression_status: inv.it_progression_status,
        inventory_status: inv.it_inventory_status,
        inventory_tracking_id: inv.inventory_tracking_id,
        warehouse_sub_name: inv.warehouse_sub_name,
        warehouse_sub_code: inv.warehouse_sub_code,
        warehouse_sub_id: inv.it_warehouse_sub_id,
        warehouse_bin_id: inv.warehouse_bin_id,
        bin_name: inv.bin_name || 'N/A',
        bin_code: inv.bin_code || 'N/A',
        search_level: inv.search_level,
        location_type: inv.location_type,
        location_priority: inv.location_priority,
        pallet_id: inv.it_pallet_id,
        pallet_code: inv.p_pallet_code || 'N/A',
        pallet_utilization: inv.pallet_utilization || '0.00',
        week_number: inv.week_number,
        production_date: inv.production_date,
        place: this.getLocationPlace(inv)
      });
      
      remainingQuantity -= quantityToTake;
    }
    
    return allSuggestions;
  }

  private calculateTotalSuggestedQuantity(availableInventory: any[], requiredQuantity: number): number {
    const allSuggestions = this.getAllAvailableInventory(availableInventory, requiredQuantity);
    return allSuggestions.reduce((sum, suggestion) => sum + suggestion.quantity_ready_to_pick, 0);
  }

  private determineFulfillmentStatus(availableInventory: any[], requiredQuantity: number): string {
    console.log('availableInventory', availableInventory);
    
    // Get all available inventory that can contribute to fulfilling the requirement
    const allSuggestions = this.getAllAvailableInventory(availableInventory, requiredQuantity);
    
    if (allSuggestions.length === 0) {
      return 'UNFULFILLED';
    }
    
    // Calculate total quantity that can be fulfilled
    const totalFulfillable = allSuggestions.reduce((sum, suggestion) => sum + suggestion.quantity_ready_to_pick, 0);
    
    // Check for partial pick scenario (available_quantity > quantity_ready_to_pick)
    const hasPartialPick = allSuggestions.some(suggestion => 
      suggestion.available_quantity > suggestion.quantity_ready_to_pick
    );
    
    console.log('Status calculation:', {
      totalFulfillable,
      requiredQuantity,
      hasPartialPick,
      allSuggestions: allSuggestions.map(s => ({
        available_quantity: s.available_quantity,
        quantity_ready_to_pick: s.quantity_ready_to_pick
      }))
    });
    
    // PARTIAL PICK: Check for partial pick scenario first (available_quantity > quantity_ready_to_pick)
    if (hasPartialPick) {
      return 'PARTIAL';
    }
    // FULFILLED: Exact match - can fulfill exactly what's required
    else if (totalFulfillable === requiredQuantity) {
      return 'FULFILLED';
    } 
    // OVERFULFILLED: Can fulfill more than required
    else if (totalFulfillable > requiredQuantity) {
      return 'OVERFULFILLED';
    } 
    // PARTIAL: Can fulfill some but not all
    else if (totalFulfillable > 0) {
      return 'PARTIAL';
    } 
    // UNFULFILLED: Cannot fulfill any
    else {
      return 'UNFULFILLED';
    }
  }

  private generateNotes(item: any, memo: any, availableInventory: any[]): string {
    const allSuggestions = this.getAllAvailableInventory(availableInventory, item.quantity_plan);
    const totalFulfillable = allSuggestions.reduce((sum, suggestion) => sum + suggestion.quantity_ready_to_pick, 0);
    const totalAvailable = allSuggestions.reduce((sum, suggestion) => sum + suggestion.available_quantity, 0);
    const requiredQuantity = item.quantity_plan;
    
    // Check for partial pick scenario
    const hasPartialPick = allSuggestions.some(suggestion => 
      suggestion.available_quantity > suggestion.quantity_ready_to_pick
    );
    
    console.log('Notes calculation:', {
      totalFulfillable,
      totalAvailable,
      requiredQuantity,
      hasPartialPick,
      allSuggestions: allSuggestions.map(s => ({
        available_quantity: s.available_quantity,
        quantity_ready_to_pick: s.quantity_ready_to_pick
      }))
    });
    
    // Partial pick scenario - inventory available but only partially ready (CHECK FIRST)
    if (hasPartialPick) {
      return `Item tersedia dengan partial pick. Tersedia: ${totalAvailable} ${item.uom}, Siap di-pick: ${totalFulfillable} ${item.uom}, Dibutuhkan: ${requiredQuantity} ${item.uom}`;
    }
    // Exact match - perfect fulfillment
    else if (totalFulfillable === requiredQuantity) {
      return `Item tersedia dengan jumlah yang tepat. Total tersedia: ${totalFulfillable} ${item.uom}`;
    } 
    // More than required available
    else if (totalFulfillable > requiredQuantity) {
      return `Item tersedia dengan jumlah berlebih. Total tersedia: ${totalFulfillable} ${item.uom}, Dibutuhkan: ${requiredQuantity} ${item.uom}`;
    } 
    // Partial availability
    else if (totalFulfillable > 0) {
      return `Item tersedia sebagian. Tersedia: ${totalFulfillable} ${item.uom}, Dibutuhkan: ${requiredQuantity} ${item.uom}`;
    } 
    // No inventory available
    else {
      return `Item tidak tersedia di inventory. Dibutuhkan: ${requiredQuantity} ${item.uom}`;
    }
  }
}
