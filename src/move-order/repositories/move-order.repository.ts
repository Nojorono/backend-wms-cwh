import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { MoveOrder, MoveOrderStatus, MoveOrderType } from '../../core/domain/entities/move-order.entity';

export interface MoveOrderFilters {
  status?: MoveOrderStatus;
  type?: MoveOrderType;
  search?: string;
}

@Injectable()
export class MoveOrderRepository {
  private readonly sortableFields = new Set(['createdAt', 'updatedAt', 'move_order_number']);

  constructor(
    @InjectRepository(MoveOrder)
    private readonly repository: Repository<MoveOrder>,
  ) {}

  private withRelations(queryBuilder: SelectQueryBuilder<MoveOrder>): SelectQueryBuilder<MoveOrder> {
    return queryBuilder
      .leftJoinAndSelect('move_order.move_order_items', 'move_order_items')
      .leftJoinAndSelect('move_order_items.item', 'item')
      .leftJoinAndSelect('move_order_items.pallet', 'pallet');
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<MoveOrder>,
    filters?: MoveOrderFilters,
  ): SelectQueryBuilder<MoveOrder> {
    if (!filters) {
      return queryBuilder;
    }

    if (filters.status) {
      queryBuilder.andWhere('move_order.move_order_status = :status', { status: filters.status });
    }

    if (filters.type) {
      queryBuilder.andWhere('move_order.move_order_type = :type', { type: filters.type });
    }

    if (filters.search) {
      queryBuilder.andWhere('move_order.move_order_number ILIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    return queryBuilder;
  }

  async create(data: Partial<MoveOrder>): Promise<MoveOrder> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  async findAll(filters?: MoveOrderFilters): Promise<MoveOrder[]> {
    const queryBuilder = this.withRelations(this.repository.createQueryBuilder('move_order'));
    this.applyFilters(queryBuilder, filters);
    return await queryBuilder.orderBy('move_order.createdAt', 'DESC').getMany();
  }

  async findAllPaginated(
    filters: MoveOrderFilters,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<{ data: MoveOrder[]; total: number }> {
    const queryBuilder = this.withRelations(this.repository.createQueryBuilder('move_order'));
    this.applyFilters(queryBuilder, filters);

    const total = await queryBuilder.getCount();

    const sortField = this.sortableFields.has(sortBy) ? sortBy : 'createdAt';

    const data = await queryBuilder
      .orderBy(`move_order.${sortField}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total };
  }

  async findOne(id: string): Promise<MoveOrder | null> {
    const queryBuilder = this.withRelations(this.repository.createQueryBuilder('move_order'));
    queryBuilder.where('move_order.id = :id', { id });
    return await queryBuilder.getOne();
  }

  async update(id: string, data: Partial<MoveOrder>): Promise<void> {
    const result = await this.repository.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException('Move order not found');
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.repository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Move order not found');
    }
  }

  async getNextMoveOrderNumberForDate(date: Date): Promise<string> {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const prefix = `MO-${year}${month}${day}-`;

    const latest = await this.repository
      .createQueryBuilder('move_order')
      .select('move_order.move_order_number', 'number')
      .where('move_order.move_order_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('move_order.move_order_number', 'DESC')
      .limit(1)
      .getRawOne<{ number?: string }>();

    let sequence = 1;
    if (latest?.number && latest.number.startsWith(prefix)) {
      const tail = latest.number.substring(prefix.length);
      const parsed = parseInt(tail, 10);
      if (!Number.isNaN(parsed)) {
        sequence = parsed + 1;
      }
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }
}

