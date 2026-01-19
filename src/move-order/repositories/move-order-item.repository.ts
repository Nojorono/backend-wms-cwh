import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MoveOrderItem } from '../../core/domain/entities/move-order-item.entity';

interface MoveOrderItemCreateInput {
  move_order_id: string;
  item_id: string;
  production_date?: Date;
  week_number?: number;
  pallet_id?: string;
  quantity: number;
  uom?: string;
}

@Injectable()
export class MoveOrderItemRepository {
  constructor(
    @InjectRepository(MoveOrderItem)
    private readonly repository: Repository<MoveOrderItem>,
  ) {}

  async createMany(items: MoveOrderItemCreateInput[]): Promise<MoveOrderItem[]> {
    if (!items.length) {
      return [];
    }

    const entities = this.repository.create(items);
    return await this.repository.save(entities);
  }

  async softRemoveByMoveOrder(move_order_id: string): Promise<void> {
    const existingItems = await this.repository.find({
      where: { move_order_id },
      select: ['id'],
      withDeleted: false,
    });

    if (!existingItems.length) {
      return;
    }

    await this.repository.softDelete({ move_order_id });
  }

  async findByMoveOrder(move_order_id: string): Promise<MoveOrderItem[]> {
    return await this.repository.find({
      where: { move_order_id },
      relations: ['item', 'pallet'],
    });
  }
}

