import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionPickingRepository } from './transaction-picking.repository';
import { CreateTransactionPickingDto } from './dto/create-transaction-picking.dto';
import { UpdateTransactionPickingDto } from './dto/update-transaction-picking.dto';
import { PickingTransaction, Status } from '../core/domain/entities/transaction-picking.entity';

@Injectable()
export class TransactionPickingService {
  constructor(private readonly repository: TransactionPickingRepository) {}

  async create(data: CreateTransactionPickingDto): Promise<PickingTransaction> {
    // Validasi quantity harus positif
    if (data.quantity <= 0) {
      throw new BadRequestException('Quantity harus lebih dari 0');
    }

    return this.repository.create(data);
  }

  async findAll(): Promise<PickingTransaction[]> {
    return this.repository.findAll();
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
}
