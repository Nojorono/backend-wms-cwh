import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { OutboundMemoRepository } from './outbound-memo.repository';
import { CreateOutboundMemoDto } from './dto/create-outbound-memo.dto';
import { UpdateOutboundMemoDto } from './dto/update-outbound-memo.dto';
import { OutboundMemo } from '../core/domain/entities/outbound-memo.entity';
import { OutboundMemoStatus } from '../core/domain/entities/outbound-memo.entity';
import { PaginationService } from '../core/services/pagination.service';
import { OutboundMemoPaginationDto } from './dto/outbound-memo-pagination.dto';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class OutboundMemoService {
  constructor(
    private readonly repository: OutboundMemoRepository,
    private readonly paginationService: PaginationService,
    private readonly notificationService: NotificationService,
  ) { }

  async create(data: CreateOutboundMemoDto): Promise<OutboundMemo> {
    // Validasi delivery_date tidak boleh di masa lalu
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(data.delivery_date) < today) {
      throw new BadRequestException('Delivery date tidak boleh di masa lalu');
    }

    // Validasi minimal 1 item
    if (!data.outbound_memo_items || data.outbound_memo_items.length === 0) {
      throw new BadRequestException('Minimal harus ada 1 item');
    }

    // Validasi quantity_plan harus positif
    for (const item of data.outbound_memo_items) {
      if (item.quantity_plan <= 0) {
        throw new BadRequestException('Quantity plan harus lebih dari 0');
      }
    }

    // Generate outbound memo number if not provided
    if (!data.outbound_memo_number) {
      data.outbound_memo_number = await this.generateOutboundMemoNumber();
    } else {
      // Validasi outbound_memo_number harus unique jika diberikan manual
      const existingMemo = await this.repository.findByOutboundMemoNumber(data.outbound_memo_number);
      if (existingMemo) {
        throw new ConflictException('Outbound memo number sudah digunakan');
      }
    }

    return this.repository.create(data);
  }

  async findAll(): Promise<OutboundMemo[]> {
    return this.repository.findAll();
  }

  async findAllPaginated(
    paginationDto: OutboundMemoPaginationDto,
  ): Promise<PaginatedResponseDto<OutboundMemo>> {
    const result = await this.repository.findAllPaginated(paginationDto);
    return this.paginationService.createPaginatedResponse(
      result.data,
      paginationDto,
      result.total,
    );
  }

  async findOne(id: string): Promise<OutboundMemo> {
    return this.repository.findOne(id);
  }

  async update(id: string, data: UpdateOutboundMemoDto): Promise<OutboundMemo> {
    const existing = await this.repository.findOne(id);

    // Validasi delivery_date jika diupdate
    if (data.delivery_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(data.delivery_date) < today) {
        throw new BadRequestException('Delivery date tidak boleh di masa lalu');
      }
    }

    // Validasi quantity_plan jika diupdate
    if (data.outbound_memo_items) {
      for (const item of data.outbound_memo_items) {
        if (item.quantity_plan <= 0) {
          throw new BadRequestException('Quantity plan harus lebih dari 0');
        }
      }
    }

    // Validasi status transition
    let statusChangedToApproved = false;
    if (data.status && existing.status !== data.status) {
      this.validateStatusTransition(existing.status, data.status);
      statusChangedToApproved =
        data.status === OutboundMemoStatus.APPROVED &&
        existing.status !== OutboundMemoStatus.APPROVED;
    }

    const updated = await this.repository.update(id, data);

    if (statusChangedToApproved) {
      this.notificationService.notifyOutboundMemoApproved({
        memoId: updated.id,
        requestor: updated.requestor || 'Unknown',
        rooms: [
          `memo:${updated.id}`,
          'role:SUPERVISOR',
        ],
      });
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const existing = await this.repository.findOne(id);

    // Validasi tidak bisa delete jika status sudah APPROVED
    if (existing.status === OutboundMemoStatus.APPROVED) {
      throw new BadRequestException('Tidak dapat menghapus outbound memo yang sudah APPROVED');
    }

    return this.repository.remove(id);
  }

  async findByStatus(status: string): Promise<OutboundMemo[]> {
    return this.repository.findByStatus(status);
  }

  async updateStatus(id: string, status: OutboundMemoStatus): Promise<OutboundMemo> {
    const existing = await this.repository.findOne(id);
    this.validateStatusTransition(existing.status, status);

    const updated = await this.repository.update(id, { status } as UpdateOutboundMemoDto);

    if (status === OutboundMemoStatus.APPROVED && existing.status !== OutboundMemoStatus.APPROVED) {
      this.notificationService.notifyOutboundMemoApproved({
        memoId: updated.id,
        requestor: updated.requestor || 'Unknown',
        rooms: [
          `memo:${updated.id}`,
          'role:WAREHOUSE_MANAGER',
          'role:PICKER_LEAD',
        ],
      });
    }

    return updated;
  }

  async cancel(id: string): Promise<OutboundMemo> {
    const existing = await this.repository.findOne(id);
    if (!existing) {
      throw new BadRequestException('Outbound memo not found');
    }
    return this.repository.update(id, { status: OutboundMemoStatus.CANCELLED });
  }

  private validateStatusTransition(
    currentStatus: OutboundMemoStatus,
    newStatus: OutboundMemoStatus,
  ): void {
    const validTransitions: Record<OutboundMemoStatus, OutboundMemoStatus[]> = {
      [OutboundMemoStatus.PENDING]: [
        OutboundMemoStatus.APPROVED,
        OutboundMemoStatus.CANCELLED,
      ],
      [OutboundMemoStatus.APPROVED]: [OutboundMemoStatus.CANCELLED, OutboundMemoStatus.COMPLETED],
      [OutboundMemoStatus.CANCELLED]: [],
      [OutboundMemoStatus.COMPLETED]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Tidak dapat mengubah status dari ${currentStatus} ke ${newStatus}`,
      );
    }
  }

  private async generateOutboundMemoNumber(): Promise<string> {
    return await this.repository.getNextOutboundMemoNumberForDate(new Date());
  }
}
