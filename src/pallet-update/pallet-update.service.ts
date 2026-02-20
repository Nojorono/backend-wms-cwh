import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PalletUpdateRepository } from './pallet-update.repository';
import { CreateMergePalletDto } from './dto/create-merge-pallet.dto';
import { CreateSplitPalletDto } from './dto/create-split-pallet.dto';
import { PalletUpdate } from '../core/domain/entities/pallet-update.entity';
import {
  PalletUpdateType,
  PalletUpdateStatus,
  InspectionStatus,
} from '../core/domain/entities/pallet-update.entity';
import { PalletUpdateItem } from '../core/domain/entities/pallet-update-item.entity';
import { PalletUpdateScan } from '../core/domain/entities/pallet-update-scan.entity';
import { PalletUpdateAssigned } from '../core/domain/entities/pallet-update-assigned.entity';
import { PalletUpdatePaginationQueryDto } from './dto/pallet-update-pagination.dto';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { PaginationService } from '../core/services/pagination.service';
import { PalletUpdateResponseDto } from './dto/pallet-update-response.dto';
import { CreatePalletUpdateScanDto } from './dto/create-pallet-update-scan.dto';
import { CreatePalletUpdateItemDto } from './dto/create-pallet-update-item.dto';
import { UpdatePalletUpdateScanDto } from './dto/update-pallet-update-scan.dto';
import { PalletUpdateScanResponseDto } from './dto/pallet-update-scan-response.dto';
import { InventoryTrackingService } from 'src/inventory-tracking/inventory-tracking.service';
import { MasterPalletService } from 'src/master-pallet/master-pallet.service';
import { QuantityOperationType, StatusInventory } from 'src/core/domain/entities/transaction-pallet-history.entity';
import { ProgressionStatus } from 'src/core/domain/entities/inventory-tracking.entity';
import { CreatePalletUpdateDto } from './dto/create-pallet-update.dto';

@Injectable()
export class PalletUpdateService {
  private readonly logger = new Logger(PalletUpdateService.name);

  constructor(
    private readonly repository: PalletUpdateRepository,
    private readonly dataSource: DataSource,
    private readonly paginationService: PaginationService,
    private readonly inventoryTrackingService: InventoryTrackingService,
    private readonly masterPalletService: MasterPalletService,
  ) { }

  async updateStatusScanDone(palletUpdateId: string): Promise<PalletUpdate | null> {
    return await this.dataSource.transaction(async (manager) => {
      const updated = await manager.update(PalletUpdate, palletUpdateId, { status: PalletUpdateStatus.PENDING_INSPECTION });
      if (updated.affected === 0) {
        throw new NotFoundException(`Pallet update with ID ${palletUpdateId} not found`);
      }
      return await manager.getRepository(PalletUpdate).findOne({ where: { id: palletUpdateId } });
    });
  }

  // validation in scan and pallet item exist not completed
  async validateScanAndPalletItem(scans: PalletUpdateScan[], items: PalletUpdateItem[]): Promise<void> {
    for (const scan of scans) {
      const result = await this.repository.findByPalletIdScan(scan.palletId);
      const pallet = await this.masterPalletService.findOne(scan.palletId);
      if (result.length > 0) {
        throw new BadRequestException(`Scan Pallet ${pallet?.pallet_code} PENDING in PALLET UPDATE ${result[0].palletUpdate?.updateNumber}`);
      }
    }
    for (const item of items) {
      const result = await this.repository.findByPalletIdItem(item.palletId);
      const pallet = await this.masterPalletService.findOne(item.palletId);
      if (result.length > 0) {
        throw new BadRequestException(`Item Pallet ${pallet?.pallet_code} PENDING in PALLET UPDATE ${result[0].palletUpdate?.updateNumber}`);
      }
    }
  }

  async deletePalletUpdate(id: string): Promise<void> {
    const palletUpdate = await this.repository.findOne(id);
    if (!palletUpdate) {
      throw new NotFoundException(`Pallet update with ID ${id} not found`);
    }
    await this.repository.deletePalletUpdate(id);
  }

  /**
   * Approve inspection for a SPLIT_PALLET update: apply quantity splits on source pallet,
   * add quantities to destination pallets (scans), move destination inventory to source location, then mark approved.
   */
  async approveInspectionSplitPallet(palletUpdateId: string, inspectionByUserId: string): Promise<PalletUpdate> {
    const palletUpdate = await this.repository.findOne(palletUpdateId);
    if (!palletUpdate) {
      throw new NotFoundException(`Pallet update with ID ${palletUpdateId} not found`);
    }

    if (palletUpdate.updateType !== PalletUpdateType.SPLIT_PALLET) {
      throw new BadRequestException(
        `Pallet update ${palletUpdateId} is not a SPLIT_PALLET (current type: ${palletUpdate.updateType})`,
      );
    }

    if (palletUpdate.inspectionStatus !== InspectionStatus.PENDING) {
      throw new BadRequestException(
        `Pallet update ${palletUpdateId} is not pending inspection (current: ${palletUpdate.inspectionStatus})`,
      );
    }

    const splitItems = palletUpdate.items ?? [];
    const destinationPallets = palletUpdate.scans ?? [];

    if (splitItems.length === 0) {
      throw new BadRequestException(
        `Pallet update ${palletUpdateId} has no source items (split requires at least one item)`,
      );
    }

    if (destinationPallets.length === 0) {
      throw new BadRequestException(
        `Pallet update ${palletUpdateId} has no destination scans (split requires at least one scan)`,
      );
    }

    const sourcePalletId = splitItems[0].palletId;
    if (!sourcePalletId) {
      throw new BadRequestException(
        `Pallet update ${palletUpdateId}: source item has no palletId`,
      );
    }

    const sourceLocation = await this.inventoryTrackingService.findOneByPalletId(sourcePalletId);
    const warehouseId = (sourceLocation as { warehouse_id?: string; warehouse?: { id: string } }).warehouse_id
      ?? (sourceLocation as { warehouse?: { id: string } }).warehouse?.id;
    const warehouseSubId = (sourceLocation as { warehouse_sub_id?: string; warehouseSub?: { id: string } }).warehouse_sub_id
      ?? (sourceLocation as { warehouseSub?: { id: string } }).warehouseSub?.id;
    const warehouseBinId = (sourceLocation as { warehouse_bin_id?: string; warehouseBin?: { id: string } }).warehouse_bin_id
      ?? (sourceLocation as { warehouseBin?: { id: string } }).warehouseBin?.id;

    if (!warehouseId || !warehouseSubId || !warehouseBinId) {
      throw new BadRequestException(
        `Source pallet ${sourcePalletId} has no valid warehouse location (warehouse/sub/bin)`,
      );
    }

    let splitItemsProcessed = 0;
    let destinationPalletsProcessed = 0;

    try {
      for (const splitItem of splitItems) {
        if (!splitItem.palletId || !splitItem.itemId) {
          throw new BadRequestException(
            `Pallet update ${palletUpdateId}: split item missing palletId or itemId`,
          );
        }
        await this.masterPalletService.updateQuantity(splitItem.palletId, {
          item_id: splitItem.itemId,
          reference_id: palletUpdateId,
          reference_type: 'PALLET_UPDATE_SPLIT',
          notes: 'Split pallet from pallet update',
          user_id: palletUpdate.initiatedByUserId,
          uom: splitItem.uom ?? undefined,
          production_date: splitItem.productionDate ?? undefined,
          operation_type: QuantityOperationType.SPLIT,
          quantity: splitItem.quantity ?? 0,
          week_number: splitItem.weekNumber ?? 0,
          status_inventory: StatusInventory.READY,
        });
        splitItemsProcessed++;
      }

      for (const destinationPallet of destinationPallets) {
        if (!destinationPallet.palletId || !destinationPallet.itemId) {
          throw new BadRequestException(
            `Pallet update ${palletUpdateId}: destination scan missing palletId or itemId`,
          );
        }
        await this.masterPalletService.updateQuantity(destinationPallet.palletId, {
          item_id: destinationPallet.itemId,
          reference_id: palletUpdateId,
          reference_type: 'PALLET_UPDATE_SPLIT',
          notes: 'Split pallet from pallet update',
          user_id: palletUpdate.initiatedByUserId,
          uom: destinationPallet.uom ?? undefined,
          production_date: destinationPallet.productionDate ?? undefined,
          operation_type: QuantityOperationType.ADD,
          quantity: destinationPallet.quantity ?? 0,
          week_number: destinationPallet.weekNumber ?? 0,
          status_inventory: StatusInventory.READY,
        });

        await this.inventoryTrackingService.updateByPalletIdOrCreate(destinationPallet.palletId, {
          warehouse_bin_id: warehouseBinId,
          warehouse_sub_id: warehouseSubId,
          warehouse_id: warehouseId,
          inventory_status: 'IN_INVENTORY',
          progression_status: ProgressionStatus.COMPLETED,
          inventory_note: 'Split pallet from pallet update',
          inventory_date: new Date(),
        });
        destinationPalletsProcessed++;
      }

      const updated = await this.dataSource.transaction(async (manager) => {
        await manager.update(PalletUpdate, palletUpdateId, {
          inspectionStatus: InspectionStatus.APPROVED,
          status: PalletUpdateStatus.APPROVED,
          completedDate: new Date(),
          inspectionByUserId: inspectionByUserId,
        });
        return manager.getRepository(PalletUpdate).findOne({
          where: { id: palletUpdateId },
          relations: ['items', 'scans', 'assigned', 'initiatedByUser', 'inspectionByUser'],
        });
      });

      if (!updated) {
        throw new NotFoundException(`Pallet update with ID ${palletUpdateId} not found after approval`);
      }
      this.logger.log(`Split pallet approval completed for pallet update ${palletUpdateId}`);
      return updated;
    } catch (err) {
      if (splitItemsProcessed > 0 || destinationPalletsProcessed > 0) {
        this.logger.warn(
          `Rolling back split approval for pallet update ${palletUpdateId}: ` +
          `${splitItemsProcessed} source item(s) and ${destinationPalletsProcessed} destination pallet(s) had been updated`,
        );
        try {
          for (let i = splitItemsProcessed - 1; i >= 0; i--) {
            const splitItem = splitItems[i];
            await this.masterPalletService.updateQuantity(splitItem.palletId, {
              item_id: splitItem.itemId,
              reference_id: palletUpdateId,
              reference_type: 'PALLET_UPDATE_SPLIT_ROLLBACK',
              notes: 'Rollback split pallet from pallet update',
              user_id: palletUpdate.initiatedByUserId,
              uom: splitItem.uom ?? undefined,
              production_date: splitItem.productionDate ?? undefined,
              operation_type: QuantityOperationType.ADD,
              quantity: splitItem.quantity ?? 0,
              week_number: splitItem.weekNumber ?? 0,
            });
          }
          for (let i = destinationPalletsProcessed - 1; i >= 0; i--) {
            const dp = destinationPallets[i];
            await this.masterPalletService.updateQuantity(dp.palletId, {
              item_id: dp.itemId,
              reference_id: palletUpdateId,
              reference_type: 'PALLET_UPDATE_SPLIT_ROLLBACK',
              notes: 'Rollback split pallet from pallet update',
              user_id: palletUpdate.initiatedByUserId,
              uom: dp.uom ?? undefined,
              production_date: dp.productionDate ?? undefined,
              operation_type: QuantityOperationType.REMOVE,
              quantity: dp.quantity ?? 0,
              week_number: dp.weekNumber ?? 0,
            });
          }
          this.logger.log(`Rollback completed for pallet update ${palletUpdateId}`);
        } catch (rollbackErr) {
          this.logger.error(
            `Rollback failed for pallet update ${palletUpdateId}: ${rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr)}`,
          );
          throw err;
        }
      }
      throw err;
    }
  }

  async approveInspectionMergePallet(palletUpdateId: string, inspectionByUserId: string): Promise<PalletUpdate> {
    const palletUpdate = await this.repository.findOne(palletUpdateId);
    if (!palletUpdate) {
      throw new NotFoundException(`Pallet update with ID ${palletUpdateId} not found`);
    }

    if (palletUpdate.updateType !== PalletUpdateType.MERGE_PALLET) {
      throw new BadRequestException(
        `Pallet update ${palletUpdateId} is not a MERGE_PALLET (current type: ${palletUpdate.updateType})`,
      );
    }

    if (palletUpdate.inspectionStatus !== InspectionStatus.PENDING) {
      throw new BadRequestException(
        `Pallet update ${palletUpdateId} is not pending inspection (current: ${palletUpdate.inspectionStatus})`,
      );
    }

    const mergeItems = palletUpdate.items ?? [];
    const destinationPallets = palletUpdate.scans ?? [];

    if (mergeItems.length === 0) {
      throw new BadRequestException(
        `Pallet update ${palletUpdateId} has no source items (merge requires at least one item)`,
      );
    }

    if (destinationPallets.length === 0) {
      throw new BadRequestException(
        `Pallet update ${palletUpdateId} has no destination scans (merge requires at least one scan)`,
      );
    }

    let referenceLocation: { warehouseId: string; warehouseSubId: string; warehouseBinId: string } | null = null;

    for (const item of mergeItems) {
      const pallet = await this.masterPalletService.findOne(item.palletId);
      const currentQuantity = pallet.currentQuantity ?? 0;
      if (currentQuantity === 0) {
        continue;
      }

      const sourceLocation = await this.inventoryTrackingService.findOneByPalletId(item.palletId);
      if (!sourceLocation) {
        continue;
      }
      const warehouseId = (sourceLocation as { warehouse_id?: string; warehouse?: { id: string } }).warehouse_id
        ?? (sourceLocation as { warehouse?: { id: string } }).warehouse?.id;
      const warehouseSubId = (sourceLocation as { warehouse_sub_id?: string; warehouseSub?: { id: string } }).warehouse_sub_id
        ?? (sourceLocation as { warehouseSub?: { id: string } }).warehouseSub?.id;
      const warehouseBinId = (sourceLocation as { warehouse_bin_id?: string; warehouseBin?: { id: string } }).warehouse_bin_id
        ?? (sourceLocation as { warehouseBin?: { id: string } }).warehouseBin?.id;

      if (!warehouseId || !warehouseSubId || !warehouseBinId) {
        continue;
      }

      if (referenceLocation === null) {
        referenceLocation = { warehouseId, warehouseSubId, warehouseBinId };
        continue;
      }

      if (
        referenceLocation.warehouseId !== warehouseId
        || referenceLocation.warehouseSubId !== warehouseSubId
        || referenceLocation.warehouseBinId !== warehouseBinId
      ) {
        throw new BadRequestException(
          `Source pallets must be in the same location (warehouse/sub/bin). Pallet ${item.palletId} is in a different location.`,
        );
      }
    }

    if (!referenceLocation) {
      throw new BadRequestException(
        `Pallet update ${palletUpdateId}: could not determine reference location from source pallets (ensure at least one source has quantity and valid warehouse location).`,
      );
    }

    let mergeItemsProcessed = 0;
    let destinationPalletsProcessed = 0;

    try {
      for (const mergeItem of mergeItems) {
        if (!mergeItem.palletId || !mergeItem.itemId) {
          throw new BadRequestException(
            `Pallet update ${palletUpdateId}: merge item missing palletId or itemId`,
          );
        }
        await this.masterPalletService.updateQuantity(mergeItem.palletId, {
          item_id: mergeItem.itemId,
          quantity: mergeItem.quantity ?? 0,
          operation_type: QuantityOperationType.REMOVE,
          reference_id: palletUpdateId,
          reference_type: 'PALLET_UPDATE_MERGE',
          notes: 'Merge pallet from pallet update',
          user_id: palletUpdate.initiatedByUserId,
          uom: mergeItem.uom ?? undefined,
          production_date: mergeItem.productionDate ?? undefined,
          week_number: mergeItem.weekNumber ?? undefined,
        });
        mergeItemsProcessed++;
      }

      for (const destinationPallet of destinationPallets) {
        if (!destinationPallet.palletId || !destinationPallet.itemId) {
          throw new BadRequestException(
            `Pallet update ${palletUpdateId}: destination scan missing palletId or itemId`,
          );
        }
        await this.masterPalletService.updateQuantity(destinationPallet.palletId, {
          item_id: destinationPallet.itemId,
          quantity: destinationPallet.quantity ?? 0,
          operation_type: QuantityOperationType.ADD,
          reference_id: palletUpdateId,
          reference_type: 'PALLET_UPDATE_MERGE',
          notes: 'Merge pallet from pallet update',
          user_id: palletUpdate.initiatedByUserId,
          uom: destinationPallet.uom ?? undefined,
          production_date: destinationPallet.productionDate ?? undefined,
          week_number: destinationPallet.weekNumber ?? undefined,
          status_inventory: StatusInventory.READY,
        });

        await this.inventoryTrackingService.updateByPalletIdOrCreate(destinationPallet.palletId, {
          warehouse_bin_id: referenceLocation.warehouseBinId,
          warehouse_sub_id: referenceLocation.warehouseSubId,
          warehouse_id: referenceLocation.warehouseId,
          inventory_status: 'IN_INVENTORY',
          progression_status: ProgressionStatus.COMPLETED,
          inventory_note: 'Merge pallet from pallet update',
          inventory_date: new Date(),
        });
        destinationPalletsProcessed++;
      }

      const updated = await this.dataSource.transaction(async (manager) => {
        await manager.update(PalletUpdate, palletUpdateId, {
          inspectionStatus: InspectionStatus.APPROVED,
          status: PalletUpdateStatus.APPROVED,
          completedDate: new Date(),
          inspectionByUserId,
        });
        return manager.getRepository(PalletUpdate).findOne({
          where: { id: palletUpdateId },
          relations: ['items', 'scans', 'assigned', 'initiatedByUser', 'inspectionByUser'],
        });
      });

      if (!updated) {
        throw new NotFoundException(`Pallet update with ID ${palletUpdateId} not found after approval`);
      }
      this.logger.log(`Merge pallet approval completed for pallet update ${palletUpdateId}`);
      return updated;
    } catch (err) {
      if (mergeItemsProcessed > 0 || destinationPalletsProcessed > 0) {
        this.logger.warn(
          `Rolling back merge approval for pallet update ${palletUpdateId}: ` +
          `${mergeItemsProcessed} source item(s) and ${destinationPalletsProcessed} destination pallet(s) had been updated`,
        );
        try {
          for (let i = mergeItemsProcessed - 1; i >= 0; i--) {
            const mergeItem = mergeItems[i];
            await this.masterPalletService.updateQuantity(mergeItem.palletId, {
              item_id: mergeItem.itemId,
              reference_id: palletUpdateId,
              reference_type: 'PALLET_UPDATE_MERGE_ROLLBACK',
              notes: 'Rollback merge pallet from pallet update',
              user_id: palletUpdate.initiatedByUserId,
              uom: mergeItem.uom ?? undefined,
              production_date: mergeItem.productionDate ?? undefined,
              operation_type: QuantityOperationType.ADD,
              quantity: mergeItem.quantity ?? 0,
              week_number: mergeItem.weekNumber ?? undefined,
            });
          }
          for (let i = destinationPalletsProcessed - 1; i >= 0; i--) {
            const dp = destinationPallets[i];
            await this.masterPalletService.updateQuantity(dp.palletId, {
              item_id: dp.itemId,
              reference_id: palletUpdateId,
              reference_type: 'PALLET_UPDATE_MERGE_ROLLBACK',
              notes: 'Rollback merge pallet from pallet update',
              user_id: palletUpdate.initiatedByUserId,
              uom: dp.uom ?? undefined,
              production_date: dp.productionDate ?? undefined,
              operation_type: QuantityOperationType.REMOVE,
              quantity: dp.quantity ?? 0,
              week_number: dp.weekNumber ?? undefined,
            });
          }
          this.logger.log(`Rollback completed for pallet update ${palletUpdateId}`);
        } catch (rollbackErr) {
          this.logger.error(
            `Rollback failed for pallet update ${palletUpdateId}: ${rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr)}`,
          );
          throw err;
        }
      }
      throw err;
    }
  }

  async createUpdate(createPalletUpdateDto: CreatePalletUpdateDto): Promise<PalletUpdate> {
    if (!createPalletUpdateDto.updateNumber) {
      createPalletUpdateDto.updateNumber = await this.repository.getNextUpdateNumber(
        createPalletUpdateDto.updateType,
      );
    }

    const itemBeforeUpdate = {
      ...createPalletUpdateDto.item,
      productionDate: createPalletUpdateDto.item.productionDate ?? '',
    };

    const scanAfterUpdate = {
      ...createPalletUpdateDto.scan,
      palletId: createPalletUpdateDto.scan.palletId ?? '',
      productionDate: createPalletUpdateDto.scan.productionDate ?? '',
    };

    // Validate that pallets are not already in pending state
    const itemsToValidate: PalletUpdateItem[] = [];
    const scansToValidate: PalletUpdateScan[] = [];

    if (itemBeforeUpdate.palletId) {
      itemsToValidate.push({ palletId: itemBeforeUpdate.palletId } as PalletUpdateItem);
    }

    if (scanAfterUpdate.palletId) {
      scansToValidate.push({ palletId: scanAfterUpdate.palletId } as PalletUpdateScan);
    }

    if (itemsToValidate.length > 0 || scansToValidate.length > 0) {
      await this.validateScanAndPalletItem(scansToValidate, itemsToValidate);
    }

    const palletUpdate = await this.repository.create(createPalletUpdateDto);
    // // if update productionCode, update the productionDate of the scan
    if (createPalletUpdateDto.productionCode) {
      scanAfterUpdate.productionDate = createPalletUpdateDto.productionCode;
      // masterpallet service update the productionDate of the scan
      await this.masterPalletService.updateProductionDate(scanAfterUpdate.palletId, {
        production_date_before: new Date(itemBeforeUpdate.productionDate),
        production_date_after: new Date(scanAfterUpdate.productionDate),
        week_number: scanAfterUpdate.weekNumber,
        item_id: scanAfterUpdate.itemId ?? '',
        reference_id: palletUpdate.id,
        reference_type: 'PALLET_UPDATE_PROD_DATE',
        user_id: palletUpdate.initiatedByUserId,
      });
    }

    if (createPalletUpdateDto.uom) {

      if (itemBeforeUpdate.uom === scanAfterUpdate.uom) {
        throw new BadRequestException('from_uom and to_uom must be different');
      }

      if (itemBeforeUpdate.quantity === 0) {
        throw new BadRequestException('itemBeforeUpdate quantity is 0');
      }

      if (scanAfterUpdate.quantity === 0) {
        throw new BadRequestException('scanAfterUpdate quantity is 0');
      }

      await this.masterPalletService.updateUOM(scanAfterUpdate.palletId, {
        item_id: scanAfterUpdate.itemId ?? '',
        from_uom: itemBeforeUpdate.uom ?? '',
        from_quantity: itemBeforeUpdate.quantity ?? 0,
        to_quantity: scanAfterUpdate.quantity ?? 0,
        to_uom: scanAfterUpdate.uom ?? '',
        reference_id: palletUpdate.id,
        reference_type: 'PALLET_UPDATE_UOM',
        user_id: palletUpdate.initiatedByUserId,
      });
    }

    return palletUpdate;
  }


  async createMergeOrSplit(
    createPalletUpdateDto: CreateMergePalletDto | CreateSplitPalletDto,
  ): Promise<PalletUpdate> {
    // Generate updateNumber if not provided
    // For SPLIT_PALLET and MERGE_PALLET, updateNumber is required (will be auto-generated if not provided)
    if (!createPalletUpdateDto.updateNumber) {
      createPalletUpdateDto.updateNumber = await this.repository.getNextUpdateNumber(
        createPalletUpdateDto.updateType,
      );
    } else {
      // Validate uniqueness if updateNumber is provided
      const existing = await this.repository.findOneByUpdateNumber(
        createPalletUpdateDto.updateNumber,
      );
      if (existing) {
        throw new ConflictException(
          `Update number ${createPalletUpdateDto.updateNumber} already exists`,
        );
      }
    }

    // Normalize items and scans before validation
    const itemsToValidate: CreatePalletUpdateItemDto[] =
      ('items' in createPalletUpdateDto && Array.isArray(createPalletUpdateDto.items) && createPalletUpdateDto.items.length > 0)
        ? createPalletUpdateDto.items
        : ('item' in createPalletUpdateDto && createPalletUpdateDto.item)
          ? [createPalletUpdateDto.item]
          : [];

    const scansToValidate: CreatePalletUpdateScanDto[] =
      ('scans' in createPalletUpdateDto && Array.isArray(createPalletUpdateDto.scans) && createPalletUpdateDto.scans.length > 0)
        ? createPalletUpdateDto.scans
        : [];

    // Validate that pallets are not already in pending state
    if (itemsToValidate.length > 0 || scansToValidate.length > 0) {
      // Convert DTOs to entity-like objects for validation (only need palletId)
      const itemsForValidation = itemsToValidate
        .filter(item => item.palletId)
        .map(item => ({ palletId: item.palletId } as PalletUpdateItem));

      const scansForValidation = scansToValidate
        .filter(scan => scan.palletId)
        .map(scan => ({ palletId: scan.palletId } as PalletUpdateScan));

      await this.validateScanAndPalletItem(scansForValidation, itemsForValidation);
    }

    return await this.dataSource.transaction(async (manager) => {
      const { items, item, assigned, ...palletUpdatePayload } =
        createPalletUpdateDto as CreateMergePalletDto & { item?: unknown };
      const palletUpdate = manager.create(PalletUpdate, {
        ...palletUpdatePayload,
        status: createPalletUpdateDto.status || PalletUpdateStatus.PENDING_ASSIGNMENT,
      });

      const savedPalletUpdate = await manager.save(PalletUpdate, palletUpdate);

      // Normalize items: split uses `item` (singular), merge uses `items` (array)
      const itemsToCreate = itemsToValidate;

      if (itemsToCreate.length > 0) {
        const items = itemsToCreate.map((item) =>
          manager.create(PalletUpdateItem, {
            ...item,
            palletUpdateId: savedPalletUpdate.id,
          }),
        );
        await manager.save(PalletUpdateItem, items);
      }

      if ('assigned' in createPalletUpdateDto && createPalletUpdateDto.assigned && createPalletUpdateDto.assigned.length > 0) {
        const assigned = createPalletUpdateDto.assigned.map((assign) =>
          manager.create(PalletUpdateAssigned, {
            userId: assign.userId,
            palletUpdate: savedPalletUpdate,
            assignedAt: assign.assignedAt ? new Date(assign.assignedAt) : new Date(),
          }),
        );
        await manager.save(PalletUpdateAssigned, assigned);
      }

      const result = await manager.getRepository(PalletUpdate).findOne({
        where: { id: savedPalletUpdate.id },
        relations: ['items', 'scans', 'assigned', 'initiatedByUser', 'inspectionByUser'],
      });
      if (!result) {
        throw new NotFoundException(
          `Failed to retrieve created pallet update with ID ${savedPalletUpdate.id}`,
        );
      }
      return result;
    });
  }

  /**
   * Generate unique update number based on updateType
   * Format: {PREFIX}-{YEAR}-{SEQUENCE}
   * - UPDATE_PROD_CODE_UOM: IPU-YYYY-XXXX
   * - SPLIT_PALLET: SPU-YYYY-XXXX
   * - MERGE_PALLET: MPU-YYYY-XXXX
   */
  async generateUpdateNumber(
    updateType: PalletUpdateType,
    year?: number,
  ): Promise<string> {
    return await this.repository.getNextUpdateNumber(updateType, year);
  }

  async findAll(updateType?: PalletUpdateType): Promise<PalletUpdate[]> {
    return await this.repository.findAll(updateType);
  }

  async findAllPaginated(
    paginationDto: PalletUpdatePaginationQueryDto,
    updateType?: PalletUpdateType,
  ): Promise<PaginatedResponseDto<PalletUpdateResponseDto>> {
    const filters = {
      updateType: updateType || paginationDto.updateType,
      status: paginationDto.status,
      search: paginationDto.search,
      page: paginationDto.page,
      limit: paginationDto.limit,
      sortBy: paginationDto.sortBy,
      sortOrder: paginationDto.sortOrder,
    };

    const { data, total } = await this.repository.findAllPaginated(filters);

    return this.paginationService.createPaginatedResponse(
      data.map(this.mapToResponseDto),
      paginationDto,
      total,
    );
  }

  private mapToResponseDto(palletUpdate: PalletUpdate): PalletUpdateResponseDto {
    return {
      id: palletUpdate.id,
      updateNumber: palletUpdate.updateNumber,
      updateType: palletUpdate.updateType,
      uom: palletUpdate.uom,
      productionCode: palletUpdate.productionCode,
      status: palletUpdate.status,
      initiatedByUserId: palletUpdate.initiatedByUserId,
      inspectionStatus: palletUpdate.inspectionStatus,
      inspectionByUserId: palletUpdate.inspectionByUserId,
      notes: palletUpdate.notes,
      completedDate: palletUpdate.completedDate,
      items: palletUpdate.items?.map((item) => ({
        id: item.id,
        palletUpdateId: item.palletUpdateId,
        sequence: item.sequence,
        palletId: item.palletId,
        itemId: item.itemId,
        quantity: item.quantity,
        uom: item.uom,
        productionDate: item.productionDate,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      scans: palletUpdate.scans?.map((scan) => ({
        id: scan.id,
        palletUpdateId: scan.palletUpdateId,
        scanNumber: scan.scanNumber,
        scanDate: scan.scanDate,
        scanByUserId: scan.scanByUserId,
        palletId: scan.palletId,
        itemId: scan.itemId,
        quantity: scan.quantity,
        uom: scan.uom,
        productionDate: scan.productionDate,
        notes: scan.notes,
        status: scan.status,
        createdAt: scan.createdAt,
        updatedAt: scan.updatedAt,
      })),
      assigned: palletUpdate.assigned?.map((assign) => ({
        id: assign.id,
        palletUpdateId: assign.palletUpdateId,
        userId: assign.userId,
        assignedAt: assign.assignedAt,
        createdAt: assign.createdAt,
        updatedAt: assign.updatedAt,
      })),
      createdAt: palletUpdate.createdAt,
      updatedAt: palletUpdate.updatedAt,
    };
  }

  // PalletUpdateScan methods
  async createScan(createScanDto: CreatePalletUpdateScanDto): Promise<PalletUpdateScan> {
    // Validate palletUpdateId exists if provided
    if (createScanDto.palletUpdateId) {
      const palletUpdate = await this.repository.findOne(createScanDto.palletUpdateId);
      if (!palletUpdate) {
        throw new NotFoundException(
          `Pallet update with ID ${createScanDto.palletUpdateId} not found`,
        );
      }
    }

    return await this.repository.createScan(createScanDto);
  }

  async findAllScans(palletUpdateId?: string): Promise<PalletUpdateScanResponseDto[]> {
    const scans = await this.repository.findAllScans(palletUpdateId);
    return scans.map(this.mapScanToResponseDto);
  }

  async findOneScan(id: string): Promise<PalletUpdateScanResponseDto> {
    const scan = await this.repository.findOneScan(id);
    if (!scan) {
      throw new NotFoundException(`Scan with ID ${id} not found`);
    }
    return this.mapScanToResponseDto(scan);
  }

  async updateScan(
    id: string,
    updateScanDto: UpdatePalletUpdateScanDto,
  ): Promise<PalletUpdateScanResponseDto> {
    const existing = await this.repository.findOneScan(id);
    if (!existing) {
      throw new NotFoundException(`Scan with ID ${id} not found`);
    }

    // Validate palletUpdateId exists if being updated
    if (updateScanDto.palletUpdateId) {
      const palletUpdate = await this.repository.findOne(updateScanDto.palletUpdateId);
      if (!palletUpdate) {
        throw new NotFoundException(
          `Pallet update with ID ${updateScanDto.palletUpdateId} not found`,
        );
      }
    }

    const updated = await this.repository.updateScan(id, updateScanDto);
    return this.mapScanToResponseDto(updated);
  }

  async deleteScan(id: string): Promise<void> {
    const existing = await this.repository.findOneScan(id);
    if (!existing) {
      throw new NotFoundException(`Scan with ID ${id} not found`);
    }
    await this.repository.deleteScan(id);
  }

  private mapScanToResponseDto(scan: PalletUpdateScan): PalletUpdateScanResponseDto {
    return {
      id: scan.id,
      palletUpdateId: scan.palletUpdateId,
      scanNumber: scan.scanNumber,
      scanDate: scan.scanDate,
      scanByUserId: scan.scanByUserId,
      palletId: scan.palletId,
      itemId: scan.itemId,
      quantity: scan.quantity,
      uom: scan.uom,
      productionDate: scan.productionDate,
      notes: scan.notes,
      status: scan.status,
      createdAt: scan.createdAt,
      updatedAt: scan.updatedAt,
    };
  }
}
