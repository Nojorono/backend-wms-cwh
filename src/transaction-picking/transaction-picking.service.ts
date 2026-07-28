import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionPickingRepository } from './transaction-picking.repository';
import { CreateTransactionPickingDto, CreateManyTransactionPickingDto } from './dto/create-transaction-picking.dto';
import { UpdateTransactionPickingDto } from './dto/update-transaction-picking.dto';
import { PickingTransaction, Status } from '../core/domain/entities/transaction-picking.entity';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { TransactionPickingPaginationDto } from './dto/transaction-picking-pagination.dto';
import { PaginationService } from '../core/services/pagination.service';
import { TransactionPickingCancelRevertService } from './transaction-picking-cancel-revert.service';

@Injectable()
export class TransactionPickingService {
  constructor(
    private readonly repository: TransactionPickingRepository,
    private readonly paginationService: PaginationService,
    private readonly cancelRevertService: TransactionPickingCancelRevertService,
  ) { }

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
    const existing = await this.repository.findOne(transactionId);
    if (!existing) {
      throw new NotFoundException('Transaction picking tidak ditemukan');
    }
    if (existing.status === Status.CANCELLED) {
      return;
    }
    if (existing.status === Status.COMPLETED) {
      throw new BadRequestException(
        'Tidak dapat membatalkan transaction picking yang sudah COMPLETED',
      );
    }

    await this.cancelRevertService.revertForCancelledTransaction(transactionId);
    await this.repository.cancelTransaction(transactionId);
  }

  async cancelTransactionByMemoId(memoId: string): Promise<void> {
    const transactions = await this.repository.findByMemoId(memoId);
    for (const transaction of transactions) {
      if (
        transaction.status !== Status.CANCELLED &&
        transaction.status !== Status.COMPLETED
      ) {
        await this.cancelRevertService.revertForCancelledTransaction(transaction.id);
      }
    }
    await this.repository.cancelTransactionByMemoId(memoId);
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
