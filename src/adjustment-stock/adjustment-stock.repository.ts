import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdjustmentStock } from '../core/domain/entities/adjustment_stock.entity';
import { CreateAdjustmentStockDto } from './dto/create-adjustment-stock.dto';
import { UpdateAdjustmentStockDto } from './dto/update-adjustment-stock.dto';
import { AdjustmentStockPaginationDto } from './dto/adjustment-stock-pagination.dto';

@Injectable()
export class AdjustmentStockRepository {
  constructor(
    @InjectRepository(AdjustmentStock)
    private readonly repository: Repository<AdjustmentStock>,
  ) {}

  async create(createAdjustmentStockDto: CreateAdjustmentStockDto): Promise<AdjustmentStock> {
    const adjustmentStock = this.repository.create(createAdjustmentStockDto);
    return await this.repository.save(adjustmentStock);
  }

  async findAll(): Promise<AdjustmentStock[]> {
    return await this.repository.find({
      relations: ['pallet', 'item'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllWithFilters(filters: AdjustmentStockPaginationDto): Promise<{ 
    data: AdjustmentStock[]; 
    total: number; 
    page: number; 
    limit: number 
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
      sortOrder = 'desc' 
    } = filters;

    const queryBuilder = this.repository
      .createQueryBuilder('adjustmentStock')
      .leftJoinAndSelect('adjustmentStock.pallet', 'pallet')
      .leftJoinAndSelect('adjustmentStock.item', 'item');

    if (search) {
      queryBuilder.where(
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
      queryBuilder.andWhere('adjustmentStock.is_inventory = :is_inventory', { is_inventory });
    }

    if (pallet_id) {
      queryBuilder.andWhere('adjustmentStock.pallet_id = :pallet_id', { pallet_id });
    }

    if (item_id) {
      queryBuilder.andWhere('adjustmentStock.item_id = :item_id', { item_id });
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
    const adjustmentStock = await this.repository.findOne({ 
      where: { id },
      relations: ['pallet', 'item'],
    });
    if (!adjustmentStock) {
      return null;
    }
    return adjustmentStock;
  }

  async findByPalletId(palletId: string): Promise<AdjustmentStock[]> {
    return await this.repository.find({
      where: { pallet_id: palletId },
      relations: ['pallet', 'item'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByItemId(itemId: string): Promise<AdjustmentStock[]> {
    return await this.repository.find({
      where: { item_id: itemId },
      relations: ['pallet', 'item'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCode(code: string): Promise<AdjustmentStock | null> {
    const adjustmentStock = await this.repository.findOne({ 
      where: { code },
      relations: ['pallet', 'item'],
    });
    if (!adjustmentStock) {
      return null;
    }
    return adjustmentStock;
  }

  async update(id: string, updateAdjustmentStockDto: UpdateAdjustmentStockDto): Promise<AdjustmentStock | null> {
    const adjustmentStock = await this.findOne(id);
    if (!adjustmentStock) {
      throw new NotFoundException('Adjustment stock not found');
    }
    await this.repository.update(id, updateAdjustmentStockDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const adjustmentStock = await this.findOne(id);
    if (!adjustmentStock) {
      throw new NotFoundException('Adjustment stock not found');
    }
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

    // Find the latest code for this year
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
