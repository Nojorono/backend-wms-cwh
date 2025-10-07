import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    
    // Create outbound do
    const outboundDo = this.outboundDoRepository.create({
      ...outboundDoData,
      memo_id: outbound_memo_ids || [],
      status: data.status || 'PENDING' as any,
    });

    // Find and attach outbound memos
    if (outbound_memo_ids && outbound_memo_ids.length > 0) {
      const outboundMemos = await this.outboundMemoRepository.findByIds(outbound_memo_ids);
      outboundDo.outbound_memos = outboundMemos;
    }

    const savedOutboundDo = await this.outboundDoRepository.save(outboundDo);
    return this.findOne(savedOutboundDo.id);
  }

  async findAll(): Promise<OutboundDo[]> {
    return await this.outboundDoRepository.find({
      relations: ['outbound_memos'],
      order: { createdAt: 'DESC' },
    });
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
    
    const { outbound_memo_ids, ...outboundDoData } = data;
    
    // Update outbound do
    const updateData: any = { ...outboundDoData };
    if (outbound_memo_ids !== undefined) {
      updateData.memo_id = outbound_memo_ids;
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
          const outboundMemos = await this.outboundMemoRepository.findByIds(outbound_memo_ids);
          outboundDo.outbound_memos = outboundMemos;
        } else {
          outboundDo.outbound_memos = [];
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
    return await this.outboundDoRepository.find({
      where: { status: status as any },
      relations: ['outbound_memos'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByOutboundType(outbound_type: string): Promise<OutboundDo[]> {
    return await this.outboundDoRepository.find({
      where: { outbound_type: outbound_type as any },
      relations: ['outbound_memos'],
      order: { createdAt: 'DESC' },
    });
  }
}
