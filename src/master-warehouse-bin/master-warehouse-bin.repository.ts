import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMasterWarehouseBinDto } from './dto/create-master-warehouse-bin.dto';
import { UpdateMasterWarehouseBinDto } from './dto/update-master-warehouse-bin.dto';
import { MasterWarehouseBin } from '../core/domain/entities/master-warehouse-bin.entity';
import { InventoryTracking } from '../core/domain/entities/inventory-tracking.entity';
import { MasterWarehouseSub } from '../core/domain/entities/master-warehouse-sub.entity';
import { MasterPalletService } from '../master-pallet/master-pallet.service';
import { PalletItemQuantityDto } from '../master-pallet/dto/pallet-quantity.dto';

@Injectable()
export class MasterWarehouseBinRepository {
  constructor(
    @InjectRepository(MasterWarehouseBin)
    private readonly repository: Repository<MasterWarehouseBin>,
    private readonly masterPalletService: MasterPalletService,
  ) {}

  async create(
    createMasterWarehouseBinDto: CreateMasterWarehouseBinDto,
  ): Promise<MasterWarehouseBin> {
    const warehouseBin = this.repository.create(createMasterWarehouseBinDto);
    return await this.repository.save(warehouseBin);
  }

  async findAll(): Promise<MasterWarehouseBin[]> {
    return await this.repository.find();
  }

  async findOne(id: string): Promise<MasterWarehouseBin | null> {
    const warehouseBin = await this.repository.findOne({ where: { id } });
    if (!warehouseBin) {
      return null;
    }
    return warehouseBin;
  }

  async findByOrganizationId(
    organization_id: number,
  ): Promise<MasterWarehouseBin[]> {
    return await this.repository.find({ where: { organization_id } });
  }

  async findByWarehouseSubId(
    warehouse_sub_id: string,
  ): Promise<MasterWarehouseBin[]> {
    return await this.repository.find({ where: { warehouse_sub_id } });
  }

  async update(
    id: string,
    updateMasterWarehouseBinDto: UpdateMasterWarehouseBinDto,
  ): Promise<MasterWarehouseBin | null> {
    const warehouseBin = await this.findOne(id);
    if (!warehouseBin) {
      throw new NotFoundException('Warehouse not found');
    }
    await this.repository.update(id, updateMasterWarehouseBinDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const warehouseBin = await this.findOne(id);
    if (!warehouseBin) {
      throw new NotFoundException('Warehouse not found');
    }
    await this.repository.delete(id);
  }

  async suggestionDestinationOut(): Promise<MasterWarehouseBin[]> {
    return await this.repository
      .createQueryBuilder('bin')
      .leftJoin('bin.inventory_trackings', 'tracking')
      .leftJoin('tracking.warehouse', 'warehouse')
      .where('warehouse.name = :outbound', { outbound: 'OUTBOUND' })
      .andWhere('bin.current_pallet > bin.capacity_pallet')
      .orderBy('(bin.current_pallet - bin.capacity_pallet)', 'DESC') // most overloaded first
      .getMany();
  }
  
  async suggestionDestinationIn($list_inventory_in_tracking: InventoryTracking[]): Promise<MasterWarehouseBin[]> {
    console.log($list_inventory_in_tracking);
    return await this.repository
      .createQueryBuilder('bin')
      .leftJoin('bin.inventory_trackings', 'tracking')
      .leftJoin('tracking.warehouse', 'warehouse')
      .where('bin.current_pallet < bin.capacity_pallet')
      .orderBy('(bin.capacity_pallet - bin.current_pallet)', 'DESC') // most free space first
      .getMany();
  }

  async getStagingPalletsWithSuggestions(): Promise<{
    palletSuggestions: Array<{
      stagingPallet: InventoryTracking,
      suggestedBin: MasterWarehouseBin,
      suggestedZone: MasterWarehouseSub,
      palletItems: Array<PalletItemQuantityDto & { pallet_id: string }>
    }>
  }> {
    // Get pallets currently in staging areas (INBOUND staging) with current item info only
    const stagingPallets = await this.repository.manager
      .createQueryBuilder(InventoryTracking, 'tracking')
      .leftJoinAndSelect('tracking.pallet', 'pallet')
      .leftJoinAndSelect('tracking.warehouseSub', 'warehouseSub')
      .leftJoinAndSelect('tracking.warehouse', 'warehouse')
      .leftJoinAndSelect('tracking.warehouseBin', 'warehouseBin')
      .where('warehouseSub.is_staging = :staging', { staging: 'INBOUND' })
      .andWhere('tracking.inventory_status = :status', { status: 'INSPECTION_COMPLETED' })
      .getMany();

    console.log(stagingPallets);

    // Early return if no staging pallets found
    if (stagingPallets.length === 0) {
      return { palletSuggestions: [] };
    }

    // Get current items in pallets using pallet service (latest quantities)
    const palletIds = stagingPallets.map(sp => sp.pallet_id).filter(Boolean);
    const allPalletItems: Array<PalletItemQuantityDto & { pallet_id: string }> = [];
    
    // Get current items for each pallet using the pallet service
    for (const palletId of palletIds) {
      try {
        const palletItems = await this.masterPalletService.getPalletItemLatestQuantity(palletId);
        // Add pallet_id to each item for easier filtering later
        const itemsWithPalletId = palletItems.map(item => ({
          ...item,
          pallet_id: palletId
        }));
        allPalletItems.push(...itemsWithPalletId);
      } catch (error) {
        console.log(`Error getting items for pallet ${palletId}:`, error.message);
      }
    }
    
    console.log('Total pallet items from pallet service:', allPalletItems.length);
    console.log('Sample pallet items:', allPalletItems.slice(0, 2));

    // Get available destination bins with their warehouse sub info
    const availableBins = await this.repository
      .createQueryBuilder('bin')
      .leftJoin('MasterWarehouseSub', 'warehouseSub', 'CAST(warehouseSub.id AS TEXT) = bin.warehouse_sub_id')
      .addSelect(['warehouseSub.id', 'warehouseSub.name', 'warehouseSub.code', 'warehouseSub.is_staging'])
      .where('bin.current_pallet < bin.capacity_pallet')
      .andWhere('(warehouseSub.is_staging IS NULL OR warehouseSub.is_staging != :staging)', { staging: 'INBOUND' })
      .orderBy('(bin.capacity_pallet - bin.current_pallet)', 'DESC') // most free space first
      .getMany();

    // Get available zones (warehouse subs) with capacity
    const availableZones = await this.repository.manager
      .createQueryBuilder('MasterWarehouseSub', 'zone')
      .leftJoin('MasterWarehouseBin', 'bin', 'bin.warehouse_sub_id = CAST(zone.id AS TEXT)')
      .where('zone.is_staging IS NULL OR zone.is_staging != :staging', { staging: 'INBOUND' })
      .groupBy('zone.id, zone.name, zone.code, zone.warehouse_id, zone.capacity_bin')
      .having('COUNT(bin.id) > 0') // zones that have bins
      .orderBy('zone.name', 'ASC')
      .getMany();

    // Create suggestions with item/week matching logic
    const palletSuggestions: Array<{
      stagingPallet: InventoryTracking,
      suggestedBin: MasterWarehouseBin,
      suggestedZone: MasterWarehouseSub,
      palletItems: Array<PalletItemQuantityDto & { pallet_id: string }>
    }> = [];
    const usedBinIds = new Set<string>();
    const usedZoneIds = new Set<string>();

    for (const stagingPallet of stagingPallets) {
      // Get current items and weeks for this pallet from pallet service
      const palletItems = allPalletItems.filter(item => item.pallet_id === stagingPallet.pallet_id);
      const itemIds = palletItems.map(item => item.item_id).filter(Boolean);
      const weekNumbers = palletItems.map(item => item.week_number).filter(Boolean);
      
      console.log(`\nProcessing pallet ${stagingPallet.pallet_id}:`);
      console.log('Pallet items found:', palletItems.length);
      console.log('Item IDs:', itemIds);
      console.log('Week numbers:', weekNumbers);
      console.log('Current quantities:', palletItems.map(item => `${item.item_name || item.item_id}: ${item.current_quantity} ${item.uom}`));

      // Step 1: Try to find bins with same items/weeks
      let matchingBinsForSameItem: MasterWarehouseBin[] = [];
      
      if (itemIds.length > 0 || weekNumbers.length > 0) {
        console.log('Searching for bins with same items/weeks...');
        
        let query = this.repository
          .createQueryBuilder('bin')
          .leftJoin('bin.inventory_trackings', 'tracking')
          .leftJoin('tracking.pallet', 'pallet')
          .leftJoin('TransactionScanInbound', 'scan', 'scan.pallet_id = pallet.id')
          .leftJoin('MasterWarehouseSub', 'warehouseSub', 'CAST(warehouseSub.id AS TEXT) = bin.warehouse_sub_id')
          .where('bin.current_pallet < bin.capacity_pallet')
          .andWhere('(warehouseSub.is_staging IS NULL OR warehouseSub.is_staging != :staging)', { staging: 'INBOUND' });

        if (itemIds.length > 0 && weekNumbers.length > 0) {
          query = query.andWhere('(scan.item_id IN (:...itemIds) OR scan.week_number IN (:...weekNumbers))', { itemIds, weekNumbers });
        } else if (itemIds.length > 0) {
          query = query.andWhere('scan.item_id IN (:...itemIds)', { itemIds });
        } else if (weekNumbers.length > 0) {
          query = query.andWhere('scan.week_number IN (:...weekNumbers)', { weekNumbers });
        }

        matchingBinsForSameItem = await query
          .groupBy('bin.id')
          .orderBy('COUNT(scan.id)', 'DESC')
          .limit(1) // Only get 1 bin
          .getMany();
          
        console.log('Found bins with same items/weeks:', matchingBinsForSameItem.length);
      }

      // Step 2: If no matching bins, find empty bins in available zones
      let suggestedBin: MasterWarehouseBin | undefined;
      let suggestedZone: MasterWarehouseSub | undefined;

      if (matchingBinsForSameItem.length > 0) {
        // Use bin with same items/weeks
        suggestedBin = matchingBinsForSameItem.find(bin => !usedBinIds.has(bin.id));
        if (suggestedBin) {
          // Find the zone for this bin
          suggestedZone = availableZones.find(zone => zone.id === suggestedBin?.warehouse_sub_id) as MasterWarehouseSub;
        }
      }

      // Step 3: If still no suggestion, find empty bins in zones
      if (!suggestedBin) {
        console.log('No bins with same items found, looking for empty bins...');
        
        // Find empty bins (current_pallet = 0 or very low)
        const emptyBins = await this.repository
          .createQueryBuilder('bin')
          .leftJoin('MasterWarehouseSub', 'warehouseSub', 'CAST(warehouseSub.id AS TEXT) = bin.warehouse_sub_id')
          .addSelect(['warehouseSub.id', 'warehouseSub.name', 'warehouseSub.code', 'warehouseSub.is_staging'])
          .where('bin.current_pallet = 0') // Completely empty bins
          .andWhere('bin.capacity_pallet > 0') // Has capacity
          .andWhere('(warehouseSub.is_staging IS NULL OR warehouseSub.is_staging != :staging)', { staging: 'INBOUND' })
          .orderBy('bin.capacity_pallet', 'DESC') // Largest capacity first
          .limit(5) // Get top 5 empty bins
          .getMany();

        console.log('Found empty bins:', emptyBins.length);

        // Pick first available empty bin
        suggestedBin = emptyBins.find(bin => !usedBinIds.has(bin.id));
        
        if (suggestedBin) {
          // Find zone for this empty bin
          suggestedZone = availableZones.find(zone => zone.id === suggestedBin?.warehouse_sub_id) as MasterWarehouseSub;
        }
      }

      // Step 4: Final fallback - any available bin
      if (!suggestedBin) {
        suggestedBin = availableBins.find(bin => !usedBinIds.has(bin.id));
        if (suggestedBin) {
          suggestedZone = availableZones.find(zone => zone.id === suggestedBin?.warehouse_sub_id) as MasterWarehouseSub;
        }
      }

      // Step 5: If no zone found yet, pick first available zone
      if (!suggestedZone) {
        suggestedZone = availableZones.find(zone => !usedZoneIds.has(zone.id)) as MasterWarehouseSub;
      }

      console.log('Final suggestion - Bin:', suggestedBin?.name || 'None', 'Zone:', suggestedZone?.name || 'None');

      if (suggestedBin && suggestedZone) {
        palletSuggestions.push({
          stagingPallet,
          suggestedBin,
          suggestedZone,
          palletItems
        });
        usedBinIds.add(suggestedBin.id);
        usedZoneIds.add(suggestedZone.id);
      } else {
        console.log('⚠️  No suitable bin or zone found for pallet:', stagingPallet.pallet_id);
      }
    }

    return {
      palletSuggestions
    };
  }
}
