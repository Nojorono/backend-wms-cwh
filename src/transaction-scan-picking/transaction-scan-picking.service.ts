import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TransactionScanPickingRepository } from './transaction-scan-picking.repository';
import { CreateTransactionScanPickingDto } from './dto/create-transaction-scan-picking.dto';
import { UpdateTransactionScanPickingDto } from './dto/update-transaction-scan-picking.dto';
import { ScanPickingStatus, ScanPickingTransaction } from '../core/domain/entities/transaction-scan-picking.entity';
import { TransactionPickingService } from '../transaction-picking/transaction-picking.service';
import { MasterPalletService } from '../master-pallet/master-pallet.service';
import { QuantityOperationType } from '../core/domain/entities/transaction-pallet-history.entity';

@Injectable()
export class TransactionScanPickingService {
  constructor(
    private readonly repository: TransactionScanPickingRepository,
    private readonly transactionPickingService: TransactionPickingService,
    private readonly masterPalletService: MasterPalletService,
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

    // Update pallet quantities if pallets are provided
    if (data.pallet_source_id && data.quantity_picked > 0) {
      // Pick total quantity from source pallet
      await this.masterPalletService.updateQuantity(data.pallet_source_id, {
        item_id: itemId,
        quantity: data.quantity_picked,
        operation_type: QuantityOperationType.PICK,
        uom: uom,
        week_number: weekNumber,
        reference_id: data.transaction_picking_id,
        reference_type: 'TRANSACTION_SCAN_PICKING',
        notes: `Picked ${data.quantity_picked} from source pallet for transaction scan picking`,
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
        reference_id: data.transaction_picking_id,
        reference_type: 'TRANSACTION_SCAN_PICKING',
        notes: `Switched ${quantitySwitch} to switch pallet from transaction scan picking`,
      });
    }

    if (data.pallet_use_id && data.quantity_picked > 0) {
      // Add remaining quantity to destination pallet (pallet_use_id)
      await this.masterPalletService.updateQuantity(data.pallet_use_id, {
        item_id: itemId,
        quantity: data.quantity_picked,
        operation_type: QuantityOperationType.ADD,
        uom: uom,
        week_number: weekNumber,
        reference_id: data.transaction_picking_id,
        reference_type: 'TRANSACTION_SCAN_PICKING',
        notes: `Added ${data.quantity_picked} to destination pallet from transaction scan picking`,
      });
    }

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

      // Revert existing pallet operations
      await this.revertPalletOperations(existing, itemId, uom, weekNumber, transactionPickingId);

      // Apply new pallet operations based on updated data
      const newPalletSourceId = data.pallet_source_id ?? existing.pallet_source_id;
      const newPalletUseId = data.pallet_use_id ?? existing.pallet_use_id;
      const newPalletSwitchId = data.pallet_switch_id ?? existing.pallet_switch_id;

      // Apply new source pallet operation
      if (newPalletSourceId && quantityPicked > 0) {
        await this.masterPalletService.updateQuantity(newPalletSourceId, {
          item_id: itemId,
          quantity: quantityPicked,
          operation_type: QuantityOperationType.PICK,
          uom: uom,
          week_number: weekNumber,
          reference_id: transactionPickingId,
          reference_type: 'TRANSACTION_SCAN_PICKING',
          notes: `Picked ${quantityPicked} from source pallet for transaction scan picking (updated)`,
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
          reference_id: transactionPickingId,
          reference_type: 'TRANSACTION_SCAN_PICKING',
          notes: `Switched ${quantitySwitch} to switch pallet from transaction scan picking (updated)`,
        });
      }

      // Apply new use pallet operation
      if (newPalletUseId && quantityPicked > 0) {
        await this.masterPalletService.updateQuantity(newPalletUseId, {
          item_id: itemId,
          quantity: quantityPicked,
          operation_type: QuantityOperationType.ADD,
          uom: uom,
          week_number: weekNumber,
          reference_id: transactionPickingId,
          reference_type: 'TRANSACTION_SCAN_PICKING',
          notes: `Added ${quantityPicked} to destination pallet from transaction scan picking (updated)`,
        });
      }
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

    if (!itemId) {
      throw new BadRequestException('item_id is required to revert pallet operations');
    }

    // Revert all pallet operations
    await this.revertPalletOperations(existing, itemId, uom, weekNumber, existing.transaction_picking_id);

    // Remove the transaction scan picking record
    await this.repository.remove(id);
  }

  async inspectionApproved(id: string, inspection_by: string): Promise<ScanPickingTransaction> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Transaction scan picking tidak ditemukan');
    }
    return this.repository.update(id, { status: ScanPickingStatus.INSPECTION, inspection_by: inspection_by });
  }
  
  private async revertPalletOperations(
    existing: ScanPickingTransaction,
    itemId: string,
    uom: string | undefined,
    weekNumber: number | undefined,
    transactionPickingId: string,
  ): Promise<void> {
    // Revert source pallet: Add back the picked quantity (reverse PICK)
    if (existing.pallet_source_id && existing.quantity_picked > 0) {
      await this.masterPalletService.updateQuantity(existing.pallet_source_id, {
        item_id: itemId,
        quantity: existing.quantity_picked,
        operation_type: QuantityOperationType.ADD,
        uom: uom,
        week_number: weekNumber,
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
        reference_id: transactionPickingId,
        reference_type: 'TRANSACTION_SCAN_PICKING',
        notes: `Reverted: Removed ${quantitySwitch} from switch pallet`,
      });
    }

    // Revert use pallet: Remove the added quantity (reverse ADD)
    if (existing.pallet_use_id && existing.quantity_picked > 0) {
      await this.masterPalletService.updateQuantity(existing.pallet_use_id, {
        item_id: itemId,
        quantity: existing.quantity_picked,
        operation_type: QuantityOperationType.REMOVE,
        uom: uom,
        week_number: weekNumber,
        reference_id: transactionPickingId,
        reference_type: 'TRANSACTION_SCAN_PICKING',
        notes: `Reverted: Removed ${existing.quantity_picked} from destination pallet`,
      });
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
}

