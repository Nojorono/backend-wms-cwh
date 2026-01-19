import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionPickingRepository } from './transaction-picking.repository';
import { CreateTransactionPickingDto, CreateManyTransactionPickingDto } from './dto/create-transaction-picking.dto';
import { UpdateTransactionPickingDto } from './dto/update-transaction-picking.dto';
import { PickingTransaction, Status } from '../core/domain/entities/transaction-picking.entity';
import { PaginationQueryDto, PaginatedResponseDto } from '../core/dto/pagination.dto';
import { TransactionPickingPaginationDto } from './dto/transaction-picking-pagination.dto';
import { PaginationService } from '../core/services/pagination.service';
import { TransactionScanPickingRepository } from '../transaction-scan-picking/transaction-scan-picking.repository';
import { InventoryTrackingService } from '../inventory-tracking/inventory-tracking.service';
import { MasterPalletService } from '../master-pallet/master-pallet.service';
import { StatusInventory, QuantityOperationType, PalletTransactionHistory } from '../core/domain/entities/transaction-pallet-history.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TransactionPickingService {
  constructor(
    private readonly repository: TransactionPickingRepository,
    private readonly paginationService: PaginationService,
    private readonly transactionScanPickingRepository: TransactionScanPickingRepository,
    private readonly inventoryTrackingService: InventoryTrackingService,
    private readonly masterPalletService: MasterPalletService,
    @InjectRepository(PalletTransactionHistory)
    private readonly palletHistoryRepository: Repository<PalletTransactionHistory>,
  ) {}

  async create(data: CreateTransactionPickingDto): Promise<PickingTransaction> {
    // Validasi quantity harus positif
    if (data.quantity <= 0) {
      throw new BadRequestException('Quantity harus lebih dari 0');
    }

    return this.repository.create(data);
  }

  async createMany(dto: CreateManyTransactionPickingDto): Promise<PickingTransaction[]> {
    if (!dto.data || dto.data.length === 0) {
      throw new BadRequestException('Minimal 1 data picking');
    }

    dto.data.forEach((item) => {
      if (item.quantity <= 0) {
        throw new BadRequestException('Quantity harus lebih dari 0');
      }
    });

    return this.repository.createMany(dto.data);
  }

  async findAll(
    paginationQuery: TransactionPickingPaginationDto,
  ): Promise<PaginatedResponseDto<PickingTransaction>> {
    const normalizedQuery: TransactionPickingPaginationDto = {
      ...paginationQuery,
      page: paginationQuery.page ?? 1,
      limit: paginationQuery.limit ?? 10,
      sortOrder: paginationQuery.sortOrder ?? 'DESC',
    };

    const { data, total } = await this.repository.findAllPaginated(normalizedQuery);

    return this.paginationService.createPaginatedResponse(data, normalizedQuery, total);
  }

  async findOne(id: string): Promise<PickingTransaction> {
    const pickingTransaction = await this.repository.findOne(id);
    if (!pickingTransaction) {
      throw new NotFoundException('Transaction picking tidak ditemukan');
    }
    return pickingTransaction;
  }

  async update(id: string, data: UpdateTransactionPickingDto): Promise<PickingTransaction> {
    const existing = await this.repository.findOne(id);
    if (!existing) {
      throw new NotFoundException('Transaction picking tidak ditemukan');
    }

    // Validasi quantity jika diupdate
    if (data.quantity !== undefined && data.quantity <= 0) {
      throw new BadRequestException('Quantity harus lebih dari 0');
    }

    // Validasi status transition
    if (data.status && existing.status !== data.status) {
      this.validateStatusTransition(existing.status, data.status);
    }

    return this.repository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.repository.findOne(id);
    if (!existing) {
      throw new NotFoundException('Transaction picking tidak ditemukan');
    }

    // Validasi tidak bisa delete jika status sudah COMPLETED
    if (existing.status === Status.COMPLETED) {
      throw new BadRequestException(
        'Tidak dapat menghapus transaction picking yang sudah COMPLETED',
      );
    }

    return this.repository.remove(id);
  }

  async findByMemoId(memoId: string, status?: Status): Promise<PickingTransaction[]> {
    return this.repository.findByMemoId(memoId, status);
  }

  async findByDoId(doId: string): Promise<PickingTransaction[]> {
    return this.repository.findByDoId(doId);
  }

  async findByStatus(status: string): Promise<PickingTransaction[]> {
    return this.repository.findByStatus(status);
  }

  async findByItemId(itemId: string): Promise<PickingTransaction[]> {
    return this.repository.findByItemId(itemId);
  }

  async updateStatus(id: string, status: Status): Promise<PickingTransaction> {
    const existing = await this.repository.findOne(id);
    if (!existing) {
      throw new NotFoundException('Transaction picking tidak ditemukan');
    }

    this.validateStatusTransition(existing.status, status);

    return this.repository.updateStatus(id, status);
  }

  async findAllByMemoId(memoId: string): Promise<PickingTransaction[]> {
    return this.repository.findByMemoId(memoId);
  }

  private validateStatusTransition(currentStatus: Status, newStatus: Status): void {
    const validTransitions: Record<Status, Status[]> = {
      [Status.PENDING]: [Status.COMPLETED, Status.CANCELLED],
      [Status.COMPLETED]: [],
      [Status.CANCELLED]: [Status.PENDING],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Tidak dapat mengubah status dari ${currentStatus} ke ${newStatus}`,
      );
    }
  }

  async detachMemo(memoId: string): Promise<void> {
    return this.repository.detachMemo(memoId);
  }

  async cancelTransaction(transactionId: string): Promise<void> {
    await this.repository.cancelTransaction(transactionId);
    
    // Update inventory tracking status from PICKED to IN_INVENTORY for related pallets
    await this.revertInventoryTrackingStatus(transactionId);
    
    // Set items to READY status in transaction_pallet_history for pallet_use_id
    await this.setItemsToReadyStatus(transactionId);
  }

  async cancelTransactionByMemoId(memoId: string): Promise<void> {
    await this.repository.cancelTransactionByMemoId(memoId);
    
    // Get all transactions for this memo and revert their inventory tracking
    const transactions = await this.repository.findByMemoId(memoId);
    for (const transaction of transactions) {
      await this.revertInventoryTrackingStatus(transaction.id);
    }
  }

  /**
   * Revert inventory tracking status from PICKED to IN_INVENTORY
   * for all pallets related to transaction-scan-picking records
   * Only reverts if there are no other active transaction pickings (PENDING or COMPLETED)
   * for the same pallet with different items
   */
  private async revertInventoryTrackingStatus(transactionPickingId: string): Promise<void> {
    try {
      // Find all transaction-scan-picking records for this transaction picking
      const scanPickingTransactions = await this.transactionScanPickingRepository.findAll({
        transactionPickingId: transactionPickingId,
      });

      if (scanPickingTransactions.length === 0) {
        return;
      }

      // Collect all unique pallet_use_id from scan picking transactions
      const palletIds = new Set<string>();
      for (const scanPicking of scanPickingTransactions) {
        if (scanPicking.pallet_use_id) {
          palletIds.add(scanPicking.pallet_use_id);
        }
      }

      // Update inventory tracking status for each pallet from PICKED to IN_INVENTORY
      // Only revert if there are no other active transaction pickings for the same pallet
      for (const palletId of palletIds) {
        try {
          // Check if there are other active transaction pickings (PENDING or COMPLETED)
          // that use the same pallet but for different items
          const otherActiveTransactions = await this.repository.findActiveByPalletId(
            palletId,
            transactionPickingId,
          );

          // If there are other active transaction pickings for this pallet, don't revert
          // The pallet is still being used for other items
          if (otherActiveTransactions.length > 0) {
            console.log(
              `Skipping inventory tracking revert for pallet ${palletId}: ` +
                `Found ${otherActiveTransactions.length} other active transaction pickings for this pallet`,
            );
            continue;
          }

          // No other active transaction pickings found, safe to revert
          // Find all inventory tracking records with status PICKED for this pallet
          const inventoryTrackings = await this.inventoryTrackingService.findAllByPalletId(
            palletId,
            'PICKED',
          );

          if (inventoryTrackings.length === 0) {
            // No PICKED records found, skip
            continue;
          }

          // Update all PICKED records to IN_INVENTORY
          for (const inventoryTracking of inventoryTrackings) {
            await this.inventoryTrackingService.update(inventoryTracking.id, {
              inventory_status: 'IN_INVENTORY',
              inventory_note: `Reverted from PICKED to IN_INVENTORY due to transaction picking cancellation`,
              inventory_date: new Date(),
            });
          }
        } catch (error) {
          // If inventory tracking not found or other error, log and continue
          if (error instanceof NotFoundException) {
            // Pallet doesn't have inventory tracking, skip
            continue;
          }
          console.error(`Failed to revert inventory tracking for pallet ${palletId}:`, error);
        }
      }
    } catch (error) {
      // Log error but don't fail the cancellation
      console.error(`Failed to revert inventory tracking status for transaction ${transactionPickingId}:`, error);
    }
  }

  /**
   * Set items to READY status in transaction_pallet_history for pallet_use_id
   * when transaction picking is cancelled
   */
  private async setItemsToReadyStatus(transactionPickingId: string): Promise<void> {
    try {
      // Find all transaction-scan-picking records for this transaction picking
      const scanPickingTransactions = await this.transactionScanPickingRepository.findAll({
        transactionPickingId: transactionPickingId,
      });

      if (scanPickingTransactions.length === 0) {
        return;
      }

      // Process each scan picking transaction to update items in pallet_use_id
      for (const scanPicking of scanPickingTransactions) {
        if (!scanPicking.pallet_use_id || !scanPicking.item_id) {
          continue;
        }

        try {
          // Build where condition for querying latest history record
          const whereCondition: any = {
            pallet_id: scanPicking.pallet_use_id,
            item_id: scanPicking.item_id,
          };

          // Only add UOM filter if it exists
          if (scanPicking.uom) {
            whereCondition.uom = scanPicking.uom;
          }

          // Get the latest history record for this item on the pallet using query builder
          // to handle soft deletes properly
          const queryBuilder = this.palletHistoryRepository
            .createQueryBuilder('history')
            .where('history.pallet_id = :palletId', { palletId: scanPicking.pallet_use_id })
            .andWhere('history.item_id = :itemId', { itemId: scanPicking.item_id })
            .andWhere('history.deletedAt IS NULL')
            .orderBy('history.createdAt', 'DESC');

          // Only add UOM filter if it exists
          if (scanPicking.uom) {
            queryBuilder.andWhere('history.uom = :uom', { uom: scanPicking.uom });
          }

          const latestHistory = await queryBuilder.getOne();

          if (!latestHistory || latestHistory.new_quantity === 0) {
            // No quantity on pallet or no history record, skip
            continue;
          }

          // Only update if current status is PENDING
          if (latestHistory.status_inventory === StatusInventory.PENDING) {
            // Use query builder to update the status
            await this.palletHistoryRepository
              .createQueryBuilder()
              .update(PalletTransactionHistory)
              .set({ status_inventory: StatusInventory.READY })
              .where('id = :id', { id: latestHistory.id })
              .andWhere('deletedAt IS NULL')
              .execute();
          }
        } catch (error) {
          console.error(
            `Failed to set item ${scanPicking.item_id} to READY status for pallet ${scanPicking.pallet_use_id}:`,
            error,
          );
        }
      }
    } catch (error) {
      // Log error but don't fail the cancellation
      console.error(`Failed to set items to READY status for transaction ${transactionPickingId}:`, error);
    }
  }

  async detachDo(doId: string): Promise<void> {
    return this.repository.detachDo(doId);
  }

  async attachMemo(transactionIds: string[], memoId: string): Promise<void> {
    if (!transactionIds || transactionIds.length === 0) {
      throw new BadRequestException('Minimal 1 transaction ID harus disediakan');
    }

    // Validasi semua transaction IDs ada
    for (const transactionId of transactionIds) {
      const transaction = await this.repository.findOne(transactionId);
      if (!transaction) {
        throw new NotFoundException(`Transaction picking dengan ID ${transactionId} tidak ditemukan`);
      }
    }

    return this.repository.attachMemo(transactionIds, memoId);
  }

  async attachDo(transactionIds: string[], doId: string): Promise<void> {
    if (!transactionIds || transactionIds.length === 0) {
      throw new BadRequestException('Minimal 1 transaction ID harus disediakan');
    }

    // Validasi semua transaction IDs ada
    for (const transactionId of transactionIds) {
      const transaction = await this.repository.findOne(transactionId);
      if (!transaction) {
        throw new NotFoundException(`Transaction picking dengan ID ${transactionId} tidak ditemukan`);
      }
    }

    return this.repository.attachDo(transactionIds, doId);
  }
}
