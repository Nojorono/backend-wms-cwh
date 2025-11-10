import { Injectable } from '@nestjs/common';
import { PickingSuggestionDto } from './dto/picking-suggestion.dto';
import { PickingSuggestionLocationDto } from './dto/picking-suggestion-location.dto';
import { PickingSuggestionRepository } from './picking-suggestion.repository';

@Injectable()
export class PickingSuggestionService {
  constructor(private readonly repository: PickingSuggestionRepository) {}

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

  private async generatePickingSuggestionsForMemo(memo: any): Promise<PickingSuggestionDto[]> {
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
      const alreadyPicked = await this.getAlreadyPickedQuantity(memo.id, item.item_id);
      const remainingRequired = Math.max(0, item.quantity_plan - alreadyPicked);

      // Find available inventory for this item
      const availableInventory = await this.findAvailableInventoryForItem(
        item.item_id,
        remainingRequired,
      );

      if (availableInventory.length > 0) {
        const suggestion = {
          memo_id: memo.id,
          item_id: item.item_id,
          item_name: item.item_name,
          item_code: item.item_code,
          required_quantity: item.quantity_plan,
          already_picked_quantity: alreadyPicked,
          remaining_quantity_needed: remainingRequired,
          suggested_locations: this.getAllAvailableInventory(
            availableInventory,
            remainingRequired,
          ),
          total_suggested_quantity: this.calculateTotalSuggestedQuantity(
            availableInventory,
            remainingRequired,
          ),
          priority: item.priority,
          notes: this.generateNotes(item, memo, availableInventory, alreadyPicked),
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
      const searchStrategies = [() => this.searchInventoryWithPalletHistory(itemId)];

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
      return await this.repository.searchInventoryWithPalletHistory(itemId);
    } catch (error) {
      console.warn('searchInventoryWithPalletHistory failed:', error.message);
      return [];
    }
  }

  private async debugInventorySearch(itemId: string): Promise<void> {
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

  private filterAndSortInventory(inventory: any[], requiredQuantity: number): any[] {
    return inventory
      .filter((inv) => {
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

  async getPickingSuggestionsByMemo(memoId: string): Promise<PickingSuggestionDto[]> {
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

      return await this.generatePickingSuggestionsForMemo(memo);
    } catch (error) {
      console.error('Error in getPickingSuggestionsByMemo:', error);
      console.error('Query parameters:', { memoId });
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
  ): PickingSuggestionLocationDto[] {
    // Group inventory by bin level for global suggestions
    const binGroups = new Map();

    // Group inventory by bin (warehouse_bin_id) or sub-warehouse (warehouse_sub_id) if no bin
    for (const inv of availableInventory) {
      const binKey = inv.warehouse_bin_id || `sub_${inv.it_warehouse_sub_id}`;

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
          reserved_quantity: 0,
          available_quantity: 0,
          items: [],
        });
      }

      const group = binGroups.get(binKey);
      group.total_quantity += parseFloat(inv.quantity || 0);
      group.reserved_quantity += parseFloat(inv.reserved_quantity || 0);
      group.available_quantity += parseFloat(inv.available_quantity || 0);
      group.items.push(inv);
    }

    // Convert to array and sort by priority
    const sortedBins = Array.from(binGroups.values()).sort((a, b) => {
      // 1. Location priority (bin > sub > warehouse)
      if (a.location_priority !== b.location_priority) {
        return a.location_priority - b.location_priority;
      }

      // 2. Total quantity (higher first)
      return b.total_quantity - a.total_quantity;
    });

    // Generate suggestions for each bin
    const allSuggestions: any[] = [];
    let remainingQuantity = requiredQuantity;

    for (const bin of sortedBins) {
      if (remainingQuantity <= 0) break;

      // Use available_quantity (after reservations) instead of total_quantity
      const quantityToTake = Math.min(bin.available_quantity, remainingQuantity);

      // Skip if no available quantity after reservations
      if (quantityToTake <= 0) continue;

      // Find the most representative item for status and other details
      const representativeItem = bin.items[0];

      allSuggestions.push({
        total_quantity: bin.total_quantity,
        reserved_quantity: bin.reserved_quantity,
        available_quantity: bin.available_quantity,
        quantity_ready_to_pick: quantityToTake,
        uom: representativeItem.uom || representativeItem.pth_uom || 'DUS',
        warehouse_name: bin.warehouse_name,
        warehouse_sub_name: bin.warehouse_sub_name,
        warehouse_sub_code: bin.warehouse_sub_code,
        warehouse_sub_id: bin.warehouse_sub_id,
        warehouse_bin_id: bin.warehouse_bin_id,
        bin_id: bin.bin_id,
        bin_name: bin.bin_name,
        bin_code: bin.bin_code,
        search_level: bin.search_level,
        location_type: bin.location_type,
        location_priority: bin.location_priority,
        week_number: representativeItem.week_number || representativeItem.pth_week_number,
        production_date: representativeItem.production_date,
        place: bin.place,
      });

      remainingQuantity -= quantityToTake;
    }

    return allSuggestions;
  }

  private calculateTotalSuggestedQuantity(
    availableInventory: any[],
    requiredQuantity: number,
  ): number {
    const allSuggestions = this.getAllAvailableInventory(availableInventory, requiredQuantity);
    return allSuggestions.reduce((sum, suggestion) => sum + suggestion.quantity_ready_to_pick, 0);
  }

  private async getAlreadyPickedQuantity(memoId: string, itemId: string): Promise<number> {
    return await this.repository.getAlreadyPickedQuantityForMemoItem(memoId, itemId);
  }

  private generateNotes(item: any, memo: any, availableInventory: any[], alreadyPicked: number = 0): string {
    const remainingRequired = Math.max(0, item.quantity_plan - alreadyPicked);
    const allSuggestions = this.getAllAvailableInventory(availableInventory, remainingRequired);
    const totalFulfillable = allSuggestions.reduce(
      (sum, suggestion) => sum + suggestion.quantity_ready_to_pick,
      0,
    );
    const totalAvailable = allSuggestions.reduce(
      (sum, suggestion) => sum + suggestion.available_quantity,
      0,
    );

    // Build note with context about existing pickings
    let note = '';
    
    if (alreadyPicked > 0) {
      note = `Sudah di-pick: ${alreadyPicked} ${item.uom}. Sisa: ${remainingRequired} ${item.uom}. `;
    }

    // Check for partial pick scenario
    const hasPartialPick = allSuggestions.some(
      (suggestion) => suggestion.available_quantity > suggestion.quantity_ready_to_pick,
    );

    // Partial pick scenario - inventory available but only partially ready (CHECK FIRST)
    if (hasPartialPick) {
      note += `Item tersedia dengan partial pick. Tersedia: ${totalAvailable} ${item.uom}, Siap di-pick: ${totalFulfillable} ${item.uom}`;
    }
    // Exact match - perfect fulfillment
    else if (totalFulfillable === remainingRequired) {
      note += `Item tersedia dengan jumlah yang tepat. Total tersedia: ${totalFulfillable} ${item.uom}`;
    }
    // More than required available
    else if (totalFulfillable > remainingRequired) {
      note += `Item tersedia dengan jumlah berlebih. Total tersedia: ${totalFulfillable} ${item.uom}`;
    }
    // Partial availability
    else if (totalFulfillable > 0) {
      note += `Item tersedia sebagian. Tersedia: ${totalFulfillable} ${item.uom}, Masih kurang: ${remainingRequired - totalFulfillable} ${item.uom}`;
    }
    // No inventory available
    else {
      note += `Item tidak tersedia di inventory`;
    }

    return note;
  }

  async getPickingSuggestionsByItemId(itemId: string): Promise<any> {
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
    const availableInventory = await this.findAvailableInventoryForItem(itemId, 0);

    if (availableInventory.length === 0) {
      return {
        item_id: itemId,
        item_name: item.description,
        item_code: item.item_number,
        total_available_quantity: 0,
        suggested_locations: [],
        notes: 'Item tidak tersedia di inventory',
      };
    }

    // Get all available inventory grouped by location
    const totalQuantity = availableInventory.reduce((sum, inv) => sum + inv.quantity, 0);
    const locations = this.getAllAvailableInventory(availableInventory, totalQuantity);

    return {
      item_id: itemId,
      item_name: item.description,
      item_code: item.item_number,
      total_available_quantity: totalQuantity,
      suggested_locations: locations,
      notes: `Item tersedia dengan total ${totalQuantity} unit di ${locations.length} lokasi`,
    };
  }
}

