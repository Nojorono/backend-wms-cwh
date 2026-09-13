import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { OpeningBalanceStock } from '../core/domain/entities/opening-balance-stock.entity';
import { OpeningBalanceStockItem } from '../core/domain/entities/opening-balance-stock-item.entity';
import { OpeningBalanceStockPaginationDto } from './dto/opening-balance-stock-pagination.dto';

const OPENING_BALANCE_STOCK_ITEM_RELATIONS = [
  'openingBalanceStockItems',
  'openingBalanceStockItems.item',
  'openingBalanceStockItems.warehouseSub',
  'openingBalanceStockItems.warehouseBin',
  'openingBalanceStockItems.pallet',
];

/** Header fields persisted on opening_balance_stock (no nested items). */
export type OpeningBalanceStockHeaderData = Partial<
  Pick<
    OpeningBalanceStock,
    | 'code'
    | 'document'
    | 'organization_id'
    | 'period_date'
    | 'week_number'
    | 'notes'
    | 'status'
    | 'source'
    | 'file_name'
    | 'total_items'
  >
>;

/** Line payload with resolved master ids already filled in by the service. */
export type OpeningBalanceStockItemData = Partial<
  Pick<
    OpeningBalanceStockItem,
    | 'item_code'
    | 'warehouse_sub_code'
    | 'warehouse_bin_code'
    | 'pallet_code'
    | 'item_id'
    | 'warehouse_sub_id'
    | 'warehouse_bin_id'
    | 'pallet_id'
    | 'quantity'
    | 'uom'
    | 'production_date'
    | 'week_number'
    | 'notes'
  >
>;

export interface OpeningBalanceStockPersistData extends OpeningBalanceStockHeaderData {
  items: OpeningBalanceStockItemData[];
}

@Injectable()
export class OpeningBalanceStockRepository {
  constructor(
    @InjectRepository(OpeningBalanceStock)
    private readonly repository: Repository<OpeningBalanceStock>,
    @InjectRepository(OpeningBalanceStockItem)
    private readonly itemRepository: Repository<OpeningBalanceStockItem>,
    private readonly dataSource: DataSource,
  ) {}

  async create(data: OpeningBalanceStockPersistData): Promise<OpeningBalanceStock> {
    const { items, ...header } = data;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const openingBalanceStock = this.repository.create({
        ...header,
        total_items: items.length,
      });
      const saved = await queryRunner.manager.save(OpeningBalanceStock, openingBalanceStock);

      const itemEntities = items.map((it) =>
        this.itemRepository.create({
          ...it,
          opening_balance_stock_id: saved.id,
        }),
      );
      await queryRunner.manager.save(OpeningBalanceStockItem, itemEntities);

      await queryRunner.commitTransaction();
      return (await this.findOne(saved.id)) as OpeningBalanceStock;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<OpeningBalanceStock[]> {
    return await this.repository.find({
      relations: OPENING_BALANCE_STOCK_ITEM_RELATIONS,
      order: { createdAt: 'DESC' },
    });
  }

  async findAllWithFilters(filters: OpeningBalanceStockPaginationDto): Promise<{
    data: OpeningBalanceStock[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      search,
      status,
      source,
      organization_id,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const queryBuilder = this.repository
      .createQueryBuilder('openingBalanceStock')
      .leftJoinAndSelect('openingBalanceStock.openingBalanceStockItems', 'obsi')
      .leftJoinAndSelect('obsi.item', 'item')
      .leftJoinAndSelect('obsi.warehouseSub', 'warehouseSub')
      .leftJoinAndSelect('obsi.warehouseBin', 'warehouseBin')
      .leftJoinAndSelect('obsi.pallet', 'pallet');

    if (search) {
      queryBuilder.andWhere(
        '(openingBalanceStock.code ILIKE :search OR openingBalanceStock.document ILIKE :search OR openingBalanceStock.notes ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('openingBalanceStock.status = :status', { status });
    }

    if (source) {
      queryBuilder.andWhere('openingBalanceStock.source = :source', { source });
    }

    if (organization_id) {
      queryBuilder.andWhere('openingBalanceStock.organization_id = :organization_id', {
        organization_id,
      });
    }

    queryBuilder
      .orderBy(`openingBalanceStock.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<OpeningBalanceStock | null> {
    return await this.repository.findOne({
      where: { id },
      relations: OPENING_BALANCE_STOCK_ITEM_RELATIONS,
    });
  }

  async findByCode(code: string): Promise<OpeningBalanceStock | null> {
    return await this.repository.findOne({
      where: { code },
      relations: OPENING_BALANCE_STOCK_ITEM_RELATIONS,
    });
  }

  async update(
    id: string,
    header: OpeningBalanceStockHeaderData,
    items?: OpeningBalanceStockItemData[],
  ): Promise<OpeningBalanceStock | null> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Opening balance stock not found');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const headerToUpdate: OpeningBalanceStockHeaderData = { ...header };
      if (items !== undefined) {
        headerToUpdate.total_items = items.length;
      }

      if (Object.keys(headerToUpdate).length > 0) {
        await queryRunner.manager.update(OpeningBalanceStock, id, headerToUpdate);
      }

      if (items !== undefined) {
        await queryRunner.manager.softDelete(OpeningBalanceStockItem, {
          opening_balance_stock_id: id,
        });
        if (items.length > 0) {
          const itemEntities = items.map((it) =>
            this.itemRepository.create({
              ...it,
              opening_balance_stock_id: id,
            }),
          );
          await queryRunner.manager.save(OpeningBalanceStockItem, itemEntities);
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
      throw new NotFoundException('Opening balance stock not found');
    }
    await this.itemRepository.softDelete({ opening_balance_stock_id: id });
    await this.repository.softDelete(id);
  }

  /**
   * Generate unique opening balance stock code.
   * Format: OBS-YYYY-XXXX (e.g. OBS-2026-0001)
   */
  async getNextCode(year?: number): Promise<string> {
    const currentYear = year || new Date().getFullYear();
    const yearStr = currentYear.toString();
    const prefix = 'OBS';
    const searchPrefix = `${prefix}-${yearStr}-`;

    const row = await this.repository
      .createQueryBuilder('openingBalanceStock')
      .select('openingBalanceStock.code', 'code')
      .where('openingBalanceStock.code LIKE :prefix', { prefix: `${searchPrefix}%` })
      .orderBy('openingBalanceStock.code', 'DESC')
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
