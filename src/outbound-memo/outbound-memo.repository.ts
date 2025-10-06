import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboundMemo } from '../core/domain/entities/outbound-memo.entity';
import { OutboundMemoItem } from '../core/domain/entities/outbound-memo-item.entity';
import { CreateOutboundMemoDto } from './dto/create-outbound-memo.dto';
import { UpdateOutboundMemoDto } from './dto/update-outbound-memo.dto';

@Injectable()
export class OutboundMemoRepository {
  constructor(
    @InjectRepository(OutboundMemo)
    private readonly outboundMemoRepository: Repository<OutboundMemo>,
    @InjectRepository(OutboundMemoItem)
    private readonly outboundMemoItemRepository: Repository<OutboundMemoItem>,
  ) {}

  async create(data: CreateOutboundMemoDto): Promise<OutboundMemo> {
    const { outbound_memo_items, ...outboundMemoData } = data;
    
    // Create outbound memo
    const outboundMemo = this.outboundMemoRepository.create({
      ...outboundMemoData,
      status: data.status || 'PENDING' as any,
    });
    const savedOutboundMemo = await this.outboundMemoRepository.save(outboundMemo);

    // Create outbound memo items
    if (outbound_memo_items && outbound_memo_items.length > 0) {
      const items = outbound_memo_items.map(item => 
        this.outboundMemoItemRepository.create({
          ...item,
          outbound_memo_id: savedOutboundMemo.id,
        })
      );
      await this.outboundMemoItemRepository.save(items);
    }

    return this.findOne(savedOutboundMemo.id);
  }

  async findAll(): Promise<OutboundMemo[]> {
    return await this.outboundMemoRepository.find({
      relations: ['outbound_memo_items', 'outbound_memo_items.item'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<OutboundMemo> {
    const entity = await this.outboundMemoRepository.findOne({
      where: { id },
      relations: ['outbound_memo_items', 'outbound_memo_items.item'],
    });
    if (!entity) throw new NotFoundException('Outbound memo not found');
    return entity;
  }

  async update(id: string, data: UpdateOutboundMemoDto): Promise<OutboundMemo> {
    const existing = await this.findOne(id);
    
    const { outbound_memo_items, ...outboundMemoData } = data;
    
    // Update outbound memo
    await this.outboundMemoRepository.update(id, outboundMemoData);

    // Update outbound memo items if provided
    if (outbound_memo_items) {
      // Delete existing items
      await this.outboundMemoItemRepository.delete({ outbound_memo_id: id });
      
      // Create new items
      if (outbound_memo_items.length > 0) {
        const items = outbound_memo_items.map(item => 
          this.outboundMemoItemRepository.create({
            ...item,
            outbound_memo_id: id,
          })
        );
        await this.outboundMemoItemRepository.save(items);
      }
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);
    await this.outboundMemoRepository.delete(id);
  }

  async findByStatus(status: string): Promise<OutboundMemo[]> {
    return await this.outboundMemoRepository.find({
      where: { status: status as any },
      relations: ['outbound_memo_items', 'outbound_memo_items.item'],
      order: { createdAt: 'DESC' },
    });
  }
}
