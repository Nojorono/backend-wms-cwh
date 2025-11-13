import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { OutboundDoRepository } from './outbound-do.repository';
import { CreateOutboundDoDto } from './dto/create-outbound-do.dto';
import { UpdateOutboundDoDto } from './dto/update-outbound-do.dto';
import { OutboundDo, OutboundDoStatus } from '../core/domain/entities/outbound-do.entity';
import { PaginationService } from '../core/services/pagination.service';
import { OutboundDoPaginationDto } from './dto/outbound-do-pagination.dto';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';

@Injectable()
export class OutboundDoService {
  constructor(
    private readonly repository: OutboundDoRepository,
    private readonly paginationService: PaginationService,
  ) {}

  async create(data: CreateOutboundDoDto): Promise<OutboundDo> {
    // Validasi delivery_date tidak boleh di masa lalu
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(data.delivery_date) < today) {
      throw new BadRequestException('Delivery date tidak boleh di masa lalu');
    }

    // Validasi outbound_do_number harus unique
    const existingDo = await this.repository.findByOutboundDoNumber(data.outbound_do_number);
    if (existingDo) {
      throw new ConflictException('Outbound DO number sudah digunakan');
    }

    // Validasi minimal 1 outbound memo
    if (!data.outbound_memo_ids || data.outbound_memo_ids.length === 0) {
      throw new BadRequestException('Minimal harus ada 1 outbound memo');
    }

    // Validasi sequence numbers harus unique dan positif
    const sequences = data.outbound_memo_ids.map((item) => item.sequence);
    const uniqueSequences = new Set(sequences);
    if (sequences.length !== uniqueSequences.size) {
      throw new BadRequestException('Sequence numbers must be unique');
    }

    if (sequences.some((seq) => seq <= 0)) {
      throw new BadRequestException('Sequence numbers must be positive');
    }

    // Validasi phone number format
    if (data.driver_phone && !this.isValidPhoneNumber(data.driver_phone)) {
      throw new BadRequestException('Format nomor telepon tidak valid');
    }

    return this.repository.create(data);
  }

  async findAll(): Promise<OutboundDo[]> {
    return this.repository.findAll();
  }

  async findAllPaginated(
    paginationDto: OutboundDoPaginationDto,
  ): Promise<PaginatedResponseDto<OutboundDo>> {
    const result = await this.repository.findAllPaginated(paginationDto);
    return this.paginationService.createPaginatedResponse(
      result.data,
      paginationDto,
      result.total,
    );
  }

  async findOne(id: string): Promise<OutboundDo> {
    return this.repository.findOneWithMemoSequence(id);
  }

  async update(id: string, data: UpdateOutboundDoDto): Promise<OutboundDo> {
    const existing = await this.repository.findOne(id);

    // Validasi delivery_date jika diupdate
    if (data.delivery_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(data.delivery_date) < today) {
        throw new BadRequestException('Delivery date tidak boleh di masa lalu');
      }
    }

    // Validasi outbound_do_number unique jika diupdate
    if (data.outbound_do_number && data.outbound_do_number !== existing.outbound_do_number) {
      const existingDo = await this.repository.findByOutboundDoNumber(data.outbound_do_number);
      if (existingDo) {
        throw new ConflictException('Outbound DO number sudah digunakan');
      }
    }

    // Validasi phone number format jika diupdate
    if (data.driver_phone && !this.isValidPhoneNumber(data.driver_phone)) {
      throw new BadRequestException('Format nomor telepon tidak valid');
    }

    // Validasi status transition
    if (data.status && existing.status !== data.status) {
      this.validateStatusTransition(existing.status, data.status);
    }

    return this.repository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.repository.findOne(id);

    // Validasi tidak bisa delete jika status sudah COMPLETED
    if (existing.status === OutboundDoStatus.COMPLETED) {
      throw new BadRequestException('Tidak dapat menghapus outbound DO yang sudah COMPLETED');
    }

    return this.repository.remove(id);
  }

  async findByStatus(status: string): Promise<OutboundDo[]> {
    return this.repository.findByStatus(status);
  }

  async findByOutboundType(outbound_type: string): Promise<OutboundDo[]> {
    return this.repository.findByOutboundType(outbound_type);
  }

  async updateStatus(id: string, status: OutboundDoStatus): Promise<OutboundDo> {
    const existing = await this.repository.findOne(id);
    this.validateStatusTransition(existing.status, status);

    return this.repository.update(id, { status } as UpdateOutboundDoDto);
  }

  private validateStatusTransition(
    currentStatus: OutboundDoStatus,
    newStatus: OutboundDoStatus,
  ): void {
    const validTransitions: Record<OutboundDoStatus, OutboundDoStatus[]> = {
      [OutboundDoStatus.PENDING]: [OutboundDoStatus.IN_PROGRESS, OutboundDoStatus.CANCELLED, OutboundDoStatus.APPROVED, OutboundDoStatus.COMPLETED],
      [OutboundDoStatus.IN_PROGRESS]: [OutboundDoStatus.COMPLETED, OutboundDoStatus.CANCELLED],
      [OutboundDoStatus.APPROVED]: [OutboundDoStatus.COMPLETED, OutboundDoStatus.CANCELLED],
      [OutboundDoStatus.COMPLETED]: [],
      [OutboundDoStatus.CANCELLED]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Tidak dapat mengubah status dari ${currentStatus} ke ${newStatus}`,
      );
    }
  }

  private isValidPhoneNumber(phone: string): boolean {
    // Validasi format nomor telepon Indonesia
    const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
    return phoneRegex.test(phone);
  }

  async getMemoSequence(outboundDoId: string): Promise<{ memoId: string; sequence: number }[]> {
    return this.repository.getMemoSequence(outboundDoId);
  }

  async findByAssignedUserId(userId: string): Promise<OutboundDo[]> {
    return this.repository.findByAssignedUserId(userId);
  }
}
