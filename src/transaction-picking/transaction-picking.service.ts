import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionPickingRepository } from './transaction-picking.repository';
import { CreateTransactionPickingDto, CreateManyTransactionPickingDto } from './dto/create-transaction-picking.dto';
import { UpdateTransactionPickingDto } from './dto/update-transaction-picking.dto';
import { PickingTransaction, Status } from '../core/domain/entities/transaction-picking.entity';
import { PaginationQueryDto, PaginatedResponseDto } from '../core/dto/pagination.dto';
import { PaginationService } from '../core/services/pagination.service';

@Injectable()
export class TransactionPickingService {
  constructor(
    private readonly repository: TransactionPickingRepository,
    private readonly paginationService: PaginationService,
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
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<PickingTransaction>> {
    const normalizedQuery: PaginationQueryDto = {
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

  async detachDo(doId: string): Promise<void> {
    return this.repository.detachDo(doId);
  }
}
