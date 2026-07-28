import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TransactionScanPickingRepository } from './transaction-scan-picking.repository';
import { CreateTransactionScanPickingDto } from './dto/create-transaction-scan-picking.dto';
import { UpdateTransactionScanPickingDto } from './dto/update-transaction-scan-picking.dto';
import { ScanPickingStatus, ScanPickingTransaction } from '../core/domain/entities/transaction-scan-picking.entity';
import { PickingTransaction } from '../core/domain/entities/transaction-picking.entity';
import { TransactionPickingService } from '../transaction-picking/transaction-picking.service';
import { MasterPalletService } from '../master-pallet/master-pallet.service';
import { QuantityOperationType, StatusInventory } from '../core/domain/entities/transaction-pallet-history.entity';
import { UpdateStatusDto } from './dto/update-status.dto';
import { InventoryTrackingService } from '../inventory-tracking/inventory-tracking.service';
import { MasterWarehouseBinService } from '../master-warehouse-bin/master-warehouse-bin.service';
import { ProgressionStatus } from 'src/core/domain/entities/inventory-tracking.entity';
import { OutboundMemoService } from '../outbound-memo/outbound-memo.service';
import { DataSource } from 'typeorm';

@Injectable()
export class TransactionScanPickingService {
  constructor(
    private readonly repository: TransactionScanPickingRepository,
    private readonly transactionPickingService: TransactionPickingService,
    private readonly masterPalletService: MasterPalletService,
    private readonly inventoryTrackingService: InventoryTrackingService,
    private readonly masterWarehouseBinService: MasterWarehouseBinService,
    private readonly outboundMemoService: OutboundMemoService,
    private readonly dataSource: DataSource,
  ) { }

  async create(data: CreateTransactionScanPickingDto): Promise<ScanPickingTransaction> {
    return await this.dataSource.transaction(async () => {
      try {
        const transactionPicking = await this.transactionPickingService.findOne(
          data.transaction_picking_id,
        );
        const memo_id = transactionPicking.memo_id;

        if (!memo_id) {
          throw new BadRequestException('Transaction picking must have a memo_id');
        }

        const memo = await this.outboundMemoService.findOne(memo_id);
        if (!memo) {
          throw new NotFoundException(`Memo with ID ${memo_id} not found`);
        }

        await this.validateQuantities(data.quantity_picked, data.quantity_switch);
        await this.validatePallets([
          data.pallet_source_id,
          data.pallet_use_id,
          data.pallet_switch_id,
        ]);

        if (!data.pallet_source_id) {
          throw new BadRequestException('pallet_source_id is required');
        }
        if (!data.pallet_use_id) {
          throw new BadRequestException('pallet_use_id is required');
        }

        await this.validateUsePalletMemo(data.pallet_use_id, memo_id);

        const itemId = data.item_id || transactionPicking.item_id;
        const uom = data.uom || transactionPicking.uom;
        const weekNumber = data.week_number ?? transactionPicking.week_number;
        const outboundDoId = transactionPicking.do_id;
        const quantitySwitch = data.quantity_switch || 0;

        if (!itemId) {
          throw new BadRequestException(
            'item_id is required (either in request or from transaction_picking)',
          );
        }
        if (weekNumber === undefined || weekNumber === null) {
          throw new BadRequestException(
            'week_number is required to pick the correct stock line on the pallet',
          );
        }
        // quantity_picked = qty going to the USE pallet (PENDING/outbound).
        // quantity_switch = SEPARATE leftover moved to the switch pallet.
        // Total taken from source READY = quantity_picked + quantity_switch;
        // availability is validated by masterPalletService.updateQuantity (PICK).

        const isSamePallet = data.pallet_source_id === data.pallet_use_id;
        const productionDate = await this.getPalletItemProductionDate(
          data.pallet_source_id,
          itemId,
          uom,
          weekNumber,
        );

        await this.applyScanPickingPalletQuantities({
          palletSourceId: data.pallet_source_id,
          palletUseId: data.pallet_use_id,
          palletSwitchId: data.pallet_switch_id,
          quantityPicked: data.quantity_picked,
          quantitySwitch,
          itemId,
          uom,
          weekNumber,
          productionDate,
          outboundDoId,
          userId: data.user_id,
          referenceId: data.transaction_picking_id,
          memoId: memo.id,
          memoNumber: memo.outbound_memo_number,
          action: 'CREATE',
        });

        await this.moveInventoryTrackingForPallets(
          data.pallet_source_id,
          data.pallet_use_id,
          data.pallet_switch_id,
          transactionPicking,
          data.quantity_picked,
          quantitySwitch,
          isSamePallet,
          memo.outbound_memo_number,
        );

        await this.masterPalletService.update(data.pallet_use_id, {
          memo_id: memo.id,
        });

        return this.repository.create({
          ...data,
          item_id: itemId,
          uom,
          week_number: weekNumber,
          quantity_switch: quantitySwitch,
        });
      } catch (error) {
        if (error instanceof BadRequestException || error instanceof NotFoundException) {
          throw error;
        }
        console.error('Error creating transaction scan picking:', error);
        throw new BadRequestException(
          `Failed to create transaction scan picking: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    });
  }

  async update(
    id: string,
    data: UpdateTransactionScanPickingDto,
  ): Promise<ScanPickingTransaction> {
    return await this.dataSource.transaction(async () => {
      try {
        const existing = await this.findOne(id);

        const transactionPickingId =
          data.transaction_picking_id || existing.transaction_picking_id;
        const transactionPicking =
          await this.transactionPickingService.findOne(transactionPickingId);

        const memo_id = transactionPicking.memo_id;
        if (!memo_id) {
          throw new BadRequestException('Transaction picking must have a memo_id');
        }
        const memo = await this.outboundMemoService.findOne(memo_id);
        if (!memo) {
          throw new NotFoundException(`Memo with ID ${memo_id} not found`);
        }

        const itemId = data.item_id || existing.item_id || transactionPicking.item_id;
        const uom = data.uom || existing.uom || transactionPicking.uom;
        const weekNumber =
          data.week_number ?? existing.week_number ?? transactionPicking.week_number;
        const outboundDoId = transactionPicking.do_id;

        if (!itemId) {
          throw new BadRequestException(
            'item_id is required (either in request or from transaction_picking)',
          );
        }

        if (data.quantity_picked !== undefined || data.quantity_switch !== undefined) {
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

        const quantityPicked = data.quantity_picked ?? existing.quantity_picked;
        const quantitySwitch = data.quantity_switch ?? existing.quantity_switch ?? 0;

        const hasPalletChanges =
          data.pallet_source_id !== undefined ||
          data.pallet_use_id !== undefined ||
          data.pallet_switch_id !== undefined ||
          data.quantity_picked !== undefined ||
          data.quantity_switch !== undefined ||
          data.week_number !== undefined ||
          data.item_id !== undefined ||
          data.uom !== undefined;

        if (hasPalletChanges) {
          // quantity_picked (use/outbound) and quantity_switch (leftover) are independent.
          // Total taken from source = quantity_picked + quantity_switch (validated on PICK).
          if (weekNumber === undefined || weekNumber === null) {
            throw new BadRequestException(
              'week_number is required to revert/update pallet operations for the correct stock line',
            );
          }

          const userId = data.user_id ?? (existing as { user_id?: string }).user_id;
          const existingWeekNumber = existing.week_number ?? weekNumber;

          // Revert previous ops using the original week/item/uom on the scan row
          await this.revertPalletOperations(
            existing,
            existing.item_id || itemId,
            existing.uom || uom,
            existingWeekNumber,
            existing.transaction_picking_id,
            outboundDoId,
            userId,
            memo.outbound_memo_number,
          );

          const newPalletSourceId = data.pallet_source_id ?? existing.pallet_source_id;
          const newPalletUseId = data.pallet_use_id ?? existing.pallet_use_id;
          const newPalletSwitchId = data.pallet_switch_id ?? existing.pallet_switch_id;

          if (!newPalletSourceId || !newPalletUseId) {
            throw new BadRequestException('pallet_source_id and pallet_use_id are required');
          }

          await this.validateUsePalletMemo(newPalletUseId, memo_id);

          const isSamePallet = newPalletSourceId === newPalletUseId;
          const productionDate = await this.getPalletItemProductionDate(
            newPalletSourceId,
            itemId,
            uom,
            weekNumber,
          );

          await this.applyScanPickingPalletQuantities({
            palletSourceId: newPalletSourceId,
            palletUseId: newPalletUseId,
            palletSwitchId: newPalletSwitchId,
            quantityPicked,
            quantitySwitch,
            itemId,
            uom,
            weekNumber,
            productionDate,
            outboundDoId,
            userId,
            referenceId: transactionPickingId,
            memoId: memo.id,
            memoNumber: memo.outbound_memo_number,
            action: 'UPDATE',
          });

          await this.moveInventoryTrackingForPallets(
            newPalletSourceId,
            newPalletUseId,
            newPalletSwitchId,
            transactionPicking,
            quantityPicked,
            quantitySwitch,
            isSamePallet,
            memo.outbound_memo_number,
          );

          await this.masterPalletService.update(newPalletUseId, {
            memo_id: memo.id,
          });
        }

        return this.repository.update(id, {
          ...data,
          item_id: itemId,
          uom,
          week_number: weekNumber,
          quantity_switch: quantitySwitch,
        });
      } catch (error) {
        if (error instanceof BadRequestException || error instanceof NotFoundException) {
          throw error;
        }
        console.error(`Error updating transaction scan picking ${id}:`, error);
        throw new BadRequestException(
          `Failed to update transaction scan picking: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    });
  }

  async remove(id: string): Promise<void> {
    await this.dataSource.transaction(async () => {
      const existing = await this.findOne(id);

      const transactionPicking = await this.transactionPickingService.findOne(
        existing.transaction_picking_id,
      );

      const itemId = existing.item_id || transactionPicking.item_id;
      const uom = existing.uom || transactionPicking.uom;
      const weekNumber = await this.resolveWeekNumberForStockLineRevert(
        existing,
        transactionPicking,
        itemId,
        uom,
      );
      const outboundDoId = transactionPicking.do_id;
      const memoNumber = transactionPicking.memo_id
        ? (await this.outboundMemoService.findOne(transactionPicking.memo_id))?.outbound_memo_number
        : undefined;

      if (!itemId) {
        throw new BadRequestException('item_id is required to revert pallet operations');
      }

      const userId = (existing as { user_id?: string }).user_id;

      await this.revertPalletOperations(
        existing,
        itemId,
        uom,
        weekNumber,
        existing.transaction_picking_id,
        outboundDoId,
        userId,
        memoNumber,
      );

      await this.repository.remove(id);
    });
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

  async inspectionApproved(id: string, inspection_by: string): Promise<ScanPickingTransaction> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Transaction scan picking tidak ditemukan');
    }
    return this.repository.update(id, { status: ScanPickingStatus.INSPECTION_APPROVED, inspection_by: inspection_by });
  }

  private async validateUsePalletMemo(palletUseId: string, memoId: string): Promise<void> {
    const usePallet = await this.masterPalletService.findOne(palletUseId);
    if (usePallet.memo_id && usePallet.memo_id !== memoId) {
      throw new BadRequestException(
        `Use pallet ${usePallet.pallet_code ?? palletUseId} already bound to memo_id ${usePallet.memo_id}; expected memo_id ${memoId}`,
      );
    }
  }

  private async resolvePalletCode(palletId?: string | null): Promise<string> {
    if (!palletId) {
      return 'N/A';
    }
    try {
      const pallet = await this.masterPalletService.findOne(palletId);
      return pallet.pallet_code || palletId;
    } catch {
      return palletId;
    }
  }

  /**
   * Apply scan-picking stock moves:
   * 1) PICK quantity_picked from source (READY)
   * 2) ADD quantity_to_use (= picked - switch) to use pallet as PENDING (bound to memo)
   * 3) ADD quantity_switch to switch pallet as READY (leftover, not for memo)
   *
   * Bug fixed: previously different source/use added full quantity_picked to use AND
   * quantity_switch to switch, double-counting the switch portion.
   */
  private async applyScanPickingPalletQuantities(params: {
    palletSourceId: string;
    palletUseId: string;
    palletSwitchId?: string;
    quantityPicked: number;
    quantitySwitch: number;
    itemId: string;
    uom?: string;
    weekNumber: number;
    productionDate?: Date;
    outboundDoId?: string;
    userId?: string;
    referenceId: string;
    memoId: string;
    memoNumber?: string | null;
    action: 'CREATE' | 'UPDATE';
  }): Promise<void> {
    const {
      palletSourceId,
      palletUseId,
      palletSwitchId,
      quantityPicked,
      quantitySwitch,
      itemId,
      uom,
      weekNumber,
      productionDate,
      outboundDoId,
      userId,
      referenceId,
      memoId,
      memoNumber,
      action,
    } = params;

    // quantity_picked = qty going to USE pallet (PENDING/outbound).
    // quantity_switch = SEPARATE leftover moved to the switch pallet.
    // Both come out of the source READY line.
    const quantityToUse = quantityPicked;
    const totalFromSource = quantityPicked + quantitySwitch;
    const isSamePallet = palletSourceId === palletUseId;
    const memoLabel = memoNumber || memoId;

    const [sourceCode, useCode, switchCode] = await Promise.all([
      this.resolvePalletCode(palletSourceId),
      this.resolvePalletCode(palletUseId),
      this.resolvePalletCode(palletSwitchId),
    ]);

    const basePayload = {
      item_id: itemId,
      uom,
      week_number: weekNumber,
      production_date: productionDate,
      outbound_do_id: outboundDoId,
      user_id: userId,
      reference_id: referenceId,
      reference_type: 'TRANSACTION_SCAN_PICKING' as const,
    };

    if (totalFromSource > 0) {
      // Skip empty cleanup when stock will be ADDed back to source/use/switch in this flow
      // (PICK→0 would otherwise clear inventory tracking and wipe history mid-operation).
      const willRestockSourceOrUse =
        (isSamePallet && quantityToUse > 0) ||
        (palletSwitchId === palletSourceId && quantitySwitch > 0);

      await this.masterPalletService.updateQuantity(
        palletSourceId,
        {
          ...basePayload,
          quantity: totalFromSource,
          operation_type: QuantityOperationType.PICK,
          status_inventory: StatusInventory.READY,
          notes:
            `[${action}] PICK ${totalFromSource}${uom ? ` ${uom}` : ''} ` +
            `FROM source pallet ${sourceCode} (${palletSourceId}) ` +
            `week=${weekNumber} ` +
            `FOR memo ${memoLabel} (${memoId}); ` +
            `route: to_use=${useCode}${isSamePallet ? ' (same as source)' : ''} qty=${quantityToUse}` +
            (quantitySwitch > 0
              ? `, to_switch=${switchCode} qty=${quantitySwitch}`
              : ', to_switch=none'),
        },
        undefined,
        willRestockSourceOrUse,
      );
    }

    if (palletSwitchId && quantitySwitch > 0) {
      await this.masterPalletService.updateQuantity(palletSwitchId, {
        ...basePayload,
        quantity: quantitySwitch,
        operation_type: QuantityOperationType.ADD,
        status_inventory: StatusInventory.READY,
        notes:
          `[${action}] ADD ${quantitySwitch}${uom ? ` ${uom}` : ''} ` +
          `TO switch pallet ${switchCode} (${palletSwitchId}) ` +
          `FROM source pallet ${sourceCode} (${palletSourceId}) ` +
          `week=${weekNumber}; leftover READY stock (NOT for memo ${memoLabel})`,
      });
    }

    if (quantityToUse > 0) {
      await this.masterPalletService.updateQuantity(palletUseId, {
        ...basePayload,
        quantity: quantityToUse,
        operation_type: QuantityOperationType.ADD,
        status_inventory: StatusInventory.PENDING,
        notes:
          `[${action}] ADD ${quantityToUse}${uom ? ` ${uom}` : ''} ` +
          `TO use pallet ${useCode} (${palletUseId})` +
          (isSamePallet ? ' (same as source — convert READY→PENDING)' : '') +
          ` FROM source pallet ${sourceCode} (${palletSourceId}) ` +
          `week=${weekNumber} ` +
          `FOR memo ${memoLabel} (${memoId}); status=PENDING (waiting outbound pick/ship)`,
      });
    }
  }

  private async revertPalletOperations(
    existing: ScanPickingTransaction,
    itemId: string,
    uom: string | undefined,
    weekNumber: number,
    transactionPickingId: string,
    outboundDoId: string | undefined,
    userId?: string | undefined,
    memoNumber?: string | null,
  ): Promise<void> {
    const transactionPicking =
      await this.transactionPickingService.findOne(transactionPickingId);
    const memoId = transactionPicking.memo_id;
    const memoLabel = memoNumber || memoId || 'N/A';

    const wasSamePallet = Boolean(
      existing.pallet_source_id &&
      existing.pallet_use_id &&
      existing.pallet_source_id === existing.pallet_use_id,
    );

    let productionDate: Date | undefined;
    const productionDatePalletId =
      existing.pallet_use_id || existing.pallet_switch_id || existing.pallet_source_id;
    if (productionDatePalletId && itemId) {
      productionDate = await this.getPalletItemProductionDate(
        productionDatePalletId,
        itemId,
        uom,
        weekNumber,
      );
    }

    const quantitySwitch = existing.quantity_switch || 0;
    const quantityPicked = existing.quantity_picked || 0;
    // Mirror apply: use pallet held quantity_picked (PENDING), switch held quantity_switch;
    // source READY must be restored with the sum of both.
    const quantityToUse = quantityPicked;
    const totalToSource = quantityPicked + quantitySwitch;

    const [sourceCode, useCode, switchCode] = await Promise.all([
      this.resolvePalletCode(existing.pallet_source_id),
      this.resolvePalletCode(existing.pallet_use_id),
      this.resolvePalletCode(existing.pallet_switch_id),
    ]);

    const basePayload = {
      item_id: itemId,
      uom,
      week_number: weekNumber,
      production_date: productionDate,
      outbound_do_id: outboundDoId,
      user_id: userId,
      reference_id: transactionPickingId,
      reference_type: 'TRANSACTION_SCAN_PICKING' as const,
    };

    // Reverse of create: REMOVE use → REMOVE switch → ADD source
    if (existing.pallet_use_id && quantityToUse > 0) {
      await this.masterPalletService.updateQuantity(
        existing.pallet_use_id,
        {
          ...basePayload,
          quantity: quantityToUse,
          operation_type: QuantityOperationType.REMOVE,
          status_inventory: StatusInventory.PENDING,
          notes:
            `[REVERT] REMOVE ${quantityToUse}${uom ? ` ${uom}` : ''} ` +
            `FROM use pallet ${useCode} (${existing.pallet_use_id})` +
            (wasSamePallet ? ' (same as source)' : '') +
            ` week=${weekNumber} ` +
            `FOR memo ${memoLabel}` +
            (memoId ? ` (${memoId})` : '') +
            `; undo PENDING stock that was for outbound`,
        },
        undefined,
        // Same pallet: READY line is 0 until we ADD back below — skip empty cleanup
        // so history/memo is not wiped mid-revert.
        wasSamePallet,
      );
    }

    if (existing.pallet_switch_id && quantitySwitch > 0) {
      await this.masterPalletService.updateQuantity(existing.pallet_switch_id, {
        ...basePayload,
        quantity: quantitySwitch,
        operation_type: QuantityOperationType.REMOVE,
        status_inventory: StatusInventory.READY,
        notes:
          `[REVERT] REMOVE ${quantitySwitch}${uom ? ` ${uom}` : ''} ` +
          `FROM switch pallet ${switchCode} (${existing.pallet_switch_id}) ` +
          `week=${weekNumber}; undo leftover READY that came FROM source ${sourceCode}`,
      });
    }

    if (existing.pallet_source_id && totalToSource > 0) {
      await this.masterPalletService.updateQuantity(existing.pallet_source_id, {
        ...basePayload,
        quantity: totalToSource,
        operation_type: QuantityOperationType.ADD,
        status_inventory: StatusInventory.READY,
        notes:
          `[REVERT] ADD ${totalToSource}${uom ? ` ${uom}` : ''} ` +
          `TO source pallet ${sourceCode} (${existing.pallet_source_id}) ` +
          `week=${weekNumber} ` +
          `FROM use=${useCode} (${quantityToUse}) / switch=${switchCode} (${quantitySwitch}); ` +
          `restore READY stock after undoing scan picking for memo ${memoLabel}`,
      });
    }

    // Clear memo binding on use pallet if it was set for this memo
    if (existing.pallet_use_id && memoId) {
      try {
        const usePallet = await this.masterPalletService.findOne(existing.pallet_use_id);
        if (usePallet.memo_id === memoId) {
          await this.masterPalletService.update(existing.pallet_use_id, {
            memo_id: null,
          });
        }
      } catch (error) {
        console.warn(
          `Could not clear memo_id on use pallet ${existing.pallet_use_id}:`,
          error,
        );
      }
    }

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
    memoNumber?: string | null,
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

      // quantity_picked goes to the USE pallet (outbound PENDING → PICKED at destination).
      const quantityToUse = quantityPicked;
      const memoLabel = memoNumber ? ` memo=${memoNumber}` : '';
      const useTargetPalletId =
        palletUseId && quantityToUse > 0
          ? isSamePallet
            ? palletSourceId
            : palletUseId
          : undefined;

      // Capture the source pallet's location BEFORE the use pallet is moved to the
      // destination. When source === use, the switch pallet must stay at this original
      // location (the leftover READY stock never leaves the source bin).
      let preScanSourceLocation:
        | {
          warehouse_sub_id?: string;
          warehouse_bin_id?: string;
          warehouse_id?: string;
        }
        | undefined;
      if (palletSourceId) {
        try {
          const preSourceTracking =
            await this.inventoryTrackingService.findOneByPalletId(palletSourceId);
          if (preSourceTracking) {
            preScanSourceLocation = {
              warehouse_sub_id: preSourceTracking.warehouse_sub_id,
              warehouse_bin_id: preSourceTracking.warehouse_bin_id,
              warehouse_id: preSourceTracking.warehouse_id,
            };
          }
        } catch (error) {
          if (!(error instanceof NotFoundException)) {
            throw error;
          }
        }
      }

      // Move inventory tracking to destination location
      // If same pallet, move source pallet to destination. If different, move use pallet to destination.
      // pallet_use always gets inventory_status = PICKED when it holds outbound PENDING qty.
      if (useTargetPalletId) {
        if (destinationWarehouseSubId && destinationWarehouseId) {
          try {
            let targetPalletTracking;
            try {
              targetPalletTracking =
                await this.inventoryTrackingService.findOneByPalletId(useTargetPalletId);
            } catch (error) {
              if (!(error instanceof NotFoundException)) {
                throw error;
              }
              targetPalletTracking = null;
            }

            if (targetPalletTracking) {
              await this.inventoryTrackingService.update(targetPalletTracking.id, {
                warehouse_sub_id: destinationWarehouseSubId,
                warehouse_bin_id: destinationBinId,
                warehouse_id: destinationWarehouseId,
                inventory_status: 'PICKED',
                progression_status: ProgressionStatus.COMPLETED,
                inventory_note: isSamePallet
                  ? `Scan picking: ${quantityToUse} on same pallet ${useTargetPalletId} → PICKED; from source=${palletSourceId}; switch=${quantitySwitch};${memoLabel}`
                  : `Scan picking: moved ${quantityToUse} FROM source ${palletSourceId} TO use ${palletUseId} → PICKED; switch=${quantitySwitch};${memoLabel}`,
                inventory_date: new Date(),
              });
            } else {
              await this.inventoryTrackingService.createOrUpdateInventoryTracking(
                useTargetPalletId,
                destinationWarehouseSubId,
                destinationWarehouseId,
                'PICKED',
                ProgressionStatus.COMPLETED,
              );

              if (destinationBinId) {
                const tracking =
                  await this.inventoryTrackingService.findOneByPalletId(useTargetPalletId);
                if (tracking) {
                  await this.inventoryTrackingService.update(tracking.id, {
                    warehouse_bin_id: destinationBinId,
                    inventory_status: 'PICKED',
                    inventory_note: `Scan picking create tracking FOR use pallet ${useTargetPalletId} FROM source ${palletSourceId} → PICKED;${memoLabel}`,
                  });
                }
              }
            }
          } catch (error) {
            console.error(
              `Failed to move inventory tracking to destination for pallet ${useTargetPalletId}:`,
              error,
            );
          }
        } else {
          // Destination incomplete — still mark use pallet as PICKED
          try {
            const tracking =
              await this.inventoryTrackingService.findOneByPalletId(useTargetPalletId);
            if (tracking) {
              await this.inventoryTrackingService.update(tracking.id, {
                inventory_status: 'PICKED',
                progression_status: ProgressionStatus.COMPLETED,
                inventory_note: `Scan picking: use pallet ${useTargetPalletId} → PICKED (destination location incomplete);${memoLabel}`,
                inventory_date: new Date(),
              });
            }
          } catch (error) {
            if (!(error instanceof NotFoundException)) {
              console.error(
                `Failed to set PICKED on use pallet ${useTargetPalletId}:`,
                error,
              );
            }
          }
        }
      }

      // Move inventory tracking to switch pallet if provided (leftover READY stays IN_INVENTORY).
      // Never overwrite the use/outbound pallet that must remain PICKED.
      if (palletSwitchId && quantitySwitch > 0) {
        const switchIsUseOutbound =
          !!useTargetPalletId && palletSwitchId === useTargetPalletId;

        if (switchIsUseOutbound) {
          // Switch leftover landed on the same pallet as outbound use — keep PICKED.
          console.warn(
            `pallet_switch_id equals use pallet ${palletSwitchId}; keeping inventory_status=PICKED`,
          );
        } else {
          try {
            // Prefer source location BEFORE scan moved use to destination.
            // If source === use (already PICKED at destination), use picking source location
            // or destination as fallback for the leftover switch pallet only.
            let sourceWarehouseSubId: string | undefined;
            let sourceBinId: string | undefined;
            let sourceWarehouseId: string | undefined;

            // Prefer the location captured BEFORE the use pallet was moved to the
            // destination. This keeps the switch (leftover) pallet at the source's
            // original bin even when source === use.
            if (preScanSourceLocation?.warehouse_sub_id) {
              sourceWarehouseSubId = preScanSourceLocation.warehouse_sub_id;
              sourceBinId = preScanSourceLocation.warehouse_bin_id;
              sourceWarehouseId = preScanSourceLocation.warehouse_id;
            }

            if (
              !sourceWarehouseSubId &&
              palletSourceId &&
              palletSourceId !== useTargetPalletId
            ) {
              try {
                const sourceTracking =
                  await this.inventoryTrackingService.findOneByPalletId(palletSourceId);
                if (sourceTracking) {
                  sourceWarehouseSubId = sourceTracking.warehouse_sub_id;
                  sourceBinId = sourceTracking.warehouse_bin_id;
                  sourceWarehouseId = sourceTracking.warehouse_id;
                }
              } catch (error) {
                if (!(error instanceof NotFoundException)) {
                  throw error;
                }
              }
            }

            if (!sourceWarehouseSubId) {
              sourceWarehouseSubId =
                transactionPicking.source_warehouse_sub_id || destinationWarehouseSubId;
              sourceBinId = transactionPicking.source_bin_id || destinationBinId;
              sourceWarehouseId = destinationWarehouseId;
            }

            const finalWarehouseSubId = sourceWarehouseSubId || destinationWarehouseSubId;
            const finalBinId = sourceBinId || destinationBinId;
            const finalWarehouseId = sourceWarehouseId || destinationWarehouseId;

            if (!finalWarehouseSubId || !finalWarehouseId) {
              console.warn(
                `Cannot create inventory tracking for switch pallet ${palletSwitchId}: missing warehouse information`,
              );
            } else {
              let switchPalletTracking;
              try {
                switchPalletTracking =
                  await this.inventoryTrackingService.findOneByPalletId(palletSwitchId);
              } catch (error) {
                if (!(error instanceof NotFoundException)) {
                  throw error;
                }
                switchPalletTracking = null;
              }

              if (switchPalletTracking) {
                await this.inventoryTrackingService.update(switchPalletTracking.id, {
                  warehouse_sub_id: finalWarehouseSubId,
                  warehouse_bin_id: finalBinId,
                  warehouse_id: finalWarehouseId,
                  inventory_status: 'IN_INVENTORY',
                  progression_status: ProgressionStatus.COMPLETED,
                  inventory_note: `Scan picking: leftover ${quantitySwitch} on switch pallet ${palletSwitchId} → IN_INVENTORY;${memoLabel}`,
                  inventory_date: new Date(),
                });
              } else {
                await this.inventoryTrackingService.createOrUpdateInventoryTracking(
                  palletSwitchId,
                  finalWarehouseSubId,
                  finalWarehouseId,
                  'IN_INVENTORY',
                  ProgressionStatus.COMPLETED,
                );

                if (finalBinId) {
                  const tracking =
                    await this.inventoryTrackingService.findOneByPalletId(palletSwitchId);
                  if (tracking) {
                    await this.inventoryTrackingService.update(tracking.id, {
                      warehouse_bin_id: finalBinId,
                      inventory_status: 'IN_INVENTORY',
                      progression_status: ProgressionStatus.COMPLETED,
                    });
                  }
                }
              }
            }
          } catch (error) {
            console.error(
              `Failed to move inventory tracking to switch pallet ${palletSwitchId}:`,
              error,
            );
          }
        }
      }

      // Re-assert PICKED on use/outbound pallet after switch handling (guards against overwrite)
      if (useTargetPalletId) {
        try {
          const tracking =
            await this.inventoryTrackingService.findOneByPalletId(useTargetPalletId);
          if (tracking && tracking.inventory_status !== 'PICKED') {
            await this.inventoryTrackingService.update(tracking.id, {
              inventory_status: 'PICKED',
              progression_status: ProgressionStatus.COMPLETED,
              inventory_note: `Scan picking: ensure use pallet ${useTargetPalletId} → PICKED after switch handling;${memoLabel}`,
              inventory_date: new Date(),
            });
          }
        } catch (error) {
          if (!(error instanceof NotFoundException)) {
            console.error(
              `Failed to re-assert PICKED on use pallet ${useTargetPalletId}:`,
              error,
            );
          }
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
      // Destination of scan picking (often staging) — must NOT be used as restore target
      let destinationWarehouseSubId = transactionPicking.destination_warehouse_sub_id as
        | string
        | undefined;
      const destinationBinId = transactionPicking.destination_bin_id as string | undefined;

      if (destinationBinId) {
        try {
          const warehouseBin = await this.masterWarehouseBinService.findOne(destinationBinId);
          if (warehouseBin?.warehouse_sub_id) {
            destinationWarehouseSubId = warehouseBin.warehouse_sub_id;
          }
        } catch {
          // ignore — destination exclude is best-effort
        }
      }

      // Source on picking header can also be staging; only use as fallback if it differs from destination
      let sourceWarehouseSubId = transactionPicking.source_warehouse_sub_id as string | undefined;
      const sourceBinId = transactionPicking.source_bin_id as string | undefined;
      let sourceWarehouseId: string | undefined;

      if (sourceBinId) {
        try {
          const warehouseBin = await this.masterWarehouseBinService.findOne(sourceBinId);
          if (warehouseBin?.warehouse_sub_id) {
            sourceWarehouseSubId = warehouseBin.warehouse_sub_id;
          }
        } catch {
          // ignore
        }
      }

      if (sourceWarehouseSubId && !sourceWarehouseId) {
        const pickingWithRelations = await this.transactionPickingService.findOne(
          transactionPicking.id,
        );
        if (pickingWithRelations?.sourceWarehouseSub?.warehouse_id) {
          sourceWarehouseId = pickingWithRelations.sourceWarehouseSub.warehouse_id;
        }
      }

      const sourceIsNotDestination =
        !!sourceWarehouseSubId && sourceWarehouseSubId !== destinationWarehouseSubId;

      const fallbackSourceLocation = sourceIsNotDestination
        ? {
          warehouse_sub_id: sourceWarehouseSubId,
          warehouse_bin_id: sourceBinId,
          warehouse_id: sourceWarehouseId,
        }
        : null;

      const sourcePrevLocation = await this.getLocationBeforeScanPicking(
        existing.pallet_source_id,
        destinationWarehouseSubId,
      );
      const usePrevLocation = await this.getLocationBeforeScanPicking(
        existing.pallet_use_id,
        destinationWarehouseSubId,
      );
      const switchPrevLocation = await this.getLocationBeforeScanPicking(
        existing.pallet_switch_id,
        destinationWarehouseSubId,
      );

      const shouldRevertSourceInventory =
        existing.pallet_source_id &&
        existing.quantity_picked > 0 &&
        !(await this.repository.existsActivePickingsOnPalletExcludingTransaction(
          existing.pallet_source_id,
          transactionPicking.id,
        ));

      // Revert source pallet inventory tracking status back to IN_INVENTORY if it exists
      if (shouldRevertSourceInventory) {
        try {
          const sourceTracking = await this.inventoryTrackingService.findOneByPalletId(
            existing.pallet_source_id!,
          );
          if (sourceTracking) {
            const locationToRestore = sourcePrevLocation ?? fallbackSourceLocation;
            await this.inventoryTrackingService.update(sourceTracking.id, {
              warehouse_sub_id:
                locationToRestore?.warehouse_sub_id ?? sourceTracking.warehouse_sub_id,
              warehouse_bin_id:
                locationToRestore?.warehouse_bin_id ?? sourceTracking.warehouse_bin_id,
              warehouse_id: locationToRestore?.warehouse_id ?? sourceTracking.warehouse_id,
              inventory_status: 'IN_INVENTORY',
              inventory_note: locationToRestore
                ? `Reverted: Restored to pre-scan location from transaction scan picking`
                : `Reverted: Restored from transaction scan picking (location unchanged)`,
              inventory_date: new Date(),
            });
          }
        } catch (error) {
          if (!(error instanceof NotFoundException)) {
            throw error;
          }
        }
      }

      const shouldRevertUseInventory =
        existing.pallet_use_id &&
        existing.quantity_picked > 0 &&
        !wasSamePallet &&
        !(await this.repository.existsActivePickingsOnPalletExcludingTransaction(
          existing.pallet_use_id,
          transactionPicking.id,
        ));

      // Revert use pallet: restore location and clear PICKED → IN_INVENTORY
      if (shouldRevertUseInventory) {
        try {
          const usePalletTracking = await this.inventoryTrackingService.findOneByPalletId(
            existing.pallet_use_id!,
          );
          if (usePalletTracking) {
            const locationToRestore = usePrevLocation ?? fallbackSourceLocation;
            await this.inventoryTrackingService.update(usePalletTracking.id, {
              warehouse_sub_id:
                locationToRestore?.warehouse_sub_id ?? usePalletTracking.warehouse_sub_id,
              warehouse_bin_id:
                locationToRestore?.warehouse_bin_id ?? usePalletTracking.warehouse_bin_id,
              warehouse_id: locationToRestore?.warehouse_id ?? usePalletTracking.warehouse_id,
              inventory_status: 'IN_INVENTORY',
              inventory_note: locationToRestore
                ? `Reverted: use pallet PICKED → IN_INVENTORY, moved back to previous location`
                : `Reverted: use pallet PICKED → IN_INVENTORY`,
              inventory_date: new Date(),
              progression_status: ProgressionStatus.COMPLETED,
            });
          }
        } catch (error) {
          if (!(error instanceof NotFoundException)) {
            console.error(
              `Failed to revert inventory tracking for use pallet ${existing.pallet_use_id}:`,
              error,
            );
          }
        }
      }

      // Revert switch pallet inventory tracking
      if (existing.pallet_switch_id && existing.quantity_switch && existing.quantity_switch > 0) {
        try {
          const switchPalletTracking = await this.inventoryTrackingService.findOneByPalletId(
            existing.pallet_switch_id,
          );
          if (switchPalletTracking) {
            const locationToRestore = switchPrevLocation ?? fallbackSourceLocation;
            await this.inventoryTrackingService.update(switchPalletTracking.id, {
              warehouse_sub_id:
                locationToRestore?.warehouse_sub_id ?? switchPalletTracking.warehouse_sub_id,
              warehouse_bin_id:
                locationToRestore?.warehouse_bin_id ?? switchPalletTracking.warehouse_bin_id,
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
            console.error(
              `Failed to revert inventory tracking for switch pallet ${existing.pallet_switch_id}:`,
              error,
            );
          }
        }
      }
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Error reverting inventory tracking for pallets:', error);
    }
  }

  private async resolveWeekNumberForStockLineRevert(
    scan: ScanPickingTransaction,
    transactionPicking: PickingTransaction,
    itemId: string,
    uom?: string,
  ): Promise<number> {
    const explicitWeek = scan.week_number ?? transactionPicking.week_number;
    if (explicitWeek !== undefined && explicitWeek !== null) {
      return explicitWeek;
    }

    const palletId = scan.pallet_use_id || scan.pallet_source_id;
    if (!palletId) {
      throw new BadRequestException(
        `Cannot revert scan ${scan.id}: week_number is required when the same SKU can exist in multiple weeks`,
      );
    }

    // Use pallet held quantity_picked as PENDING (switch is separate).
    const quantityToUse = scan.quantity_picked || 0;
    const palletLines = await this.masterPalletService.getPalletItemLatestQuantity(palletId);
    const sameSkuLines = palletLines.filter(
      (line) =>
        line.item_id === itemId &&
        (!uom || !line.uom || line.uom === uom) &&
        line.current_quantity > 0,
    );

    const pendingOutboundLines = sameSkuLines.filter(
      (line) => line.status_inventory === StatusInventory.PENDING,
    );

    const matchByQty = (lines: typeof sameSkuLines): number | undefined => {
      if (quantityToUse <= 0) {
        return undefined;
      }
      const matches = lines.filter((line) => line.current_quantity === quantityToUse);
      if (matches.length === 1 && matches[0].week_number != null) {
        return matches[0].week_number;
      }
      return undefined;
    };

    const fromPendingQty = matchByQty(pendingOutboundLines);
    if (fromPendingQty !== undefined) {
      return fromPendingQty;
    }

    if (pendingOutboundLines.length === 1 && pendingOutboundLines[0].week_number != null) {
      return pendingOutboundLines[0].week_number;
    }

    const fromAnyQty = matchByQty(sameSkuLines);
    if (fromAnyQty !== undefined) {
      return fromAnyQty;
    }

    if (sameSkuLines.length === 1 && sameSkuLines[0].week_number != null) {
      return sameSkuLines[0].week_number;
    }

    const weekHint = sameSkuLines
      .map((line) => `week ${line.week_number} qty=${line.current_quantity} (${line.status_inventory})`)
      .join(', ');

    throw new BadRequestException(
      `Cannot revert scan ${scan.id}: same SKU on pallet has multiple week stock lines` +
      (weekHint ? ` (${weekHint})` : '') +
      `. Set week_number on the scan or transaction picking.`,
    );
  }

  private async getPalletItemProductionDate(
    palletId: string,
    itemId: string,
    uom?: string,
    weekNumber?: number | null,
  ): Promise<Date | undefined> {
    try {
      const palletItems = await this.masterPalletService.getPalletItemLatestQuantity(palletId);
      const sourceItem = palletItems.find(
        (item) =>
          item.item_id === itemId &&
          (!uom || item.uom === uom) &&
          (weekNumber === undefined ||
            weekNumber === null ||
            item.week_number === weekNumber),
      );
      return sourceItem?.production_date ?? undefined;
    } catch (error) {
      console.warn(`Could not get production_date from pallet ${palletId}:`, error);
      return undefined;
    }
  }

  /**
   * Find pallet location before scan picking moved it (e.g. put-away JT-08),
   * not the older staging create row and not the current PICKED/destination row.
   *
   * Blind history[1] was wrong when history looks like:
   *   [0] STG PICKED (scan)  or  [0] JT-08 overwritten PICKED
   *   [1] JT-08 put away     or  [1] STG inspection  ← wrongly restored
   *   [2] STG inspection
   */
  private async getLocationBeforeScanPicking(
    palletId?: string,
    excludeWarehouseSubId?: string,
  ): Promise<{ warehouse_sub_id?: string; warehouse_bin_id?: string; warehouse_id?: string } | null> {
    if (!palletId) {
      return null;
    }

    try {
      const history = await this.inventoryTrackingService.findHistoryByPalletId(palletId);
      if (!history || history.length === 0) {
        return null;
      }

      const isScanPickingEntry = (entry: {
        inventory_status?: string;
        inventory_note?: string | null;
        warehouse_sub_id?: string | null;
      }): boolean => {
        const note = (entry.inventory_note || '').toLowerCase();
        if (entry.inventory_status === 'PICKED') {
          return true;
        }
        if (note.includes('scan picking') || note.includes('reverted:')) {
          return true;
        }
        if (
          excludeWarehouseSubId &&
          entry.warehouse_sub_id === excludeWarehouseSubId &&
          (entry.inventory_status === 'PICKED' || note.includes('scan'))
        ) {
          return true;
        }
        return false;
      };

      const toLocation = (entry: {
        warehouse_sub_id?: string | null;
        warehouse_bin_id?: string | null;
        warehouse_id?: string | null;
      }) => ({
        warehouse_sub_id: entry.warehouse_sub_id ?? undefined,
        warehouse_bin_id: entry.warehouse_bin_id ?? undefined,
        warehouse_id: entry.warehouse_id ?? undefined,
      });

      // 1) Prefer latest IN_INVENTORY row that is not the scan destination/staging
      for (const entry of history) {
        if (isScanPickingEntry(entry)) {
          continue;
        }
        if (entry.inventory_status !== 'IN_INVENTORY' || !entry.warehouse_sub_id) {
          continue;
        }
        if (excludeWarehouseSubId && entry.warehouse_sub_id === excludeWarehouseSubId) {
          continue;
        }
        return toLocation(entry);
      }

      // 2) Any non-scan row with a location different from destination
      for (const entry of history) {
        if (isScanPickingEntry(entry) || !entry.warehouse_sub_id) {
          continue;
        }
        if (excludeWarehouseSubId && entry.warehouse_sub_id === excludeWarehouseSubId) {
          continue;
        }
        return toLocation(entry);
      }

      // 3) Latest IN_INVENTORY even if same area (better than staying PICKED)
      for (const entry of history) {
        if (isScanPickingEntry(entry)) {
          continue;
        }
        if (entry.inventory_status === 'IN_INVENTORY' && entry.warehouse_sub_id) {
          return toLocation(entry);
        }
      }

      return null;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }
      console.error(`Failed to get pre-scan inventory location for pallet ${palletId}:`, error);
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
