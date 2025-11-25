import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboundMemo, OutboundMemoStatus } from '../core/domain/entities/outbound-memo.entity';
import { OutboundMemoItem } from '../core/domain/entities/outbound-memo-item.entity';
import { CreateOutboundMemoDto } from './dto/create-outbound-memo.dto';
import { UpdateOutboundMemoDto } from './dto/update-outbound-memo.dto';
import { OutboundMemoPaginationDto } from './dto/outbound-memo-pagination.dto';

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
      status: data.status || ('PENDING' as any),
    });
    const savedOutboundMemo = await this.outboundMemoRepository.save(outboundMemo);

    // Create outbound memo items
    if (outbound_memo_items && outbound_memo_items.length > 0) {
      const items = outbound_memo_items.map((item) =>
        this.outboundMemoItemRepository.create({
          ...item,
          outbound_memo_id: savedOutboundMemo.id,
        }),
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
        const items = outbound_memo_items.map((item) =>
          this.outboundMemoItemRepository.create({
            ...item,
            outbound_memo_id: id,
          }),
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
    const where: Partial<OutboundMemo> = { status: status as OutboundMemoStatus };

    if (status === OutboundMemoStatus.APPROVED) {
      where.has_do = false;
    }

    return await this.outboundMemoRepository.find({
      where,
      relations: ['outbound_memo_items', 'outbound_memo_items.item'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllPaginated(
    paginationDto: OutboundMemoPaginationDto,
  ): Promise<{ data: OutboundMemo[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      sortOrder = 'DESC',
      status,
      has_do,
    } = paginationDto;

    const qb = this.outboundMemoRepository
      .createQueryBuilder('memo')
      .leftJoinAndSelect('memo.outbound_memo_items', 'items')
      .leftJoinAndSelect('items.item', 'item');

    if (status) {
      qb.andWhere('memo.status = :status', { status });
      if (status === OutboundMemoStatus.APPROVED) {
        qb.andWhere('memo.has_do = false');
      }
    }

    if (has_do !== undefined) {
      qb.andWhere('memo.has_do = :has_do', { has_do });
    }

    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(memo.requestor) LIKE :search OR LOWER(memo.origin) LIKE :search OR LOWER(memo.destination) LIKE :search OR LOWER(memo.ship_to) LIKE :search)',
        { search: searchTerm },
      );
    }

    const sortableFields: Record<string, string> = {
      createdAt: 'memo.createdAt',
      updatedAt: 'memo.updatedAt',
      delivery_date: 'memo.delivery_date',
      requestor: 'memo.requestor',
      status: 'memo.status',
    };

    const orderField =
      sortBy && sortableFields[sortBy] ? sortableFields[sortBy] : 'memo.createdAt';
    const orderDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    qb.orderBy(orderField, orderDirection);

    const [entities, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data: entities, total };
  }

  async getNextOutboundMemoNumberForDate(date: Date): Promise<string> {
    const y = date.getFullYear().toString();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const prefix = `OM-${y}${m}${d}-`;
    const row = await this.outboundMemoRepository
      .createQueryBuilder('memo')
      .select('memo.outbound_memo_number', 'num')
      .where('memo.outbound_memo_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('memo.outbound_memo_number', 'DESC')
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

  async findByOutboundMemoNumber(outbound_memo_number: string): Promise<OutboundMemo | null> {
    return await this.outboundMemoRepository.findOne({
      where: { outbound_memo_number },
    });
  }
}
