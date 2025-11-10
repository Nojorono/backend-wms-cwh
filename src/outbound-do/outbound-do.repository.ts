import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OutboundDo } from '../core/domain/entities/outbound-do.entity';
import { OutboundMemo } from '../core/domain/entities/outbound-memo.entity';
import { CreateOutboundDoDto } from './dto/create-outbound-do.dto';
import { UpdateOutboundDoDto } from './dto/update-outbound-do.dto';

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
    const outboundDos = await this.outboundDoRepository.find({
      relations: ['outbound_memos'],
      order: { createdAt: 'DESC' },
    });

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
}
