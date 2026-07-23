import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScanPickingTransaction } from '../core/domain/entities/transaction-scan-picking.entity';
import {
  PickingTransaction,
  Status as PickingTransactionStatus,
} from '../core/domain/entities/transaction-picking.entity';
import {
  QuantityOperationType,
  StatusInventory,
} from '../core/domain/entities/transaction-pallet-history.entity';
import { MasterPalletService } from '../master-pallet/master-pallet.service';
import { InventoryTrackingService } from '../inventory-tracking/inventory-tracking.service';
import { TransactionPickingRepository } from './transaction-picking.repository';

/**
 * On transaction-picking cancel: keep stock on pallet_use_id, convert PENDING → READY,
 * set inventory tracking to IN_INVENTORY (location unchanged), and clear memo_id.
 * Does NOT move quantities back to pallet_source / pallet_switch.
 */
@Injectable()
export class TransactionPickingCancelRevertService {
  constructor(
    private readonly transactionPickingRepository: TransactionPickingRepository,
    @InjectRepository(ScanPickingTransaction)
    private readonly scanPickingRepository: Repository<ScanPickingTransaction>,
    private readonly masterPalletService: MasterPalletService,
    private readonly inventoryTrackingService: InventoryTrackingService,
  ) { }

  async revertForCancelledTransaction(transactionPickingId: string): Promise<void> {
    const transactionPicking =
      await this.transactionPickingRepository.findOne(transactionPickingId);
    if (!transactionPicking) {
      throw new NotFoundException('Transaction picking tidak ditemukan');
    }

    const scans = await this.scanPickingRepository.find({
      where: { transaction_picking_id: transactionPickingId },
    });

    if (scans.length === 0) {
      return;
    }

    for (const scan of scans) {
      await this.releaseUsePalletStockForCancel(scan, transactionPicking);
    }
  }

  /**
   * Convert outbound PENDING on pallet_use → READY, set IN_INVENTORY, clear memo.
   * Switch leftover and source are left as-is (no quantity revert).
   */
  private async releaseUsePalletStockForCancel(
    scan: ScanPickingTransaction,
    transactionPicking: PickingTransaction,
  ): Promise<void> {
    if (!scan.pallet_use_id) {
      return;
    }

    const itemId = scan.item_id || transactionPicking.item_id;
    const uom = scan.uom || transactionPicking.uom;

    if (!itemId) {
      throw new BadRequestException(
        `Cannot cancel transaction picking ${transactionPicking.id}: scan ${scan.id} has no item_id`,
      );
    }

    const weekNumber = await this.resolveWeekNumberForStockLineRevert(
      scan,
      transactionPicking,
      itemId,
      uom,
    );

    const productionDate = await this.getPalletItemProductionDate(
      scan.pallet_use_id,
      itemId,
      uom,
      weekNumber,
    );

    // quantity_picked = outbound qty on use pallet (PENDING). Switch is independent — leave it.
    const quantityToUse = scan.quantity_picked || 0;
    const memoId = transactionPicking.memo_id;

    const basePayload = {
      item_id: itemId,
      uom,
      week_number: weekNumber,
      production_date: productionDate,
      outbound_do_id: transactionPicking.do_id,
      user_id: scan.user_id,
      reference_id: transactionPicking.id,
      reference_type: 'TRANSACTION_PICKING_CANCEL' as const,
    };

    if (quantityToUse > 0) {
      // PENDING and READY are separate stock lines — convert by REMOVE PENDING then ADD READY.
      // Skip empty cleanup between steps so history/memo are not wiped mid-convert.
      await this.masterPalletService.updateQuantity(
        scan.pallet_use_id,
        {
          ...basePayload,
          quantity: quantityToUse,
          operation_type: QuantityOperationType.REMOVE,
          status_inventory: StatusInventory.PENDING,
          notes:
            `[CANCEL] REMOVE ${quantityToUse}${uom ? ` ${uom}` : ''} PENDING ` +
            `week=${weekNumber} from use pallet ${scan.pallet_use_id} ` +
            `(convert to READY — stock stays on pallet)`,
        },
        undefined,
        true,
      );

      await this.masterPalletService.updateQuantity(scan.pallet_use_id, {
        ...basePayload,
        quantity: quantityToUse,
        operation_type: QuantityOperationType.ADD,
        status_inventory: StatusInventory.READY,
        notes:
          `[CANCEL] ADD ${quantityToUse}${uom ? ` ${uom}` : ''} READY ` +
          `week=${weekNumber} to use pallet ${scan.pallet_use_id} ` +
          `(released from outbound PENDING after cancel)`,
      });
    }

    if (memoId) {
      try {
        const usePallet = await this.masterPalletService.findOne(scan.pallet_use_id);
        if (usePallet.memo_id === memoId) {
          const otherActive = await this.existsActivePickingsOnPalletExcludingTransaction(
            scan.pallet_use_id,
            transactionPicking.id,
          );
          if (!otherActive) {
            await this.masterPalletService.update(scan.pallet_use_id, {
              memo_id: null,
            });
          }
        }
      } catch (error) {
        console.warn(`Could not clear memo_id on use pallet ${scan.pallet_use_id}:`, error);
      }
    }

    const otherActiveOnUse = await this.existsActivePickingsOnPalletExcludingTransaction(
      scan.pallet_use_id,
      transactionPicking.id,
    );
    if (!otherActiveOnUse) {
      await this.setUsePalletInventoryInInventory(scan.pallet_use_id);
    }
  }

  /** Status only — does not change warehouse location fields. */
  private async setUsePalletInventoryInInventory(palletUseId: string): Promise<void> {
    try {
      const tracking = await this.inventoryTrackingService.findOneByPalletId(palletUseId);
      if (tracking && tracking.inventory_status === 'PICKED') {
        await this.inventoryTrackingService.updateStatusToInInventory(
          tracking.id,
          'Transaction picking cancelled: PICKED → IN_INVENTORY (location unchanged)',
        );
      }
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        console.error(
          `Failed to set IN_INVENTORY on use pallet ${palletUseId} after cancel:`,
          error,
        );
      }
    }
  }

  private async existsActivePickingsOnPalletExcludingTransaction(
    palletId: string,
    excludeTransactionPickingId: string,
  ): Promise<boolean> {
    const count = await this.scanPickingRepository
      .createQueryBuilder('scan')
      .innerJoin('scan.transactionPicking', 'tp')
      .where('tp.status = :pending', { pending: PickingTransactionStatus.PENDING })
      .andWhere('tp.id != :excludeId', { excludeId: excludeTransactionPickingId })
      .andWhere('scan.deletedAt IS NULL')
      .andWhere(
        '(scan.pallet_source_id = :palletId OR scan.pallet_use_id = :palletId OR scan.pallet_switch_id = :palletId)',
        { palletId },
      )
      .getCount();

    return count > 0;
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
      .map(
        (line) =>
          `week ${line.week_number} qty=${line.current_quantity} (${line.status_inventory})`,
      )
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
            item.week_number === weekNumber) &&
          item.status_inventory === StatusInventory.PENDING,
      );
      return (
        sourceItem?.production_date ??
        palletItems.find(
          (item) =>
            item.item_id === itemId &&
            (!uom || item.uom === uom) &&
            (weekNumber === undefined ||
              weekNumber === null ||
              item.week_number === weekNumber),
        )?.production_date ??
        undefined
      );
    } catch {
      return undefined;
    }
  }
}
