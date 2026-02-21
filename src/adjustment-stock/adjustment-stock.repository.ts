import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AdjustmentStock } from '../core/domain/entities/adjustment_stock.entity';
import { AdjustmentStockItem } from '../core/domain/entities/adjustment_stock_item.entity';
import { CreateAdjustmentStockDto } from './dto/create-adjustment-stock.dto';
import { UpdateAdjustmentStockDto } from './dto/update-adjustment-stock.dto';
import { AdjustmentStockPaginationDto } from './dto/adjustment-stock-pagination.dto';

const ADJUSTMENT_STOCK_ITEM_RELATIONS = [
  'adjustmentStockItems',
  'adjustmentStockItems.warehouseSub',
  'adjustmentStockItems.warehouseBin',
  'adjustmentStockItems.pallet',
  'adjustmentStockItems.item',
];

@Injectable()
export class AdjustmentStockRepository {
  constructor(
    @InjectRepository(AdjustmentStock)
    private readonly repository: Repository<AdjustmentStock>,
    @InjectRepository(AdjustmentStockItem)
    private readonly itemRepository: Repository<AdjustmentStockItem>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createAdjustmentStockDto: CreateAdjustmentStockDto): Promise<AdjustmentStock> {
    const { items, ...header } = createAdjustmentStockDto;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const adjustmentStock = this.repository.create(header);
      const saved = await queryRunner.manager.save(AdjustmentStock, adjustmentStock);
      const itemEntities = items.map((it) =>
        this.itemRepository.create({
          ...it,
          adjustment_stock_id: saved.id,
        }),
      );
      await queryRunner.manager.save(AdjustmentStockItem, itemEntities);
      await queryRunner.commitTransaction();
      return await this.findOne(saved.id) as AdjustmentStock;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<AdjustmentStock[]> {
    return await this.repository.find({
      relations: ADJUSTMENT_STOCK_ITEM_RELATIONS,
      order: { createdAt: 'DESC' },
    });
  }

  async findAllWithFilters(filters: AdjustmentStockPaginationDto): Promise<{
    data: AdjustmentStock[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      search,
      type,
      status,
      is_inventory,
      pallet_id,
      item_id,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const queryBuilder = this.repository
      .createQueryBuilder('adjustmentStock')
      .leftJoinAndSelect('adjustmentStock.adjustmentStockItems', 'asi')
      .leftJoinAndSelect('asi.warehouseSub', 'warehouseSub')
      .leftJoinAndSelect('asi.warehouseBin', 'warehouseBin')
      .leftJoinAndSelect('asi.pallet', 'pallet')
      .leftJoinAndSelect('asi.item', 'item');

    if (search) {
      queryBuilder.andWhere(
        '(adjustmentStock.code ILIKE :search OR adjustmentStock.document ILIKE :search OR adjustmentStock.notes ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (type) {
      queryBuilder.andWhere('adjustmentStock.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('adjustmentStock.status = :status', { status });
    }

    if (is_inventory) {
      queryBuilder.andWhere('adjustmentStock.is_inventory = :is_inventory', {
        is_inventory,
      });
    }

    if (pallet_id) {
      queryBuilder.andWhere('asi.pallet_id = :pallet_id', { pallet_id });
    }

    if (item_id) {
      queryBuilder.andWhere('asi.item_id = :item_id', { item_id });
    }

    queryBuilder
      .orderBy(`adjustmentStock.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<AdjustmentStock | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ADJUSTMENT_STOCK_ITEM_RELATIONS,
    });
  }

  async findByPalletId(palletId: string): Promise<AdjustmentStock[]> {
    return await this.repository
      .createQueryBuilder('adjustmentStock')
      .leftJoinAndSelect('adjustmentStock.adjustmentStockItems', 'asi')
      .leftJoinAndSelect('asi.warehouseSub', 'warehouseSub')
      .leftJoinAndSelect('asi.warehouseBin', 'warehouseBin')
      .leftJoinAndSelect('asi.pallet', 'pallet')
      .leftJoinAndSelect('asi.item', 'item')
      .where('asi.pallet_id = :palletId', { palletId })
      .orderBy('adjustmentStock.createdAt', 'DESC')
      .getMany();
  }

  async findByItemId(itemId: string): Promise<AdjustmentStock[]> {
    return await this.repository
      .createQueryBuilder('adjustmentStock')
      .leftJoinAndSelect('adjustmentStock.adjustmentStockItems', 'asi')
      .leftJoinAndSelect('asi.warehouseSub', 'warehouseSub')
      .leftJoinAndSelect('asi.warehouseBin', 'warehouseBin')
      .leftJoinAndSelect('asi.pallet', 'pallet')
      .leftJoinAndSelect('asi.item', 'item')
      .where('asi.item_id = :itemId', { itemId })
      .orderBy('adjustmentStock.createdAt', 'DESC')
      .getMany();
  }

  async findByCode(code: string): Promise<AdjustmentStock | null> {
    return await this.repository.findOne({
      where: { code },
      relations: ADJUSTMENT_STOCK_ITEM_RELATIONS,
    });
  }

  async update(
    id: string,
    updateAdjustmentStockDto: UpdateAdjustmentStockDto,
  ): Promise<AdjustmentStock | null> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Adjustment stock not found');
    }
    const { items, ...header } = updateAdjustmentStockDto;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if (Object.keys(header).length > 0) {
        await queryRunner.manager.update(AdjustmentStock, id, header);
      }
      if (items !== undefined) {
        await queryRunner.manager.softDelete(AdjustmentStockItem, {
          adjustment_stock_id: id,
        });
        if (items.length > 0) {
          const itemEntities = items.map((it) =>
            this.itemRepository.create({
              ...it,
              adjustment_stock_id: id,
            }),
          );
          await queryRunner.manager.save(AdjustmentStockItem, itemEntities);
        }
      }
      await queryRunner.commitTransaction();
      return await this.findOne(id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Adjustment stock not found');
    }
    await this.itemRepository.softDelete({ adjustment_stock_id: id });
    await this.repository.softDelete(id);
  }

  /**
   * Generate unique adjustment stock code
   * Format: ADJ-YYYY-XXXX
   * Example: ADJ-2025-0001
   */
  async getNextCode(year?: number): Promise<string> {
    const currentYear = year || new Date().getFullYear();
    const yearStr = currentYear.toString();
    const prefix = 'ADJ';
    const searchPrefix = `${prefix}-${yearStr}-`;

    const row = await this.repository
      .createQueryBuilder('adjustmentStock')
      .select('adjustmentStock.code', 'code')
      .where('adjustmentStock.code LIKE :prefix', { prefix: `${searchPrefix}%` })
      .orderBy('adjustmentStock.code', 'DESC')
      .limit(1)
      .getRawOne<{ code?: string }>();

    let seq = 1;
    if (row?.code && row.code.startsWith(searchPrefix)) {
      const tail = row.code.substring(searchPrefix.length);
      const parsed = parseInt(tail, 10);
      if (!Number.isNaN(parsed)) {
        seq = parsed + 1;
      }
    }

    return `${searchPrefix}${seq.toString().padStart(4, '0')}`;
  }
}
