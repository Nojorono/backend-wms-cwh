import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TransactionScanPickingRepository } from './transaction-scan-picking.repository';
import { CreateTransactionScanPickingDto } from './dto/create-transaction-scan-picking.dto';
import { UpdateTransactionScanPickingDto } from './dto/update-transaction-scan-picking.dto';
import { ScanPickingStatus, ScanPickingTransaction } from '../core/domain/entities/transaction-scan-picking.entity';
import { TransactionPickingService } from '../transaction-picking/transaction-picking.service';
import { MasterPalletService } from '../master-pallet/master-pallet.service';
import { QuantityOperationType, StatusInventory } from '../core/domain/entities/transaction-pallet-history.entity';
import { UpdateStatusDto } from './dto/update-status.dto';
import { InventoryTrackingService } from '../inventory-tracking/inventory-tracking.service';
import { MasterWarehouseBinService } from '../master-warehouse-bin/master-warehouse-bin.service';
import { ProgressionStatus } from 'src/core/domain/entities/inventory-tracking.entity';

@Injectable()
export class TransactionScanPickingService {
  constructor(
    private readonly repository: TransactionScanPickingRepository,
    private readonly transactionPickingService: TransactionPickingService,
    private readonly masterPalletService: MasterPalletService,
    private readonly inventoryTrackingService: InventoryTrackingService,
    private readonly masterWarehouseBinService: MasterWarehouseBinService,
  ) {}

  async create(data: CreateTransactionScanPickingDto): Promise<ScanPickingTransaction> {
    // Get transaction picking to retrieve item details
    const transactionPicking = await this.transactionPickingService.findOne(data.transaction_picking_id);
    
    await this.validateQuantities(data.quantity_picked, data.quantity_switch);
    await this.validatePallets([
      data.pallet_source_id,
      data.pallet_use_id,
      data.pallet_switch_id,
    ]);

    // Use item_id, uom, week_number from transaction_picking if not provided in DTO
    const itemId = data.item_id || transactionPicking.item_id;
    const uom = data.uom || transactionPicking.uom;
    const weekNumber = data.week_number || transactionPicking.week_number;
    const outboundDoId = transactionPicking.do_id;

    if (!itemId) {
      throw new BadRequestException('item_id is required (either in request or from transaction_picking)');
    }

    // Calculate quantities for each pallet
    const quantitySwitch = data.quantity_switch || 0;

    // Validate quantity_switch doesn't exceed quantity_picked
    if (quantitySwitch > data.quantity_picked) {
      throw new BadRequestException(
        `quantity_switch (${quantitySwitch}) cannot exceed quantity_picked (${data.quantity_picked})`,
      );
    }

    // Check if source and use pallets are the same
    const isSamePallet = Boolean(data.pallet_source_id && data.pallet_use_id && data.pallet_source_id === data.pallet_use_id);

    // Get production_date from source pallet if available
    const productionDate = data.pallet_source_id
      ? await this.getPalletItemProductionDate(data.pallet_source_id, itemId, uom)
      : undefined;

    // Update pallet quantities if pallets are provided
    // Always perform PICK operation from source pallet
    if (data.pallet_source_id && data.quantity_picked > 0) {
      // Pick total quantity from source pallet
      await this.masterPalletService.updateQuantity(data.pallet_source_id, {
        item_id: itemId,
        quantity: data.quantity_picked,
        operation_type: QuantityOperationType.PICK,
        uom: uom,
        week_number: weekNumber,
        production_date: productionDate,
        outbound_do_id: outboundDoId,
        user_id: data.user_id,
        reference_id: data.transaction_picking_id,
        reference_type: 'TRANSACTION_SCAN_PICKING',
        notes: `Picked ${data.quantity_picked} from source pallet for transaction scan picking`,
        status_inventory: StatusInventory.READY,
      });
    }

    if (data.pallet_switch_id && quantitySwitch > 0) {
      // Add switched quantity to switch pallet
      await this.masterPalletService.updateQuantity(data.pallet_switch_id, {
        item_id: itemId,
        quantity: quantitySwitch,
        operation_type: QuantityOperationType.ADD,
        uom: uom,
        week_number: weekNumber,
        production_date: productionDate,
        outbound_do_id: outboundDoId,
        user_id: data.user_id,
        reference_id: data.transaction_picking_id,
        reference_type: 'TRANSACTION_SCAN_PICKING',
        notes: `Switched ${quantitySwitch} to switch pallet from transaction scan picking`,
        status_inventory: StatusInventory.READY,
      });
    }

    // Handle use pallet quantity
    if (data.pallet_use_id && data.quantity_picked > 0) {
      if (isSamePallet) {
        // If source and use are the same pallet, add back the remaining quantity
        // (quantity_picked - quantity_switch) stays on the same pallet
        const remainingQuantity = data.quantity_picked - quantitySwitch;
        if (remainingQuantity > 0) {
          await this.masterPalletService.updateQuantity(data.pallet_use_id, {
            item_id: itemId,
            quantity: remainingQuantity,
            operation_type: QuantityOperationType.ADD,
            uom: uom,
            week_number: weekNumber,
            production_date: productionDate,
            outbound_do_id: outboundDoId,
            user_id: data.user_id,
            reference_id: data.transaction_picking_id,
            reference_type: 'TRANSACTION_SCAN_PICKING',
            notes: `Added back ${remainingQuantity} to same pallet (remaining after switch)`,
            status_inventory: StatusInventory.READY,
          });
        }
      } else {
        // If use pallet is different from source, add full quantity_picked to use pallet
        await this.masterPalletService.updateQuantity(data.pallet_use_id, {
          item_id: itemId,
          quantity: data.quantity_picked,
          operation_type: QuantityOperationType.ADD,
          uom: uom,
          week_number: weekNumber,
          production_date: productionDate,
          outbound_do_id: outboundDoId,
          user_id: data.user_id,
          reference_id: data.transaction_picking_id,
          reference_type: 'TRANSACTION_SCAN_PICKING',
          notes: `Added ${data.quantity_picked} to destination pallet from transaction scan picking`,
          status_inventory: StatusInventory.READY,
        });
      }
    }

    // Move inventory tracking for pallets
    await this.moveInventoryTrackingForPallets(
      data.pallet_source_id,
      data.pallet_use_id,
      data.pallet_switch_id,
      transactionPicking,
      data.quantity_picked,
      quantitySwitch,
      isSamePallet,
    );

    return this.repository.create(data);
  }

  async findAll(
    transaction_picking_id?: string,
    status?: string,
    pallet_id?: string,
  ): Promise<ScanPickingTransaction[]> {
    return this.repository.findAll({
      transactionPickingId: transaction_picking_id,
      status,
      palletId: pallet_id,
    });
  }

  async findOne(id: string): Promise<ScanPickingTransaction> {
    const entity = await this.repository.findOne(id);
    if (!entity) {
      throw new NotFoundException('Transaction scan picking tidak ditemukan');
    }
    return entity;
  }

  async findByTransactionPickingId(
    transactionPickingId: string,
  ): Promise<ScanPickingTransaction[]> {
    return this.repository.findAll({ transactionPickingId });
  }

  async update(
    id: string,
    data: UpdateTransactionScanPickingDto,
  ): Promise<ScanPickingTransaction> {
    const existing = await this.findOne(id);

    // Get transaction picking to retrieve item details
    const transactionPickingId = data.transaction_picking_id || existing.transaction_picking_id;
    const transactionPicking = await this.transactionPickingService.findOne(transactionPickingId);

    if (data.transaction_picking_id && data.transaction_picking_id !== existing.transaction_picking_id) {
      await this.transactionPickingService.findOne(data.transaction_picking_id);
    }

    // Use item_id, uom, week_number from transaction_picking if not provided
    const itemId = data.item_id || existing.item_id || transactionPicking.item_id;
    const uom = data.uom || existing.uom || transactionPicking.uom;
    const weekNumber = data.week_number ?? existing.week_number ?? transactionPicking.week_number;
    const outboundDoId = transactionPicking.do_id;

    if (!itemId) {
      throw new BadRequestException('item_id is required (either in request or from transaction_picking)');
    }

    if (
      data.quantity_picked !== undefined ||
      data.quantity_switch !== undefined
    ) {
      await this.validateQuantities(
        data.quantity_picked ?? existing.quantity_picked,
        data.quantity_switch ?? existing.quantity_switch,
      );
    }

    await this.validatePallets([
      data.pallet_source_id,
      data.pallet_use_id,
      data.pallet_switch_id,
    ]);

    // Check if pallet operations need to be updated
    const quantityPicked = data.quantity_picked ?? existing.quantity_picked;
    const quantitySwitch = data.quantity_switch ?? existing.quantity_switch ?? 0;

    const hasPalletChanges =
      data.pallet_source_id !== undefined ||
      data.pallet_use_id !== undefined ||
      data.pallet_switch_id !== undefined ||
      data.quantity_picked !== undefined ||
      data.quantity_switch !== undefined;

    if (hasPalletChanges) {
      // Validate quantity_switch
      if (quantitySwitch > quantityPicked) {
        throw new BadRequestException(
          `quantity_switch (${quantitySwitch}) cannot exceed quantity_picked (${quantityPicked})`,
        );
      }

      // Get user_id from data or existing (if stored)
      const userId = data.user_id ?? (existing as any).user_id;

      // Revert existing pallet operations
      await this.revertPalletOperations(existing, itemId, uom, weekNumber, transactionPickingId, outboundDoId, userId);

      // Apply new pallet operations based on updated data
      const newPalletSourceId = data.pallet_source_id ?? existing.pallet_source_id;
      const newPalletUseId = data.pallet_use_id ?? existing.pallet_use_id;
      const newPalletSwitchId = data.pallet_switch_id ?? existing.pallet_switch_id;

      // Check if source and use pallets are the same
      const isSamePallet = Boolean(newPalletSourceId && newPalletUseId && newPalletSourceId === newPalletUseId);

      // Get production_date from source pallet if available
      const productionDate = newPalletSourceId
        ? await this.getPalletItemProductionDate(newPalletSourceId, itemId, uom)
        : undefined;

      // Always perform PICK operation from source pallet
      if (newPalletSourceId && quantityPicked > 0) {
        await this.masterPalletService.updateQuantity(newPalletSourceId, {
          item_id: itemId,
          quantity: quantityPicked,
          operation_type: QuantityOperationType.PICK,
          uom: uom,
          week_number: weekNumber,
          production_date: productionDate,
          outbound_do_id: outboundDoId,
          user_id: userId,
          reference_id: transactionPickingId,
          reference_type: 'TRANSACTION_SCAN_PICKING',
          notes: `Picked ${quantityPicked} from source pallet for transaction scan picking (updated)`,
          status_inventory: StatusInventory.READY,
        });
      }

      // Apply new switch pallet operation
      if (newPalletSwitchId && quantitySwitch > 0) {
        await this.masterPalletService.updateQuantity(newPalletSwitchId, {
          item_id: itemId,
          quantity: quantitySwitch,
          operation_type: QuantityOperationType.ADD,
          uom: uom,
          week_number: weekNumber,
          production_date: productionDate,
          outbound_do_id: outboundDoId,
          user_id: userId,
          reference_id: transactionPickingId,
          reference_type: 'TRANSACTION_SCAN_PICKING',
          notes: `Switched ${quantitySwitch} to switch pallet from transaction scan picking (updated)`,
          status_inventory: StatusInventory.READY,
        });
      }

      // Handle use pallet quantity
      if (newPalletUseId && quantityPicked > 0) {
        if (isSamePallet) {
          // If source and use are the same pallet, add back the remaining quantity
          // (quantity_picked - quantity_switch) stays on the same pallet
          const remainingQuantity = quantityPicked - quantitySwitch;
          if (remainingQuantity > 0) {
            await this.masterPalletService.updateQuantity(newPalletUseId, {
              item_id: itemId,
              quantity: remainingQuantity,
              operation_type: QuantityOperationType.ADD,
              uom: uom,
              week_number: weekNumber,
              production_date: productionDate,
              outbound_do_id: outboundDoId,
              user_id: userId,
              reference_id: transactionPickingId,
              reference_type: 'TRANSACTION_SCAN_PICKING',
              notes: `Added back ${remainingQuantity} to same pallet (remaining after switch) - updated`,
              status_inventory: StatusInventory.READY,
            });
          }
        } else {
          // If use pallet is different from source, add full quantity_picked to use pallet
          await this.masterPalletService.updateQuantity(newPalletUseId, {
            item_id: itemId,
            quantity: quantityPicked,
            operation_type: QuantityOperationType.ADD,
            uom: uom,
            week_number: weekNumber,
            production_date: productionDate,
            outbound_do_id: outboundDoId,
            user_id: userId,
            reference_id: transactionPickingId,
            reference_type: 'TRANSACTION_SCAN_PICKING',
            notes: `Added ${quantityPicked} to destination pallet from transaction scan picking (updated)`,
            status_inventory: StatusInventory.READY,
          });
        }
      }

      // Move inventory tracking for updated pallets
      await this.moveInventoryTrackingForPallets(
        newPalletSourceId,
        newPalletUseId,
        newPalletSwitchId,
        transactionPicking,
        quantityPicked,
        quantitySwitch,
        isSamePallet,
      );
    }

    return this.repository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);

    // Get transaction picking to retrieve item details
    const transactionPicking = await this.transactionPickingService.findOne(existing.transaction_picking_id);

    // Use item_id, uom, week_number from existing or transaction_picking
    const itemId = existing.item_id || transactionPicking.item_id;
    const uom = existing.uom || transactionPicking.uom;
    const weekNumber = existing.week_number ?? transactionPicking.week_number;
    const outboundDoId = transactionPicking.do_id;

    if (!itemId) {
      throw new BadRequestException('item_id is required to revert pallet operations');
    }

    // Get user_id from existing (if stored)
    const userId = (existing as any).user_id;

    // Revert all pallet operations
    await this.revertPalletOperations(existing, itemId, uom, weekNumber, existing.transaction_picking_id, outboundDoId, userId);

    // Remove the transaction scan picking record
    await this.repository.remove(id);
  }

  async inspectionApproved(id: string, inspection_by: string): Promise<ScanPickingTransaction> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Transaction scan picking tidak ditemukan');
    }
    return this.repository.update(id, { status: ScanPickingStatus.INSPECTION_APPROVED, inspection_by: inspection_by });
  }
  
  private async revertPalletOperations(
    existing: ScanPickingTransaction,
    itemId: string,
    uom: string | undefined,
    weekNumber: number | undefined,
    transactionPickingId: string,
    outboundDoId: string | undefined,
    userId?: string | undefined,
  ): Promise<void> {
    // Get transaction picking for warehouse info
    const transactionPicking = await this.transactionPickingService.findOne(transactionPickingId);
    
    // Check if source and use pallets were the same
    const wasSamePallet = Boolean(existing.pallet_source_id && existing.pallet_use_id && existing.pallet_source_id === existing.pallet_use_id);

    // Get production_date from switch pallet or use pallet (where items were moved to)
    let productionDate: Date | undefined;
    const sourcePalletId = existing.pallet_switch_id || existing.pallet_use_id || existing.pallet_source_id;
    if (sourcePalletId && itemId) {
      try {
        const palletItems = await this.masterPalletService.getPalletItemLatestQuantity(sourcePalletId);
        const sourceItem = palletItems.find(
          (item) => item.item_id === itemId && (!uom || item.uom === uom),
        );
        if (sourceItem?.production_date) {
          productionDate = sourceItem.production_date;
        }
      } catch (error) {
        // If we can't get production_date, continue without it
        console.warn(`Could not get production_date from pallet ${sourcePalletId} for revert:`, error);
      }
    }

    // Always revert PICK operation: Add back the picked quantity to source pallet
    if (existing.pallet_source_id && existing.quantity_picked > 0) {
      await this.masterPalletService.updateQuantity(existing.pallet_source_id, {
        item_id: itemId,
        quantity: existing.quantity_picked,
        operation_type: QuantityOperationType.ADD,
        uom: uom,
        week_number: weekNumber,
        production_date: productionDate,
        outbound_do_id: outboundDoId,
        user_id: userId,
        reference_id: transactionPickingId,
        reference_type: 'TRANSACTION_SCAN_PICKING',
        notes: `Reverted: Added back ${existing.quantity_picked} to source pallet`,
      });
    }

    // Revert switch pallet: Remove the switched quantity (reverse ADD)
    const quantitySwitch = existing.quantity_switch || 0;
    if (existing.pallet_switch_id && quantitySwitch > 0) {
      await this.masterPalletService.updateQuantity(existing.pallet_switch_id, {
        item_id: itemId,
        quantity: quantitySwitch,
        operation_type: QuantityOperationType.REMOVE,
        uom: uom,
        week_number: weekNumber,
        production_date: productionDate,
        outbound_do_id: outboundDoId,
        user_id: userId,
        reference_id: transactionPickingId,
        reference_type: 'TRANSACTION_SCAN_PICKING',
        notes: `Reverted: Removed ${quantitySwitch} from switch pallet`,
      });
    }

    // Revert use pallet operations
    if (existing.pallet_use_id && existing.quantity_picked > 0) {
      if (wasSamePallet) {
        // If source and use were the same pallet, remove the remaining quantity that was added back
        const quantitySwitch = existing.quantity_switch || 0;
        const remainingQuantity = existing.quantity_picked - quantitySwitch;
        if (remainingQuantity > 0) {
          await this.masterPalletService.updateQuantity(existing.pallet_use_id, {
            item_id: itemId,
            quantity: remainingQuantity,
            operation_type: QuantityOperationType.REMOVE,
            uom: uom,
            week_number: weekNumber,
            production_date: productionDate,
            outbound_do_id: outboundDoId,
            user_id: userId,
            reference_id: transactionPickingId,
            reference_type: 'TRANSACTION_SCAN_PICKING',
            notes: `Reverted: Removed ${remainingQuantity} from same pallet (remaining after switch)`,
          });
        }
      } else {
        // If use pallet was different from source, remove the full quantity_picked
        await this.masterPalletService.updateQuantity(existing.pallet_use_id, {
          item_id: itemId,
          quantity: existing.quantity_picked,
          operation_type: QuantityOperationType.REMOVE,
          uom: uom,
          week_number: weekNumber,
          production_date: productionDate,
          outbound_do_id: outboundDoId,
          user_id: userId,
          reference_id: transactionPickingId,
          reference_type: 'TRANSACTION_SCAN_PICKING',
          notes: `Reverted: Removed ${existing.quantity_picked} from destination pallet`,
        });
      }
    }

    // Revert inventory tracking
    await this.revertInventoryTrackingForPallets(existing, transactionPicking, wasSamePallet);
  }

  private async moveInventoryTrackingForPallets(
    palletSourceId: string | undefined,
    palletUseId: string | undefined,
    palletSwitchId: string | undefined,
    transactionPicking: any,
    quantityPicked: number,
    quantitySwitch: number,
    isSamePallet: boolean,
  ): Promise<void> {
    try {
      // Get destination warehouse info from transaction picking
      let destinationWarehouseSubId = transactionPicking.destination_warehouse_sub_id;
      const destinationBinId = transactionPicking.destination_bin_id;
      let destinationWarehouseId: string | undefined;

      if (destinationBinId) {
        const warehouseBin = await this.masterWarehouseBinService.findOne(destinationBinId);
        if (warehouseBin?.warehouse_sub_id) {
          // Use warehouse_sub_id from bin if available
          destinationWarehouseSubId = warehouseBin.warehouse_sub_id;
        }
      }
      
      // Get warehouse_id from warehouse_sub if we have warehouse_sub_id
      if (destinationWarehouseSubId && !destinationWarehouseId) {
        // Try to get from transaction picking's destination warehouse sub relation
        // The transactionPicking should already have relations loaded, but if not, fetch it again
        let pickingWithRelations = transactionPicking;
        if (!transactionPicking.destinationWarehouseSub) {
          pickingWithRelations = await this.transactionPickingService.findOne(transactionPicking.id);
        }
        if (pickingWithRelations?.destinationWarehouseSub?.warehouse_id) {
          destinationWarehouseId = pickingWithRelations.destinationWarehouseSub.warehouse_id;
        } else if (destinationWarehouseSubId) {
          // If relation is not loaded, try to get warehouse_id directly from warehouse_sub entity
          // We can use the warehouse_sub_id to query the warehouse_sub directly if needed
          // For now, we'll log a warning and continue
          console.warn(`Could not get warehouse_id for destination_warehouse_sub_id: ${destinationWarehouseSubId}`);
        }
      }

      // Move inventory tracking to destination location
      // If same pallet, move source pallet to destination. If different, move use pallet to destination.
      if (palletUseId && quantityPicked > 0 && destinationWarehouseSubId && destinationWarehouseId) {
        const targetPalletId = isSamePallet ? palletSourceId : palletUseId;
        
        if (!targetPalletId) {
          return;
        }
        
        try {
          // Check if target pallet already has inventory tracking
          let targetPalletTracking;
          try {
            targetPalletTracking = await this.inventoryTrackingService.findOneByPalletId(targetPalletId);
          } catch (error) {
            // If not found, we'll create a new one
            if (!(error instanceof NotFoundException)) {
              throw error;
            }
            targetPalletTracking = null;
          }
          
          if (targetPalletTracking) {
            // Update existing tracking to destination location
            // Always set status to 'PICKED' for pallet use when moved to destination
            await this.inventoryTrackingService.update(targetPalletTracking.id, {
              warehouse_sub_id: destinationWarehouseSubId,
              warehouse_bin_id: destinationBinId,
              warehouse_id: destinationWarehouseId,
              progression_status: ProgressionStatus.COMPLETED,
              inventory_status: 'PICKED',
              inventory_note: isSamePallet 
                ? `Picked ${quantityPicked} and moved to destination via transaction scan picking`
                : `Picked ${quantityPicked} from source pallet and moved to destination via transaction scan picking`,
              inventory_date: new Date(),
            });
          } else {
            // Create new tracking for target pallet at destination location
            // Always set status to 'PICKED' for pallet use when moved to destination
            await this.inventoryTrackingService.createOrUpdateInventoryTracking(
              targetPalletId,
              destinationWarehouseSubId,
              destinationWarehouseId,
              'PICKED',
              ProgressionStatus.COMPLETED,
            );
            
            // Update bin if provided
            if (destinationBinId) {
              const tracking = await this.inventoryTrackingService.findOneByPalletId(targetPalletId);
              if (tracking) {
                await this.inventoryTrackingService.update(tracking.id, {
                  warehouse_bin_id: destinationBinId,
                });
              }
            }
          }
        } catch (error) {
          // Log error but don't fail the operation
          console.error(`Failed to move inventory tracking to destination for pallet ${targetPalletId}:`, error);
        }
      }

      // Move inventory tracking to switch pallet if provided
      if (palletSwitchId && quantitySwitch > 0) {
        try {
          // Get source pallet location for new inventory tracking if needed
          let sourceWarehouseSubId: string | undefined;
          let sourceBinId: string | undefined;
          let sourceWarehouseId: string | undefined;

          if (palletSourceId) {
            try {
              const sourceTracking = await this.inventoryTrackingService.findOneByPalletId(palletSourceId);
              if (sourceTracking) {
                sourceWarehouseSubId = sourceTracking.warehouse_sub_id;
                sourceBinId = sourceTracking.warehouse_bin_id;
                sourceWarehouseId = sourceTracking.warehouse_id;
              }
            } catch (error) {
              // If source pallet doesn't have tracking, use destination location
              if (error instanceof NotFoundException) {
                sourceWarehouseSubId = destinationWarehouseSubId;
                sourceBinId = destinationBinId;
                sourceWarehouseId = destinationWarehouseId;
              } else {
                throw error;
              }
            }
          }

          // Use source location if available, otherwise use destination location
          const finalWarehouseSubId = sourceWarehouseSubId || destinationWarehouseSubId;
          const finalBinId = sourceBinId || destinationBinId;
          const finalWarehouseId = sourceWarehouseId || destinationWarehouseId;

          if (!finalWarehouseSubId || !finalWarehouseId) {
            console.warn(`Cannot create inventory tracking for switch pallet ${palletSwitchId}: missing warehouse information`);
            return;
          }

          // Check if switch pallet already has inventory tracking
          let switchPalletTracking;
          try {
            switchPalletTracking = await this.inventoryTrackingService.findOneByPalletId(palletSwitchId);
          } catch (error) {
            // If not found, we'll create a new one
            if (!(error instanceof NotFoundException)) {
              throw error;
            }
            switchPalletTracking = null;
          }
          
          if (switchPalletTracking) {
            // Update existing tracking
            await this.inventoryTrackingService.update(switchPalletTracking.id, {
              warehouse_sub_id: finalWarehouseSubId,
              warehouse_bin_id: finalBinId,
              warehouse_id: finalWarehouseId,
              inventory_status: 'IN_INVENTORY',
              inventory_note: `Switched ${quantitySwitch} from source pallet via transaction scan picking`,
              inventory_date: new Date(),
              progression_status: ProgressionStatus.COMPLETED,
            });
          } else {
            // Create new tracking for switch pallet using source pallet location
            await this.inventoryTrackingService.createOrUpdateInventoryTracking(
              palletSwitchId,
              finalWarehouseSubId,
              finalWarehouseId,
              'IN_INVENTORY',
              ProgressionStatus.COMPLETED,
            );
            
            // Update bin if provided
            if (finalBinId) {
              const tracking = await this.inventoryTrackingService.findOneByPalletId(palletSwitchId);
              if (tracking) {
                await this.inventoryTrackingService.update(tracking.id, {
                  warehouse_bin_id: finalBinId,
                  progression_status: ProgressionStatus.COMPLETED,
                });
              }
            }
          }
        } catch (error) {
          // Log error but don't fail the operation
          console.error(`Failed to move inventory tracking to switch pallet ${palletSwitchId}:`, error);
        }
      }
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Error moving inventory tracking for pallets:', error);
    }
  }

  private async revertInventoryTrackingForPallets(
    existing: ScanPickingTransaction,
    transactionPicking: any,
    wasSamePallet: boolean,
  ): Promise<void> {
    try {
    // Get source warehouse info from transaction picking
    let sourceWarehouseSubId = transactionPicking.source_warehouse_sub_id;
    const sourceBinId = transactionPicking.source_bin_id;
    let sourceWarehouseId: string | undefined;

    if (sourceBinId) {
      const warehouseBin = await this.masterWarehouseBinService.findOne(sourceBinId);
      if (warehouseBin?.warehouse_sub_id) {
        // Use warehouse_sub_id from bin if available
        sourceWarehouseSubId = warehouseBin.warehouse_sub_id;
      }
    }
    
    // Get warehouse_id from warehouse_sub if we have warehouse_sub_id
    if (sourceWarehouseSubId && !sourceWarehouseId) {
      // Try to get from transaction picking's source warehouse sub relation
      const pickingWithRelations = await this.transactionPickingService.findOne(transactionPicking.id);
      if (pickingWithRelations?.sourceWarehouseSub?.warehouse_id) {
        sourceWarehouseId = pickingWithRelations.sourceWarehouseSub.warehouse_id;
      }
    }

    const fallbackSourceLocation = {
      warehouse_sub_id: sourceWarehouseSubId,
      warehouse_bin_id: sourceBinId,
      warehouse_id: sourceWarehouseId,
    };

    const sourcePrevLocation = await this.getPreviousInventoryLocation(existing.pallet_source_id);
    const usePrevLocation = await this.getPreviousInventoryLocation(existing.pallet_use_id);
    const switchPrevLocation = await this.getPreviousInventoryLocation(existing.pallet_switch_id);

      // Revert source pallet inventory tracking status back to IN_INVENTORY if it exists
      if (existing.pallet_source_id && existing.quantity_picked > 0) {
        try {
          const sourceTracking = await this.inventoryTrackingService.findOneByPalletId(existing.pallet_source_id);
          if (sourceTracking) {
          const locationToRestore = sourcePrevLocation ?? fallbackSourceLocation;
            await this.inventoryTrackingService.update(sourceTracking.id, {
            warehouse_sub_id: locationToRestore?.warehouse_sub_id ?? sourceTracking.warehouse_sub_id,
            warehouse_bin_id: locationToRestore?.warehouse_bin_id ?? sourceTracking.warehouse_bin_id,
            warehouse_id: locationToRestore?.warehouse_id ?? sourceTracking.warehouse_id,
              inventory_status: 'IN_INVENTORY',
              inventory_note: `Reverted: Restored from transaction scan picking`,
              inventory_date: new Date(),
            });
          }
        } catch (error) {
          if (!(error instanceof NotFoundException)) {
            throw error;
          }
        }
      }

      // Revert use pallet inventory tracking (remove or move back to source)
      if (existing.pallet_use_id && existing.quantity_picked > 0 && !wasSamePallet) {
        try {
          const usePalletTracking = await this.inventoryTrackingService.findOneByPalletId(existing.pallet_use_id);
          if (usePalletTracking) {
            const locationToRestore = usePrevLocation ?? fallbackSourceLocation;
            await this.inventoryTrackingService.update(usePalletTracking.id, {
              warehouse_sub_id: locationToRestore?.warehouse_sub_id ?? usePalletTracking.warehouse_sub_id,
              warehouse_bin_id: locationToRestore?.warehouse_bin_id ?? usePalletTracking.warehouse_bin_id,
              warehouse_id: locationToRestore?.warehouse_id ?? usePalletTracking.warehouse_id,
              inventory_status: 'IN_INVENTORY',
              inventory_note: locationToRestore
                ? `Reverted: Moved back to previous location`
                : `Reverted: Transaction scan picking reverted`,
              inventory_date: new Date(),
              progression_status: ProgressionStatus.COMPLETED,
            });
          }
        } catch (error) {
          if (!(error instanceof NotFoundException)) {
            console.error(`Failed to revert inventory tracking for use pallet ${existing.pallet_use_id}:`, error);
          }
        }
      }

      // Revert switch pallet inventory tracking
      if (existing.pallet_switch_id && existing.quantity_switch && existing.quantity_switch > 0) {
        try {
          const switchPalletTracking = await this.inventoryTrackingService.findOneByPalletId(existing.pallet_switch_id);
          if (switchPalletTracking) {
            const locationToRestore = switchPrevLocation ?? fallbackSourceLocation;
            await this.inventoryTrackingService.update(switchPalletTracking.id, {
              warehouse_sub_id: locationToRestore?.warehouse_sub_id ?? switchPalletTracking.warehouse_sub_id,
              warehouse_bin_id: locationToRestore?.warehouse_bin_id ?? switchPalletTracking.warehouse_bin_id,
              warehouse_id: locationToRestore?.warehouse_id ?? switchPalletTracking.warehouse_id,
              inventory_status: 'IN_INVENTORY',
              inventory_note: locationToRestore
                ? `Reverted: Moved back to previous location`
                : `Reverted: Transaction scan picking reverted`,
              inventory_date: new Date(),
              progression_status: ProgressionStatus.COMPLETED,
            });
          }
        } catch (error) {
          if (!(error instanceof NotFoundException)) {
            console.error(`Failed to revert inventory tracking for switch pallet ${existing.pallet_switch_id}:`, error);
          }
        }
      }
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Error reverting inventory tracking for pallets:', error);
    }
  }

  private async getPalletItemProductionDate(
    palletId: string,
    itemId: string,
    uom?: string,
  ): Promise<Date | undefined> {
    try {
      const palletItems = await this.masterPalletService.getPalletItemLatestQuantity(palletId);
      const sourceItem = palletItems.find(
        (item) => item.item_id === itemId && (!uom || item.uom === uom),
      );
      return sourceItem?.production_date ?? undefined;
    } catch (error) {
      console.warn(`Could not get production_date from pallet ${palletId}:`, error);
      return undefined;
    }
  }

  private async getPreviousInventoryLocation(
    palletId?: string,
  ): Promise<{ warehouse_sub_id?: string; warehouse_bin_id?: string; warehouse_id?: string } | null> {
    if (!palletId) {
      return null;
    }

    try {
      const history = await this.inventoryTrackingService.findHistoryByPalletId(palletId);
      if (!history || history.length < 2) {
        return null;
      }

      const previousEntry = history[1];
      return {
        warehouse_sub_id: previousEntry.warehouse_sub_id,
        warehouse_bin_id: previousEntry.warehouse_bin_id,
        warehouse_id: previousEntry.warehouse_id,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }
      console.error(`Failed to get previous inventory location for pallet ${palletId}:`, error);
      return null;
    }
  }

  private async validatePallets(palletIds: Array<string | undefined>): Promise<void> {
    const uniqueIds = Array.from(new Set(palletIds.filter((id): id is string => Boolean(id))));
    await Promise.all(uniqueIds.map((id) => this.masterPalletService.findOne(id)));
  }

  private async validateQuantities(quantityPicked: number, quantitySwitch?: number): Promise<void> {
    if (quantityPicked === undefined || quantityPicked === null) {
      throw new BadRequestException('quantity_picked wajib diisi');
    }

    if (quantityPicked <= 0) {
      throw new BadRequestException('quantity_picked harus lebih dari 0');
    }

    if (quantitySwitch !== undefined && quantitySwitch < 0) {
      throw new BadRequestException('quantity_switch tidak boleh bernilai negatif');
    }
  }

  async updateManyStatusTo(
    transactionPickingId: string,
    status: ScanPickingStatus,
    inspection_by?: string,
  ): Promise<ScanPickingTransaction[]> {
    const updatedScans: ScanPickingTransaction[] = [];

    // Update associated scan picking transactions to the specified status
    const scanTransactions = await this.repository.findAll({
      transactionPickingId: transactionPickingId,
    });
    
    if (scanTransactions.length === 0) {
      throw new NotFoundException('Transaction scan picking tidak ditemukan untuk memo ini');
    }

    for (const scan of scanTransactions) {
      if (scan.status === status) {
        updatedScans.push(scan);
        continue;
      }

      const updateData: UpdateTransactionScanPickingDto = {
        status: status,
      };

      // Include inspection_by when status is INSPECTION_APPROVED
      if (status === ScanPickingStatus.INSPECTION_APPROVED && inspection_by) {
        updateData.inspection_by = inspection_by;
      }

      const updated = await this.repository.update(scan.id, updateData);

      updatedScans.push(updated);
    }

    return updatedScans;
  }

  async updateManyStatus(dto: UpdateStatusDto): Promise<ScanPickingTransaction[]> {
    const updatedScans: ScanPickingTransaction[] = [];
    for (const transactionScanPickingId of dto.ids) {
      const updated = await this.repository.update(transactionScanPickingId, { status: dto.status });
      if (dto.status === ScanPickingStatus.INSPECTION_APPROVED && dto.inspection_by) {
        updated.inspection_by = dto.inspection_by;
      }
      updatedScans.push(updated);
    }
    return updatedScans;
  }
}
