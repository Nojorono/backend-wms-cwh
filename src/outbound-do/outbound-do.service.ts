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

    // Generate outbound_do_number jika tidak provided
    if (!data.outbound_do_number) {
      data.outbound_do_number = await this.repository.getNextOutboundDoNumberForDate(
        data.delivery_date,
      );
    } else {
      // Validasi outbound_do_number harus unique jika provided
      const existingDo = await this.repository.findByOutboundDoNumber(data.outbound_do_number);
      if (existingDo) {
        throw new ConflictException('Outbound DO number sudah digunakan');
      }
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

  async removeMemo(id: string, memoId?: string): Promise<OutboundDo> {
    const outboundDo = await this.repository.findOne(id);

    // If memoId is not provided, remove all memos
    if (!memoId) {
      const memoIds = await this.repository.removeAllMemosFromOutboundDo(id);
      await this.repository.updateMultipleMemosHasDo(memoIds, false);
      return this.repository.findOne(id);
    }

    // Remove specific memo
    // Check if memo exists in the outbound DO
    const memoIndex = outboundDo.memo_id?.indexOf(memoId) ?? -1;
    const memoExistsInRelation = outboundDo.outbound_memos?.some((memo) => memo.id === memoId) ?? false;

    if (memoIndex === -1 && !memoExistsInRelation) {
      throw new BadRequestException('Memo not found in outbound DO');
    }

    // Remove memo from outbound DO
    const updatedOutboundDo = await this.repository.removeMemoFromOutboundDo(id, memoId);

    // Update the memo's has_do flag to false
    await this.repository.updateMemoHasDo(memoId, false);

    return updatedOutboundDo;
  }

  async attachMemo(id: string, memoId: string, sequence?: number): Promise<OutboundDo> {
    // Get outbound DO
    const outboundDo = await this.repository.findOne(id);

    // Check if memo already exists
    const memoIndex = outboundDo.memo_id?.indexOf(memoId) ?? -1;
    if (memoIndex !== -1) {
      throw new BadRequestException('Memo already attached to outbound DO');
    }

    // Verify memo exists
    const memo = await this.repository.findMemoById(memoId);
    if (!memo) {
      throw new BadRequestException(`Outbound memo with ID ${memoId} not found`);
    }

    // Calculate sequence if not provided
    let newSequence = sequence;
    if (!newSequence) {
      const existingSequences = outboundDo.memo_sequence || [];
      newSequence = existingSequences.length > 0 ? Math.max(...existingSequences) + 1 : 1;
    }

    // Validate sequence is unique
    const existingSequences = outboundDo.memo_sequence || [];
    if (existingSequences.includes(newSequence)) {
      throw new BadRequestException(
        `Sequence ${newSequence} already exists. Please provide a unique sequence.`,
      );
    }

    // Validate sequence is positive
    if (newSequence <= 0) {
      throw new BadRequestException('Sequence must be positive');
    }

    // Update memo's has_do flag if needed
    if (!memo.has_do) {
      await this.repository.updateMemoHasDo(memoId, true);
    }

    // Add memo to outbound DO
    return this.repository.addMemoToOutboundDo(id, memoId, newSequence, memo);
  }
}
