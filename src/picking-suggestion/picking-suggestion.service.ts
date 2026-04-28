import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PickingSuggestionDto } from './dto/picking-suggestion.dto';
import { PickingSuggestionLocationDto } from './dto/picking-suggestion-location.dto';
import { PickingSuggestionRepository } from './picking-suggestion.repository';
import {
  InventoryTracking,
  ProgressionStatus,
} from '../core/domain/entities/inventory-tracking.entity';
import { MasterWarehouseBin } from '../core/domain/entities/master-warehouse-bin.entity';
import { MasterWarehouseSub } from '../core/domain/entities/master-warehouse-sub.entity';
import { MasterWarehouse } from '../core/domain/entities/master-warehouse.entity';
import { MasterPalletService } from '../master-pallet/master-pallet.service';
import { PalletItemQuantityDto } from '../master-pallet/dto/pallet-quantity.dto';
import { TransactionScanInbound } from '../core/domain/entities/transaction-scan-inbound.entity';

@Injectable()
export class PickingSuggestionService {
  constructor(
    private readonly repository: PickingSuggestionRepository,
    private readonly masterPalletService: MasterPalletService,
    @InjectRepository(InventoryTracking)
    private readonly inventoryTrackingRepository: Repository<InventoryTracking>,
    @InjectRepository(MasterWarehouseBin)
    private readonly masterWarehouseBinRepository: Repository<MasterWarehouseBin>,
    @InjectRepository(MasterWarehouseSub)
    private readonly masterWarehouseSubRepository: Repository<MasterWarehouseSub>,
  ) { }

  async getPickingSuggestionsForOutboundDo(outboundDoId: string): Promise<PickingSuggestionDto[]> {
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
    suggestions.routeOptimization = await this.generateRouteOptimization(
      suggestions.pickingSuggestions,
    );

    // Generate priority items
    suggestions.priorityItems = await this.generatePriorityItems(suggestions.pickingSuggestions);

    // Calculate estimated picking time
    suggestions.estimatedPickingTime = this.calculateEstimatedPickingTime(
      suggestions.pickingSuggestions,
    );

    return suggestions.pickingSuggestions;
  }

  private async getOutboundDoWithDetails(outboundDoId: string): Promise<any> {
    // Validate outboundDoId before proceeding
    if (!outboundDoId || outboundDoId.trim() === '') {
      console.warn('getOutboundDoWithDetails: outboundDoId is empty or null');
      return null;
    }

    try {
      const results = await this.repository.getOutboundDoWithMemos(outboundDoId);

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
      outbound_memos: [],
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
          items: [],
        });
      }

      if (result.memo_item_id) {
        memoMap.get(result.memo_id).items.push({
          id: result.memo_item_id,
          item_id: result.item_id,
          item_name: result.item_name,
          item_code: result.item_code,
          quantity_plan: result.quantity_plan,
          uom: result.uom,
        });
      }
    }

    outboundDo.outbound_memos = Array.from(memoMap.values()) as any[];
    return outboundDo;
  }

  private async generatePickingSuggestionsForMemo(
    memo: any,
    sortMethod: 'FIFO' | 'LIFO' = 'FIFO',
    organizationId?: string,
  ): Promise<PickingSuggestionDto[]> {
    const suggestions: PickingSuggestionDto[] = [];

    // Calculate priority for each item and sort by priority
    const itemsWithPriority = memo.items
      .map((item) => ({
        ...item,
        priority: this.calculateItemPriority(item, memo),
      }))
      .sort((a, b) => a.priority - b.priority); // Lower number = higher priority

    for (const item of itemsWithPriority) {
      // Validate item before processing
      if (!item.item_id || item.item_id.trim() === '') {
        console.warn('generatePickingSuggestionsForMemo: item_id is empty or null for item:', item);
        continue;
      }

      // Calculate how much is already assigned to transaction-picking for this memo item
      const alreadyPicked = await this.getAlreadyPickedQuantity(item.item_id, memo.id);
      const remainingRequired = Math.max(0, item.quantity_plan - alreadyPicked);

      // Find available inventory for this item
      const availableInventory = await this.findAvailableInventoryForItem(
        item.item_id,
        remainingRequired,
        item.uom,
        sortMethod,
        organizationId,
      );

      if (availableInventory.length > 0) {
        const suggestedLocations = this.getAllAvailableInventory(
          availableInventory,
          remainingRequired,
          sortMethod,
        );
        const totalSuggested = suggestedLocations.reduce(
          (sum, s) => sum + s.quantity_ready_to_pick, 0,
        );
        const netAvailable = this.computeNetAvailable(availableInventory);

        const suggestion = {
          memo_id: memo.id,
          item_id: item.item_id,
          item_name: item.item_name,
          item_code: item.item_code,
          required_quantity: item.quantity_plan,
          already_picked_quantity: alreadyPicked,
          remaining_quantity_needed: remainingRequired,
          available_quantity: netAvailable,
          suggested_locations: suggestedLocations,
          total_suggested_quantity: totalSuggested,
          priority: item.priority,
          notes: this.generateNotesFromSuggestions(
            item, alreadyPicked, remainingRequired, suggestedLocations, netAvailable,
          ),
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
          already_picked_quantity: alreadyPicked,
          remaining_quantity_needed: remainingRequired,
          available_quantity: 0,
          suggested_locations: [],
          total_suggested_quantity: 0,
          priority: item.priority,
          notes: alreadyPicked > 0
            ? `Item sudah di-pick: ${alreadyPicked} ${item.uom}. Sisa kebutuhan: ${remainingRequired} ${item.uom}. Tidak tersedia di inventory.`
            : `Item tidak tersedia di inventory. Dibutuhkan: ${item.quantity_plan} ${item.uom}`,
        };
        suggestions.push(suggestion as any);
      }
    }

    // Sort suggestions by priority and fulfillment status
    return this.sortSuggestionsByPriority(suggestions);
  }

  private async findAvailableInventoryForItem(
    itemId: string,
    requiredQuantity: number,
    uom?: string,
    sortMethod: 'FIFO' | 'LIFO' = 'FIFO',
    organizationId?: string,
  ): Promise<any[]> {
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
        () => this.searchInventoryWithPalletHistory(itemId, uom, sortMethod, organizationId),
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
        await this.debugInventorySearch(itemId, uom);
      }

      // Filter and sort results
      return this.filterAndSortInventory(results, requiredQuantity, sortMethod);
    } catch (error) {
      console.error('Error in findAvailableInventoryForItem:', error);
      console.error('Query parameters:', { itemId, requiredQuantity });
      return [];
    }
  }

  private async searchInventoryWithPalletHistory(
    itemId: string,
    uom?: string,
    sortMethod: 'FIFO' | 'LIFO' = 'FIFO',
    organizationId?: string,
  ): Promise<any[]> {
    try {
      return await this.repository.searchInventoryWithPalletHistory(
        itemId,
        uom,
        sortMethod,
        organizationId,
      );
    } catch (error) {
      console.warn('searchInventoryWithPalletHistory failed:', error.message);
      return [];
    }
  }

  private async debugInventorySearch(itemId: string, uom?: string): Promise<void> {
    try {
      const simpleResults = await this.repository.debugInventorySimpleQuery();

      // Try with pallet join if simple query works
      if (simpleResults.length > 0) {
        await this.repository.debugInventoryWithJoins();
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

  private filterAndSortInventory(
    inventory: any[],
    requiredQuantity: number,
    sortMethod: 'FIFO' | 'LIFO' = 'FIFO',
  ): any[] {
    return inventory
      .filter((inv) => {
        const qty = parseFloat(inv.quantity) || 0;
        if (qty <= 0) return false;
        // If no specific quantity required, include all positive-quantity rows
        if (!requiredQuantity || requiredQuantity <= 0) return true;
        const hasEnoughQuantity = qty >= requiredQuantity;
        const hasPartialQuantity = inv.pallet_utilization == null || parseFloat(inv.pallet_utilization) < 100;
        return hasEnoughQuantity || hasPartialQuantity;
      })
      .sort((a, b) => {
        // Primary sort: Location priority (bin > sub > warehouse)
        if (a.location_priority !== b.location_priority) {
          return a.location_priority - b.location_priority;
        }

        // Secondary sort: Week number (FIFO = ASC, LIFO = DESC)
        if (a.week_number !== b.week_number) {
          const weekA = a.week_number || 0;
          const weekB = b.week_number || 0;
          if (sortMethod === 'LIFO') {
            return weekB - weekA; // DESC: highest week number first
          } else {
            return weekA - weekB; // ASC: lowest week number first
          }
        }

        // Tertiary sort: Production date (FIFO = ASC, LIFO = DESC)
        if (a.production_date !== b.production_date) {
          const prodDateA = a.production_date ? new Date(a.production_date).getTime() : 0;
          const prodDateB = b.production_date ? new Date(b.production_date).getTime() : 0;
          if (sortMethod === 'LIFO') {
            return prodDateB - prodDateA; // DESC: most recent first
          } else {
            return prodDateA - prodDateB; // ASC: oldest first
          }
        }

        // Quaternary sort: Inventory date (FIFO = ASC, LIFO = DESC)
        const dateA = a.inventory_date ? new Date(a.inventory_date).getTime() : 0;
        const dateB = b.inventory_date ? new Date(b.inventory_date).getTime() : 0;
        if (dateA !== dateB) {
          if (sortMethod === 'LIFO') {
            return dateB - dateA; // DESC: most recent first
          } else {
            return dateA - dateB; // ASC: oldest first
          }
        }

        // Final sort: Quantity (higher first for same date/week)
        return b.quantity - a.quantity;
      });
  }

  private calculateItemPriority(item: any, memo: any): number {
    let priority = 5; // Default priority (lower number = higher priority)

    // Priority 1: Critical items (urgent delivery + high quantity)
    const deliveryDate = new Date(memo.delivery_date);
    const today = new Date();
    const daysUntilDelivery = Math.ceil(
      (deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

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
      const statusOrder = { FULFILLED: 1, OVERFULFILLED: 2, PARTIAL: 3, UNFULFILLED: 4 };
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
            total_estimated_time: 0,
          });
        }

        const group = routeGroups.get(key);
        group.bins.push(location);
        group.total_estimated_time += location.estimated_picking_time;
      }
    }

    // Sort by efficiency and create optimal route
    const optimalRoute = Array.from(routeGroups.values()).sort(
      (a, b) => b.total_estimated_time - a.total_estimated_time,
    );

    return {
      optimal_route: optimalRoute,
      total_estimated_time: optimalRoute.reduce(
        (sum, route) => sum + route.total_estimated_time,
        0,
      ),
      route_efficiency_score: this.calculateRouteEfficiency(optimalRoute),
    };
  }

  private async generatePriorityItems(pickingSuggestions: any[]): Promise<any[]> {
    return pickingSuggestions
      .sort((a, b) => a.priority - b.priority)
      .map((suggestion) => ({
        item_name: suggestion.item_name,
        item_code: suggestion.item_code,
        priority: suggestion.priority,
        required_quantity: suggestion.required_quantity,
        estimated_picking_time: suggestion.estimated_picking_time,
        week_optimization: suggestion.week_optimization,
      }));
  }

  private calculateEstimatedPickingTime(pickingSuggestions: any[]): number {
    return pickingSuggestions.reduce(
      (total, suggestion) => total + suggestion.estimated_picking_time,
      0,
    );
  }

  private calculateRouteEfficiency(route: any[]): number {
    // Calculate efficiency based on warehouse proximity and bin accessibility
    let efficiency = 100;

    for (let i = 1; i < route.length; i++) {
      // Penalize for warehouse changes
      if (route[i].warehouse_id !== route[i - 1].warehouse_id) {
        efficiency -= 20;
      }
      // Penalize for sub-warehouse changes
      else if (route[i].warehouse_sub_id !== route[i - 1].warehouse_sub_id) {
        efficiency -= 10;
      }
    }

    return Math.max(0, efficiency);
  }

  async getPickingSuggestionsByMemo(
    memoId: string,
    sortMethod: 'FIFO' | 'LIFO' = 'FIFO',
    organizationId?: string,
  ): Promise<PickingSuggestionDto[]> {
    // Validate memoId before proceeding
    if (!memoId || memoId.trim() === '') {
      console.warn('getPickingSuggestionsByMemo: memoId is empty or null');
      return [];
    }

    try {
      const results = await this.repository.getMemoWithItems(memoId);

      if (results.length === 0) return [];

      const memo = {
        id: results[0].memo_id,
        requestor: results[0].requestor,
        origin: results[0].origin,
        ship_to: results[0].ship_to,
        destination: results[0].destination,
        delivery_date: results[0].delivery_date,
        status: results[0].status,
        items: results
          .filter((r) => r.memo_item_id)
          .map((r) => ({
            id: r.memo_item_id,
            item_id: r.item_id,
            item_name: r.item_name,
            item_code: r.item_code,
            quantity_plan: r.quantity_plan,
            uom: r.uom,
          })),
      };


      return await this.generatePickingSuggestionsForMemo(memo, sortMethod, organizationId);
    } catch (error) {
      console.error('Error in getPickingSuggestionsByMemo:', error);
      console.error('Query parameters:', { memoId, sortMethod });
      return [];
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

  private getAllAvailableInventory(
    availableInventory: any[],
    requiredQuantity: number,
    sortMethod: 'FIFO' | 'LIFO' = 'FIFO',
  ): PickingSuggestionLocationDto[] {
    // Group by unique physical bin (warehouse_sub_id + warehouse_bin_id).
    // All pallets in the same bin are merged into ONE entry regardless of week_number.
    const binGroups = new Map<string, any>();

    for (const inv of availableInventory) {
      const binKey = inv.warehouse_bin_id || `sub_${inv.warehouse_sub_id}`;

      if (!binGroups.has(binKey)) {
        binGroups.set(binKey, {
          warehouse_name: inv.warehouse_name,
          warehouse_sub_name: inv.warehouse_sub_name,
          warehouse_sub_code: inv.warehouse_sub_code,
          warehouse_sub_id: inv.warehouse_sub_id,
          bin_id: inv.warehouse_bin_id || 'N/A',
          bin_name: inv.bin_name || 'N/A',
          bin_code: inv.bin_code || 'N/A',
          search_level: inv.search_level,
          location_type: inv.location_type,
          location_priority: inv.location_priority,
          place: this.getLocationPlace(inv),
          total_quantity: 0,
          items: [],
          // track min/max week for FIFO/LIFO ordering of bins relative to each other
          min_week_number: inv.week_number ?? 0,
          max_week_number: inv.week_number ?? 0,
          earliest_production_date: inv.production_date,
          latest_production_date: inv.production_date,
        });
      }

      const group = binGroups.get(binKey)!;
      group.total_quantity += parseFloat(inv.quantity || 0);
      group.items.push(inv);

      const wn = inv.week_number ?? 0;
      if (wn < group.min_week_number) group.min_week_number = wn;
      if (wn > group.max_week_number) group.max_week_number = wn;
      const pd = inv.production_date ? new Date(inv.production_date).getTime() : 0;
      const epd = group.earliest_production_date ? new Date(group.earliest_production_date).getTime() : 0;
      const lpd = group.latest_production_date ? new Date(group.latest_production_date).getTime() : 0;
      if (pd && pd < epd) group.earliest_production_date = inv.production_date;
      if (pd && pd > lpd) group.latest_production_date = inv.production_date;
    }

    // Sort bins by location_priority, then FIFO/LIFO week ordering
    const sortedBins = Array.from(binGroups.values()).sort((a, b) => {
      if (a.location_priority !== b.location_priority) {
        return a.location_priority - b.location_priority;
      }
      const weekA = sortMethod === 'FIFO' ? a.min_week_number : a.max_week_number;
      const weekB = sortMethod === 'FIFO' ? b.min_week_number : b.max_week_number;
      if (weekA !== weekB) {
        return sortMethod === 'LIFO' ? weekB - weekA : weekA - weekB;
      }
      const pdA = sortMethod === 'FIFO'
        ? (a.earliest_production_date ? new Date(a.earliest_production_date).getTime() : 0)
        : (a.latest_production_date ? new Date(a.latest_production_date).getTime() : 0);
      const pdB = sortMethod === 'FIFO'
        ? (b.earliest_production_date ? new Date(b.earliest_production_date).getTime() : 0)
        : (b.latest_production_date ? new Date(b.latest_production_date).getTime() : 0);
      if (pdA !== pdB) {
        return sortMethod === 'LIFO' ? pdB - pdA : pdA - pdB;
      }
      return b.total_quantity - a.total_quantity;
    });

    // Per-bin net available from SQL (location_net_available = full bin READY total - reserved)
    const binNetAvailable = new Map<string, { reserved: number; netAvailable: number }>();
    for (const bin of sortedBins) {
      const firstItem = bin.items[0];
      binNetAvailable.set(bin.bin_id === 'N/A' ? `sub_${bin.warehouse_sub_id}` : bin.bin_id, {
        reserved: parseFloat(firstItem?.reserved_quantity || 0),
        netAvailable: Math.max(0, parseFloat(firstItem?.location_net_available || 0)),
      });
    }

    const showAll = requiredQuantity <= 0;
    const allSuggestions: any[] = [];
    let remainingQuantity = requiredQuantity;

    for (const bin of sortedBins) {
      if (!showAll && remainingQuantity <= 0) break;

      const netKey = bin.bin_id === 'N/A' ? `sub_${bin.warehouse_sub_id}` : bin.bin_id;
      const { reserved, netAvailable } = binNetAvailable.get(netKey) ?? { reserved: 0, netAvailable: 0 };

      const quantityToTake = showAll
        ? netAvailable
        : Math.min(netAvailable, remainingQuantity);

      if (quantityToTake <= 0) continue;

      const representativeItem = bin.items[0];

      allSuggestions.push({
        total_quantity: bin.total_quantity,
        reserved_quantity: reserved,
        available_quantity: netAvailable,
        quantity_ready_to_pick: quantityToTake,
        uom: representativeItem.uom || 'N/A',
        warehouse_name: bin.warehouse_name,
        warehouse_sub_name: bin.warehouse_sub_name,
        warehouse_sub_code: bin.warehouse_sub_code,
        warehouse_sub_id: bin.warehouse_sub_id,
        warehouse_bin_id: bin.bin_id !== 'N/A' ? bin.bin_id : null,
        bin_id: bin.bin_id,
        bin_name: bin.bin_name,
        bin_code: bin.bin_code,
        search_level: bin.search_level,
        location_type: bin.location_type,
        location_priority: bin.location_priority,
        week_number: sortMethod === 'FIFO' ? bin.min_week_number : bin.max_week_number,
        production_date: sortMethod === 'FIFO' ? bin.earliest_production_date : bin.latest_production_date,
        place: bin.place,
      });

      remainingQuantity -= quantityToTake;
    }

    return allSuggestions;
  }

  /**
   * Compute net available across unique bins using the SQL-provided location_net_available.
   * This value is computed from the full bin total (including excluded pallets), so it's
   * accurate even when some pallets are filtered out by progression_status / inventory_status.
   * Takes the first row per unique (warehouse_sub_id, warehouse_bin_id) pair.
   */
  private computeNetAvailable(availableInventory: any[]): number {
    const seen = new Set<string>();
    let total = 0;
    for (const inv of availableInventory) {
      const locKey = `${inv.warehouse_sub_id}_${inv.warehouse_bin_id || 'none'}`;
      if (!seen.has(locKey)) {
        seen.add(locKey);
        total += Math.max(0, parseFloat(inv.location_net_available || 0));
      }
    }
    return total;
  }

  private async getAlreadyPickedQuantity(itemId: string, memoId?: string): Promise<number> {
    return await this.repository.getAlreadyPickedQuantityForMemoItem(itemId, memoId);
  }

  private generateNotesFromSuggestions(
    item: any,
    alreadyPicked: number,
    remainingRequired: number,
    suggestedLocations: any[],
    netAvailable: number,
  ): string {
    const totalFulfillable = suggestedLocations.reduce(
      (sum, s) => sum + s.quantity_ready_to_pick, 0,
    );

    let note = '';

    if (alreadyPicked > 0) {
      note = `Sudah di-pick: ${alreadyPicked} ${item.uom}. Sisa: ${remainingRequired} ${item.uom}. `;
    }

    const hasPartialPick = netAvailable > totalFulfillable;

    if (hasPartialPick) {
      note += `Item tersedia dengan partial pick. Tersedia: ${netAvailable} ${item.uom}, Siap di-pick: ${totalFulfillable} ${item.uom}`;
    } else if (totalFulfillable === remainingRequired) {
      note += `Item tersedia dengan jumlah yang tepat. Total tersedia: ${totalFulfillable} ${item.uom}`;
    } else if (totalFulfillable > remainingRequired) {
      note += `Item tersedia dengan jumlah berlebih. Total tersedia: ${totalFulfillable} ${item.uom}`;
    } else if (totalFulfillable > 0) {
      note += `Item tersedia sebagian. Tersedia: ${totalFulfillable} ${item.uom}, Masih kurang: ${remainingRequired - totalFulfillable} ${item.uom}`;
    } else {
      note += `Item tidak tersedia di inventory`;
    }

    return note;
  }
  async getPickingSuggestionsByItemId(
    itemId: string,
    uom?: string,
    sortMethod?: 'FIFO' | 'LIFO',
    organizationId?: string,
  ): Promise<any> {
    // Validate itemId before proceeding
    if (!itemId || itemId.trim() === '') {
      throw new Error('Item ID is required');
    }

    if (!this.isValidUUID(itemId)) {
      throw new Error('Item ID is not a valid UUID');
    }

    // Get item details
    const item = await this.repository.findItemById(itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    // Find all available inventory for this item
    const preferredUom = uom || undefined;
    const availableInventory = await this.findAvailableInventoryForItem(
      itemId,
      0,
      preferredUom,
      sortMethod,
      organizationId,
    );

    if (availableInventory.length === 0) {
      return {
        item_id: itemId,
        item_name: item.description,
        item_code: item.item_number,
        total_available_quantity: 0,
        suggested_locations: [],
        notes: preferredUom
          ? `Item tidak tersedia di inventory untuk UOM ${preferredUom}`
          : 'Item tidak tersedia di inventory',
      };
    }

    // Net available per bin using SQL-provided location_net_available (full bin total - reserved)
    const totalQuantity = this.computeNetAvailable(availableInventory);

    const locations = this.getAllAvailableInventory(availableInventory, totalQuantity, sortMethod || 'FIFO');

    return {
      item_id: itemId,
      item_name: item.description,
      item_code: item.item_number,
      total_available_quantity: totalQuantity,
      suggested_locations: locations,
      notes: preferredUom
        ? `Item tersedia dengan total ${totalQuantity} ${preferredUom} di ${locations.length} lokasi`
        : `Item tersedia dengan total ${totalQuantity} unit di ${locations.length} lokasi`,
    };
  }

  async getPutAwaySuggestions(organizationId: string): Promise<{
    palletSuggestions: Array<{
      stagingPallet: InventoryTracking;
      suggestedBin: MasterWarehouseBin | null;
      suggestedZone: MasterWarehouseSub | null;
      palletItems: Array<PalletItemQuantityDto & { pallet_id: string }>;
    }>;
  }> {
    if (!organizationId || organizationId.trim() === '') {
      throw new Error('Organization ID is required');
    }

    if (!this.isValidUUID(organizationId)) {
      throw new Error('Organization ID is not a valid UUID');
    }

    const stagingPallets = await this.inventoryTrackingRepository
      .createQueryBuilder('tracking')
      .leftJoinAndSelect('tracking.pallet', 'pallet')
      .leftJoinAndSelect('tracking.warehouseSub', 'warehouseSub')
      .leftJoinAndSelect('tracking.warehouse', 'warehouse')
      .leftJoinAndSelect('tracking.warehouseBin', 'warehouseBin')
      .where('warehouseSub.is_staging = :staging', { staging: 'INBOUND' })
      .andWhere('warehouse.organization_id::uuid = :organizationId', { organizationId })
      .andWhere('tracking.progression_status = :progression_status', {
        progression_status: ProgressionStatus.NOT_STARTED,
      })
      .andWhere('tracking.inventory_status = :inventory_status', {
        inventory_status: 'INSPECTION_COMPLETED',
      })
      .getMany();

    if (stagingPallets.length === 0) {
      return { palletSuggestions: [] };
    }

    const palletIds = stagingPallets.map((sp) => sp.pallet_id).filter(Boolean);
    const allPalletItems: Array<PalletItemQuantityDto & { pallet_id: string }> = [];

    for (const palletId of palletIds) {
      if (!palletId) continue;
      try {
        const palletItems = await this.masterPalletService.getPalletItemLatestQuantity(palletId);
        const itemsWithPalletId = palletItems.map((item) => ({
          ...item,
          pallet_id: palletId,
        }));
        allPalletItems.push(...itemsWithPalletId);
      } catch (error) {
        console.warn(`Failed to fetch items for pallet ${palletId}:`, error.message);
      }
    }

    const availableBins = await this.masterWarehouseBinRepository
      .createQueryBuilder('bin')
      .leftJoinAndSelect('bin.warehouseSub', 'warehouseSub')
      .leftJoin(MasterWarehouse, 'warehouse', 'warehouse.id::varchar = warehouseSub.warehouse_id')
      .leftJoin('bin.inventory_trackings', 'tracking')
      .addSelect('COUNT(DISTINCT tracking.pallet_id)', 'calculated_current_pallet')
      .where('warehouseSub.is_staging IS NULL')
      .andWhere('warehouse.organization_id::uuid = :organizationId', { organizationId })
      .andWhere('(tracking.inventory_status = :status OR tracking.inventory_status IS NULL)', {
        status: 'IN_INVENTORY',
      })
      .groupBy(
        'bin.id, bin.name, bin.code, bin.capacity_pallet, bin.current_pallet, warehouseSub.id, warehouseSub.name, warehouseSub.code, warehouseSub.is_staging',
      )
      .having('COUNT(DISTINCT tracking.pallet_id) < bin.capacity_pallet')
      .orderBy('(bin.capacity_pallet - COUNT(DISTINCT tracking.pallet_id))', 'DESC')
      .getMany();

    const availableZones = await this.masterWarehouseSubRepository
      .createQueryBuilder('zone')
      .leftJoin(MasterWarehouse, 'warehouse', 'warehouse.id::varchar = zone.warehouse_id')
      .leftJoin(MasterWarehouseBin, 'bin', 'bin.warehouse_sub_id = zone.id')
      .where('zone.is_staging IS NULL')
      .andWhere('warehouse.organization_id::uuid = :organizationId', { organizationId })
      .groupBy('zone.id, zone.name, zone.code, zone.warehouse_id, zone.capacity_bin')
      .having('COUNT(bin.id) > 0')
      .orderBy('zone.name', 'ASC')
      .getMany();

    const palletSuggestions: Array<{
      stagingPallet: InventoryTracking;
      suggestedBin: MasterWarehouseBin | null;
      suggestedZone: MasterWarehouseSub | null;
      palletItems: Array<PalletItemQuantityDto & { pallet_id: string }>;
    }> = [];

    const usedBinIds = new Set<string>();
    const usedZoneIds = new Set<string>();

    for (const stagingPallet of stagingPallets) {
      const palletItems = allPalletItems.filter(
        (item) => item.pallet_id === stagingPallet.pallet_id,
      );
      const itemIds = palletItems.map((item) => item.item_id).filter(Boolean);
      const weekNumbers = palletItems.map((item) => item.week_number).filter(Boolean);

      const groupKey = `${itemIds.sort().join(',')}-${weekNumbers.sort().join(',')}`;
      const existingSuggestion = palletSuggestions.find((suggestion) => {
        const suggestionItems = suggestion.palletItems;
        const suggestionItemIds = suggestionItems.map((item) => item.item_id).filter(Boolean);
        const suggestionWeekNumbers = suggestionItems
          .map((item) => item.week_number)
          .filter(Boolean);
        const suggestionGroupKey = `${suggestionItemIds.sort().join(',')}-${suggestionWeekNumbers.sort().join(',')}`;
        return suggestionGroupKey === groupKey;
      });

      if (existingSuggestion) {
        palletSuggestions.push({
          stagingPallet,
          suggestedBin: existingSuggestion.suggestedBin,
          suggestedZone: existingSuggestion.suggestedZone,
          palletItems,
        });
        continue;
      }

      let matchingBinsForSameItem: MasterWarehouseBin[] = [];

      if (itemIds.length > 0 || weekNumbers.length > 0) {
        let query = this.masterWarehouseBinRepository
          .createQueryBuilder('bin')
          .leftJoin('bin.inventory_trackings', 'tracking')
          .leftJoin('tracking.pallet', 'pallet')
          .leftJoin(TransactionScanInbound, 'scan', 'scan.pallet_id = pallet.id')
          .leftJoin('bin.warehouseSub', 'warehouseSub')
          .leftJoin(MasterWarehouse, 'warehouse', 'warehouse.id::varchar = warehouseSub.warehouse_id')
          .addSelect('COUNT(DISTINCT tracking.pallet_id)', 'calculated_current_pallet')
          .addSelect('COUNT(scan.id)', 'matching_items_count')
          .where('warehouseSub.is_staging IS NULL')
          .andWhere('warehouse.organization_id::uuid = :organizationId', { organizationId })
          .andWhere('(tracking.inventory_status = :status OR tracking.inventory_status IS NULL)', {
            status: 'IN_INVENTORY',
          })
          .groupBy(
            'bin.id, bin.name, bin.code, bin.capacity_pallet, bin.current_pallet, warehouseSub.id, warehouseSub.name, warehouseSub.code, warehouseSub.is_staging',
          )
          .having('COUNT(DISTINCT tracking.pallet_id) < bin.capacity_pallet');

        if (itemIds.length > 0 && weekNumbers.length > 0) {
          query = query.andWhere(
            '(scan.item_id IN (:...itemIds) OR scan.week_number IN (:...weekNumbers))',
            { itemIds, weekNumbers },
          );
        } else if (itemIds.length > 0) {
          query = query.andWhere('scan.item_id IN (:...itemIds)', { itemIds });
        } else if (weekNumbers.length > 0) {
          query = query.andWhere('scan.week_number IN (:...weekNumbers)', { weekNumbers });
        }

        matchingBinsForSameItem = await query
          .orderBy('COUNT(scan.id)', 'DESC')
          .addOrderBy('(bin.capacity_pallet - COUNT(DISTINCT tracking.pallet_id))', 'DESC')
          .limit(3)
          .getMany();
      }

      let suggestedBin: MasterWarehouseBin | undefined;
      let suggestedZone: MasterWarehouseSub | undefined;

      if (matchingBinsForSameItem.length > 0) {
        suggestedBin = matchingBinsForSameItem.find((bin) => !usedBinIds.has(bin.id));
        if (suggestedBin) {
          suggestedZone = availableZones.find(
            (zone) => zone.id === suggestedBin?.warehouse_sub_id,
          ) as MasterWarehouseSub;
        }
      }

      if (!suggestedBin) {
        const emptyBins = await this.masterWarehouseBinRepository
          .createQueryBuilder('bin')
          .leftJoin('bin.warehouseSub', 'warehouseSub')
          .leftJoin(MasterWarehouse, 'warehouse', 'warehouse.id::varchar = warehouseSub.warehouse_id')
          .leftJoin('bin.inventory_trackings', 'tracking')
          .addSelect('COUNT(DISTINCT tracking.pallet_id)', 'calculated_current_pallet')
          .where('bin.capacity_pallet > 0')
          .andWhere('warehouseSub.is_staging IS NULL')
          .andWhere('warehouse.organization_id::uuid = :organizationId', { organizationId })
          .andWhere('(tracking.inventory_status = :status OR tracking.inventory_status IS NULL)', {
            status: 'IN_INVENTORY',
          })
          .groupBy(
            'bin.id, bin.name, bin.code, bin.capacity_pallet, bin.current_pallet, warehouseSub.id, warehouseSub.name, warehouseSub.code, warehouseSub.is_staging',
          )
          .having('COUNT(DISTINCT tracking.pallet_id) = 0')
          .orderBy('bin.capacity_pallet', 'DESC')
          .limit(5)
          .getMany();

        suggestedBin = emptyBins.find((bin) => !usedBinIds.has(bin.id));
        if (suggestedBin) {
          suggestedZone = availableZones.find(
            (zone) => zone.id === suggestedBin?.warehouse_sub_id,
          ) as MasterWarehouseSub;
        }
      }

      if (!suggestedBin) {
        suggestedBin = availableBins.find((bin) => !usedBinIds.has(bin.id));
        if (suggestedBin) {
          suggestedZone = availableZones.find(
            (zone) => zone.id === suggestedBin?.warehouse_sub_id,
          ) as MasterWarehouseSub;
        }
      }

      if (!suggestedZone) {
        suggestedZone = availableZones.find((zone) => !usedZoneIds.has(zone.id)) as
          | MasterWarehouseSub
          | undefined;
      }

      // Final fallback: Get any regular warehouse bin/zone if still not found
      if (!suggestedBin) {
        const anyBin = await this.masterWarehouseBinRepository
          .createQueryBuilder('bin')
          .leftJoinAndSelect('bin.warehouseSub', 'warehouseSub')
          .leftJoin(MasterWarehouse, 'warehouse', 'warehouse.id::varchar = warehouseSub.warehouse_id')
          .where('warehouseSub.is_staging IS NULL')
          .andWhere('warehouse.organization_id::uuid = :organizationId', { organizationId })
          .andWhere('bin.capacity_pallet > 0')
          .orderBy('bin.capacity_pallet', 'DESC')
          .limit(1)
          .getOne();

        if (anyBin) {
          suggestedBin = anyBin;
          suggestedZone = availableZones.find(
            (zone) => zone.id === anyBin.warehouse_sub_id,
          ) as MasterWarehouseSub;
        }
      }

      if (!suggestedZone && suggestedBin) {
        // If we have a bin but no zone, get the zone from the bin's warehouse_sub_id
        const zoneFromBin = await this.masterWarehouseSubRepository.findOne({
          where: { id: suggestedBin.warehouse_sub_id },
        });
        if (zoneFromBin) {
          suggestedZone = zoneFromBin;
        }
      }

      if (!suggestedZone) {
        // Final fallback: Get any regular warehouse zone
        const anyZone = await this.masterWarehouseSubRepository
          .createQueryBuilder('zone')
          .leftJoin(MasterWarehouse, 'warehouse', 'warehouse.id::varchar = zone.warehouse_id')
          .leftJoin(MasterWarehouseBin, 'bin', 'bin.warehouse_sub_id = zone.id')
          .where('zone.is_staging IS NULL')
          .andWhere('warehouse.organization_id::uuid = :organizationId', { organizationId })
          .andWhere('bin.id IS NOT NULL')
          .groupBy('zone.id, zone.name, zone.code, zone.warehouse_id, zone.capacity_bin')
          .limit(1)
          .getOne();

        if (anyZone) {
          suggestedZone = anyZone;
          // Try to find a bin in this zone
          if (!suggestedBin) {
            const binInZone = await this.masterWarehouseBinRepository
              .createQueryBuilder('bin')
              .where('bin.warehouse_sub_id = :zoneId', { zoneId: anyZone.id })
              .andWhere('bin.capacity_pallet > 0')
              .orderBy('bin.capacity_pallet', 'DESC')
              .limit(1)
              .getOne();

            if (binInZone) {
              suggestedBin = binInZone;
            }
          }
        }
      }

      // Always add pallet to suggestions, even if bin/zone suggestions are not available
      palletSuggestions.push({
        stagingPallet,
        suggestedBin: suggestedBin || null,
        suggestedZone: suggestedZone || null,
        palletItems,
      });

      // Only mark as used if both bin and zone are found
      if (suggestedBin && suggestedZone) {
        usedBinIds.add(suggestedBin.id);
        usedZoneIds.add(suggestedZone.id);
      }
    }

    return { palletSuggestions };
  }
}

