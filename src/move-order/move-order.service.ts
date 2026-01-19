import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MoveOrder, MoveOrderStatus } from '../core/domain/entities/move-order.entity';
import { MoveOrderRepository } from './repositories/move-order.repository';
import { MoveOrderItemRepository } from './repositories/move-order-item.repository';
import { CreateMoveOrderDto, CreateMoveOrderItemDto } from './dto/create-move-order.dto';
import { UpdateMoveOrderDto, UpdateMoveOrderStatusDto } from './dto/update-move-order.dto';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { MoveOrderPaginationQueryDto } from './dto/move-order-pagination.dto';
import { PaginationService } from '../core/services/pagination.service';

@Injectable()
export class MoveOrderService {
  constructor(
    private readonly moveOrderRepository: MoveOrderRepository,
    private readonly moveOrderItemRepository: MoveOrderItemRepository,
    private readonly paginationService: PaginationService,
  ) {}

  private validateItems(items: CreateMoveOrderItemDto[]): void {
    if (!items || items.length === 0) {
      throw new BadRequestException('move_order_items must contain at least one item');
    }

    const uniqueKeySet = new Set<string>();

    items.forEach((item, index) => {
      if (!item.item_id) {
        throw new BadRequestException(`move_order_items[${index}].item_id is required`);
      }

      if (item.quantity === undefined || item.quantity === null || item.quantity <= 0) {
        throw new BadRequestException(`move_order_items[${index}].quantity must be greater than 0`);
      }

      const key = `${item.item_id}-${item.pallet_id ?? 'NO_PALLET'}-${item.week_number ?? 'NO_WEEK'}`;
      if (uniqueKeySet.has(key)) {
        throw new BadRequestException(
          `Duplicate move order item detected at index ${index}. Item, pallet, and week combination must be unique.`,
        );
      }
      uniqueKeySet.add(key);
    });
  }

  private mapItemsForPersistence(
    move_order_id: string,
    items: CreateMoveOrderItemDto[],
  ): {
    move_order_id: string;
    item_id: string;
    production_date?: Date;
    week_number?: number;
    pallet_id?: string;
    quantity: number;
    uom?: string;
  }[] {
    return items.map((item) => ({
      move_order_id,
      item_id: item.item_id,
      production_date: item.production_date ? new Date(item.production_date) : undefined,
      week_number: item.week_number,
      pallet_id: item.pallet_id,
      quantity: item.quantity,
      uom: item.uom,
    }));
  }

  private buildFilters(query: MoveOrderPaginationQueryDto) {
    return {
      status: query.status,
      type: query.type,
      search: query.search,
    };
  }

  async create(payload: CreateMoveOrderDto): Promise<MoveOrder> {
    this.validateItems(payload.move_order_items);

    const move_order_number =
      payload.move_order_number ||
      (await this.moveOrderRepository.getNextMoveOrderNumberForDate(new Date()));

    const moveOrder = await this.moveOrderRepository.create({
      move_order_number,
      move_order_type: payload.move_order_type,
      move_order_status: payload.move_order_status ?? MoveOrderStatus.CREATED,
    });

    await this.moveOrderItemRepository.createMany(
      this.mapItemsForPersistence(moveOrder.id, payload.move_order_items),
    );

    const created = await this.moveOrderRepository.findOne(moveOrder.id);
    if (!created) {
      throw new NotFoundException('Move order not found after creation');
    }
    return created;
  }

  async findAll(filters: MoveOrderPaginationQueryDto): Promise<MoveOrder[]> {
    return await this.moveOrderRepository.findAll(this.buildFilters(filters));
  }

  async findAllPaginated(
    query: MoveOrderPaginationQueryDto,
  ): Promise<PaginatedResponseDto<MoveOrder>> {
    const { data, total } = await this.moveOrderRepository.findAllPaginated(
      this.buildFilters(query),
      query.page,
      query.limit,
      query.sortBy,
      query.sortOrder,
    );

    return this.paginationService.createPaginatedResponse(data, query, total);
  }

  async findOne(id: string): Promise<MoveOrder> {
    const moveOrder = await this.moveOrderRepository.findOne(id);
    if (!moveOrder) {
      throw new NotFoundException('Move order not found');
    }
    return moveOrder;
  }

  async update(id: string, payload: UpdateMoveOrderDto): Promise<MoveOrder> {
    const existing = await this.findOne(id);

    if (payload.move_order_items) {
      this.validateItems(payload.move_order_items);
    }

    const updateData: Partial<MoveOrder> = {};

    if (payload.move_order_number) {
      updateData.move_order_number = payload.move_order_number;
    }

    if (payload.move_order_type) {
      updateData.move_order_type = payload.move_order_type;
    }

    if (payload.move_order_status) {
      updateData.move_order_status = payload.move_order_status;
    }

    if (Object.keys(updateData).length > 0) {
      await this.moveOrderRepository.update(id, updateData);
    }

    if (payload.move_order_items) {
      await this.moveOrderItemRepository.softRemoveByMoveOrder(existing.id);
      await this.moveOrderItemRepository.createMany(
        this.mapItemsForPersistence(existing.id, payload.move_order_items),
      );
    }

    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.moveOrderItemRepository.softRemoveByMoveOrder(id);
    await this.moveOrderRepository.remove(id);
  }

  async updateStatus(id: string, payload: UpdateMoveOrderStatusDto): Promise<MoveOrder> {
    await this.findOne(id);
    await this.moveOrderRepository.update(id, {
      move_order_status: payload.status,
    });
    return await this.findOne(id);
  }
}

