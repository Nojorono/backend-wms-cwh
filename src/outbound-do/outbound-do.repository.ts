import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OutboundDo } from '../core/domain/entities/outbound-do.entity';
import { OutboundMemo } from '../core/domain/entities/outbound-memo.entity';
import { CreateOutboundDoDto } from './dto/create-outbound-do.dto';
import { UpdateOutboundDoDto } from './dto/update-outbound-do.dto';
import { OutboundDoPaginationDto } from './dto/outbound-do-pagination.dto';

@Injectable()
export class OutboundDoRepository {
  constructor(
    @InjectRepository(OutboundDo)
    private readonly outboundDoRepository: Repository<OutboundDo>,
    @InjectRepository(OutboundMemo)
    private readonly outboundMemoRepository: Repository<OutboundMemo>,
  ) {}

  async create(data: CreateOutboundDoDto): Promise<OutboundDo> {
    const { outbound_memo_ids, ...outboundDoData } = data;

    // Extract memo IDs and sequences from the new structure
    const memoIds = outbound_memo_ids?.map((item) => item.memo_id) || [];
    const memoSequences = outbound_memo_ids?.map((item) => item.sequence) || [];

    // Create outbound do
    const outboundDo = this.outboundDoRepository.create({
      ...outboundDoData,
      memo_id: memoIds,
      memo_sequence: memoSequences,
      status: data.status || ('PENDING' as any),
    });

    // Process outbound memos sequentially with provided sequence tracking
    if (outbound_memo_ids && outbound_memo_ids.length > 0) {
      const outboundMemos: OutboundMemo[] = [];

      // Sort by sequence to process in order
      const sortedMemos = [...outbound_memo_ids].sort((a, b) => a.sequence - b.sequence);

      for (const memoItem of sortedMemos) {
        try {
          console.log(`Processing memo ${memoItem.memo_id} with sequence ${memoItem.sequence}`);

          const memo = await this.outboundMemoRepository.findOne({
            where: { id: memoItem.memo_id },
          });

          if (!memo) {
            throw new BadRequestException(`Outbound memo with ID ${memoItem.memo_id} not found`);
          }

          if (!memo.has_do) {
            await this.outboundMemoRepository.update(memo.id, { has_do: true });
            memo.has_do = true;
          }

          outboundMemos.push(memo);

          console.log(
            `Successfully processed memo ${memoItem.memo_id} in sequence ${memoItem.sequence}`,
          );
        } catch (error) {
          if (error instanceof BadRequestException) {
            throw error;
          }
          throw new BadRequestException(
            `Failed to process memo ${memoItem.memo_id} in sequence ${memoItem.sequence}: ${error.message}`,
          );
        }
      }

      outboundDo.outbound_memos = outboundMemos;
    }

    const savedOutboundDo = await this.outboundDoRepository.save(outboundDo);
    return this.findOne(savedOutboundDo.id);
  }

  async findAll(): Promise<OutboundDo[]> {
    const outboundDos = await this.outboundDoRepository
      .createQueryBuilder('outbound_do')
      .leftJoinAndSelect('outbound_do.outbound_memos', 'outbound_memos')
      .leftJoinAndSelect('outbound_memos.outbound_memo_items', 'outbound_memo_items')
      .leftJoinAndSelect('outbound_memos.transaction_pickings', 'transaction_pickings')
      .leftJoinAndSelect('outbound_memos.assigned_pickings', 'assigned_pickings')
      .orderBy('outbound_do.createdAt', 'DESC')
      .distinct(true)
      .getMany();

    // Add sequence information to each memo in all outbound DOs
    return outboundDos.map((outboundDo) => this.addSequenceToMemos(outboundDo));
  }

  async findOne(id: string): Promise<OutboundDo> {
    const entity = await this.outboundDoRepository.findOne({
      where: { id },
      relations: ['outbound_memos'],
    });
    if (!entity) throw new NotFoundException('Outbound DO not found');
    return entity;
  }

  async findByOutboundDoNumber(outbound_do_number: string): Promise<OutboundDo | null> {
    return await this.outboundDoRepository.findOne({
      where: { outbound_do_number },
      relations: ['outbound_memos'],
    });
  }

  async update(id: string, data: UpdateOutboundDoDto): Promise<OutboundDo> {
    const existing = await this.findOne(id);

    const previousMemoIds =
      existing.memo_id && existing.memo_id.length > 0
        ? [...existing.memo_id]
        : existing.outbound_memos?.map((memo) => memo.id) ?? [];

    const { outbound_memo_ids, ...outboundDoData } = data;

    // Update outbound do
    const updateData: any = { ...outboundDoData };
    if (outbound_memo_ids !== undefined) {
      // Extract memo IDs and sequences from the new structure
      const memoIds = outbound_memo_ids?.map((item) => item.memo_id) || [];
      const memoSequences = outbound_memo_ids?.map((item) => item.sequence) || [];

      updateData.memo_id = memoIds;
      updateData.memo_sequence = memoSequences;
    }

    await this.outboundDoRepository.update(id, updateData);

    // Update outbound memos if provided
    if (outbound_memo_ids !== undefined) {
      const outboundDo = await this.outboundDoRepository.findOne({
        where: { id },
        relations: ['outbound_memos'],
      });

      if (outboundDo) {
        if (outbound_memo_ids.length > 0) {
          // Process outbound memos sequentially with provided sequence tracking
          const outboundMemos: OutboundMemo[] = [];

          // Sort by sequence to process in order
          const sortedMemos = [...outbound_memo_ids].sort((a, b) => a.sequence - b.sequence);

          const updatedMemoIds = sortedMemos.map((item) => item.memo_id);
          for (const memoItem of sortedMemos) {
            try {
              console.log(`Updating memo ${memoItem.memo_id} with sequence ${memoItem.sequence}`);

              const memo = await this.outboundMemoRepository.findOne({
                where: { id: memoItem.memo_id },
              });

              if (!memo) {
                throw new BadRequestException(
                  `Outbound memo with ID ${memoItem.memo_id} not found`,
                );
              }

              if (!memo.has_do) {
                await this.outboundMemoRepository.update(memo.id, { has_do: true });
                memo.has_do = true;
              }

              outboundMemos.push(memo);

              console.log(
                `Successfully updated memo ${memoItem.memo_id} in sequence ${memoItem.sequence}`,
              );
            } catch (error) {
              if (error instanceof BadRequestException) {
                throw error;
              }
              throw new BadRequestException(
                `Failed to process memo ${memoItem.memo_id} in sequence ${memoItem.sequence}: ${error.message}`,
              );
            }
          }

          outboundDo.outbound_memos = outboundMemos;
          const updatedMemoIdSet = new Set(updatedMemoIds);
          const memoIdsToDetach = previousMemoIds.filter(
            (memoId) => !updatedMemoIdSet.has(memoId),
          );
          if (memoIdsToDetach.length > 0) {
            await this.outboundMemoRepository.update(
              { id: In(memoIdsToDetach) },
              { has_do: false },
            );
          }
        } else {
          outboundDo.outbound_memos = [];
          outboundDo.memo_sequence = [];
          if (previousMemoIds.length > 0) {
            await this.outboundMemoRepository.update(
              { id: In(previousMemoIds) },
              { has_do: false },
            );
          }
        }
        await this.outboundDoRepository.save(outboundDo);
      }
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);
    if (existing.outbound_memos && existing.outbound_memos.length > 0) {
      const memoIds = existing.outbound_memos.map((memo) => memo.id);
      await this.outboundMemoRepository.update({ id: In(memoIds) }, { has_do: false });
    }
    await this.outboundDoRepository.delete(id);
  }

  async findByStatus(status: string): Promise<OutboundDo[]> {
    const outboundDos = await this.outboundDoRepository.find({
      where: { status: status as any },
      relations: ['outbound_memos'],
      order: { createdAt: 'DESC' },
    });

    // Add sequence information to each memo
    return outboundDos.map((outboundDo) => this.addSequenceToMemos(outboundDo));
  }

  async findByOutboundType(outbound_type: string): Promise<OutboundDo[]> {
    const outboundDos = await this.outboundDoRepository.find({
      where: { outbound_type: outbound_type as any },
      relations: ['outbound_memos'],
      order: { createdAt: 'DESC' },
    });

    // Add sequence information to each memo
    return outboundDos.map((outboundDo) => this.addSequenceToMemos(outboundDo));
  }

  async findAllPaginated(
    paginationDto: OutboundDoPaginationDto,
  ): Promise<{ data: OutboundDo[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      sortOrder = 'DESC',
      status,
      outbound_type,
    } = paginationDto;

    const qb = this.outboundDoRepository
      .createQueryBuilder('outbound_do')
      .leftJoinAndSelect('outbound_do.outbound_memos', 'outbound_memos')
      .leftJoinAndSelect('outbound_memos.outbound_memo_items', 'outbound_memo_items')
      .leftJoinAndSelect('outbound_memos.transaction_pickings', 'transaction_pickings')
      .leftJoinAndSelect('outbound_memos.assigned_pickings', 'assigned_pickings');

    if (status) {
      qb.andWhere('outbound_do.status = :status', { status });
    }

    if (outbound_type) {
      qb.andWhere('outbound_do.outbound_type = :outbound_type', { outbound_type });
    }

    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(outbound_do.outbound_do_number) LIKE :search OR LOWER(outbound_do.driver_name) LIKE :search OR LOWER(outbound_do.driver_phone) LIKE :search)',
        { search: searchTerm },
      );
    }

    const sortableFields: Record<string, string> = {
      createdAt: 'outbound_do.createdAt',
      updatedAt: 'outbound_do.updatedAt',
      delivery_date: 'outbound_do.delivery_date',
      outbound_do_number: 'outbound_do.outbound_do_number',
      status: 'outbound_do.status',
      outbound_type: 'outbound_do.outbound_type',
      driver_name: 'outbound_do.driver_name',
    };

    const orderField =
      sortBy && sortableFields[sortBy] ? sortableFields[sortBy] : 'outbound_do.createdAt';
    const orderDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    qb.orderBy(orderField, orderDirection);

    const [entities, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const data = entities.map((outboundDo) => this.addSequenceToMemos(outboundDo));

    return { data, total };
  }

  private addSequenceToMemos(outboundDo: OutboundDo): OutboundDo {
    if (outboundDo.outbound_memos && outboundDo.memo_id && outboundDo.memo_sequence) {
      // First, add sequence information to each memo
      const memosWithSequence = outboundDo.outbound_memos.map((memo) => {
        const memoIndex = outboundDo.memo_id.indexOf(memo.id);
        const sequence = outboundDo.memo_sequence[memoIndex] || memoIndex + 1;

        return {
          ...memo,
          sequence: sequence,
        } as any;
      });

      // Then sort by sequence number
      outboundDo.outbound_memos = memosWithSequence.sort((a, b) => a.sequence - b.sequence);
    }
    return outboundDo;
  }

  async getMemoSequence(outboundDoId: string): Promise<{ memoId: string; sequence: number }[]> {
    const outboundDo = await this.findOne(outboundDoId);

    if (!outboundDo.memo_id || !outboundDo.memo_sequence) {
      return [];
    }

    const sequenceData = outboundDo.memo_id.map((memoId, index) => ({
      memoId,
      sequence: outboundDo.memo_sequence[index] || index + 1,
    }));

    // Sort by sequence number
    return sequenceData.sort((a, b) => a.sequence - b.sequence);
  }

  async findOneWithMemoSequence(id: string): Promise<OutboundDo> {
    const outboundDo = await this.outboundDoRepository.findOne({
      where: { id },
      relations: ['outbound_memos'],
    });

    if (!outboundDo) {
      throw new NotFoundException('Outbound DO not found');
    }

    return this.addSequenceToMemos(outboundDo);
  }

  async findByAssignedUserId(userId: string): Promise<OutboundDo[]> {
    const outboundDos = await this.outboundDoRepository
      .createQueryBuilder('outbound_do')
      .innerJoin('outbound_do.outbound_memos', 'outbound_memos')
      .innerJoin('outbound_memos.assigned_pickings', 'assigned_pickings')
      .leftJoinAndSelect('outbound_do.outbound_memos', 'outbound_memos_select')
      .leftJoinAndSelect('outbound_memos_select.outbound_memo_items', 'outbound_memo_items')
      .leftJoinAndSelect('outbound_memos_select.transaction_pickings', 'transaction_pickings')
      .leftJoinAndSelect('outbound_memos_select.assigned_pickings', 'assigned_pickings_select')
      .where('assigned_pickings.picking_user_id = :userId', { userId })
      .andWhere('outbound_do.deletedAt IS NULL')
      .distinct(true)
      .getMany();

    return outboundDos.map((outboundDo) => this.addSequenceToMemos(outboundDo));
  }

  async getNextOutboundDoNumberForDate(date: Date): Promise<string> {
    const y = date.getFullYear().toString();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const prefix = `DO-${y}${m}${d}-`;
    const row = await this.outboundDoRepository
      .createQueryBuilder('outbound_do')
      .select('outbound_do.outbound_do_number', 'num')
      .where('outbound_do.outbound_do_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('outbound_do.outbound_do_number', 'DESC')
      .limit(1)
      .getRawOne<{ num?: string }>();
    let seq = 1;
    if (row?.num && row.num.startsWith(prefix)) {
      const tail = row.num.substring(prefix.length);
      const parsed = parseInt(tail, 10);
      if (!Number.isNaN(parsed)) {
        seq = parsed + 1;
      }
    }
    return `${prefix}${seq.toString().padStart(4, '0')}`;
  }

  async removeMemo(id: string, memoId?: string): Promise<OutboundDo> {
    const outboundDo = await this.findOne(id);

    // If memoId is not provided, remove all memos
    if (!memoId) {
      // Get all memo IDs before removing
      const memoIds =
        outboundDo.memo_id && outboundDo.memo_id.length > 0
          ? [...outboundDo.memo_id]
          : outboundDo.outbound_memos?.map((memo) => memo.id) ?? [];

      // Clear the relationship
      outboundDo.outbound_memos = [];
      outboundDo.memo_id = [];
      outboundDo.memo_sequence = [];

      // Save the outbound DO
      await this.outboundDoRepository.save(outboundDo);

      // Update all memos' has_do flag to false
      if (memoIds.length > 0) {
        await this.outboundMemoRepository.update({ id: In(memoIds) }, { has_do: false });
      }

      return this.findOne(id);
    }

    // Remove specific memo
    // Check if memo exists in the outbound DO
    const memoIndex = outboundDo.memo_id?.indexOf(memoId) ?? -1;
    if (memoIndex === -1) {
      // Also check in the relationship
      const memoExists = outboundDo.outbound_memos?.some((memo) => memo.id === memoId);
      if (!memoExists) {
        throw new BadRequestException('Memo not found in outbound DO');
      }
    }

    // Remove memo from arrays
    if (outboundDo.memo_id && outboundDo.memo_id.length > 0) {
      const index = outboundDo.memo_id.indexOf(memoId);
      if (index !== -1) {
        outboundDo.memo_id.splice(index, 1);
        if (outboundDo.memo_sequence && outboundDo.memo_sequence.length > index) {
          outboundDo.memo_sequence.splice(index, 1);
        }
      }
    }

    // Remove memo from relationship
    if (outboundDo.outbound_memos && outboundDo.outbound_memos.length > 0) {
      outboundDo.outbound_memos = outboundDo.outbound_memos.filter((memo) => memo.id !== memoId);
    }

    // Save the outbound DO
    await this.outboundDoRepository.save(outboundDo);

    // Update the memo's has_do flag to false
    await this.outboundMemoRepository.update({ id: memoId }, { has_do: false });

    return this.findOne(id);
  }
}
