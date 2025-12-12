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

@Injectable()
export class TransactionPickingService {
  constructor(
    private readonly repository: TransactionPickingRepository,
    private readonly paginationService: PaginationService,
    private readonly transactionScanPickingRepository: TransactionScanPickingRepository,
    private readonly inventoryTrackingService: InventoryTrackingService,
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

  async findByMemoId(memoId: string): Promise<PickingTransaction[]> {
    return this.repository.findByMemoId(memoId);
  }

  async findByDoId(doId: string): Promise<PickingTransaction[]> {
    return this.repository.findByDoId(doId);
  }

  async findByStatus(status: string): Promise<PickingTransaction[]> {
    return this.repository.findByStatus(status);
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

      // Collect all unique pallet IDs from scan picking transactions
      const palletIds = new Set<string>();
      for (const scanPicking of scanPickingTransactions) {
        if (scanPicking.pallet_use_id) {
          palletIds.add(scanPicking.pallet_use_id);
        }
        if (scanPicking.pallet_source_id) {
          palletIds.add(scanPicking.pallet_source_id);
        }
        if (scanPicking.pallet_switch_id) {
          palletIds.add(scanPicking.pallet_switch_id);
        }
      }

      // Update inventory tracking status for each pallet from PICKED to IN_INVENTORY
      for (const palletId of palletIds) {
        try {
          const inventoryTracking = await this.inventoryTrackingService.findOneByPalletId(palletId);
          
          // Only update if current status is PICKED
          if (inventoryTracking.inventory_status === 'PICKED') {
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
