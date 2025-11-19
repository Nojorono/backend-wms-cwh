import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { StockAdjustmentApproval } from '../../core/domain/entities/stock-adjustment-approval.entity';
import { ApprovalStatus } from '../../core/domain/entities/approval.entity';

export interface StockAdjustmentApprovalFilters {
  status?: ApprovalStatus;
  pallet_id?: string;
  item_id?: string;
  search?: string;
}

@Injectable()
export class StockAdjustmentApprovalRepository {
  private readonly sortableFields = new Set(['createdAt', 'updatedAt', 'requested_quantity', 'current_quantity']);

  constructor(
    @InjectRepository(StockAdjustmentApproval)
    private readonly repository: Repository<StockAdjustmentApproval>,
  ) {}

  private withRelations(queryBuilder: SelectQueryBuilder<StockAdjustmentApproval>): SelectQueryBuilder<StockAdjustmentApproval> {
    return queryBuilder
      .leftJoinAndSelect('stock_adjustment_approval.approval', 'approval')
      .leftJoinAndSelect('approval.approval_setup', 'approval_setup')
      .leftJoinAndSelect('approval_setup.approval_levels', 'approval_levels')
      .leftJoinAndSelect('approval_levels.role', 'role')
      .leftJoinAndSelect('stock_adjustment_approval.pallet', 'pallet')
      .leftJoinAndSelect('stock_adjustment_approval.item', 'item')
      .leftJoinAndSelect('stock_adjustment_approval.target_pallet', 'target_pallet');
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<StockAdjustmentApproval>,
    filters?: StockAdjustmentApprovalFilters,
  ): SelectQueryBuilder<StockAdjustmentApproval> {
    if (!filters) {
      return queryBuilder;
    }

    if (filters.status) {
      queryBuilder.andWhere('approval.status = :status', { status: filters.status });
    }

    if (filters.pallet_id) {
      queryBuilder.andWhere('stock_adjustment_approval.pallet_id = :pallet_id', { pallet_id: filters.pallet_id });
    }

    if (filters.item_id) {
      queryBuilder.andWhere('stock_adjustment_approval.item_id = :item_id', { item_id: filters.item_id });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(approval.reason ILIKE :search OR approval.notes ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    return queryBuilder;
  }

  async create(data: Partial<StockAdjustmentApproval>): Promise<StockAdjustmentApproval> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  async findAll(filters?: StockAdjustmentApprovalFilters): Promise<StockAdjustmentApproval[]> {
    const queryBuilder = this.withRelations(this.repository.createQueryBuilder('stock_adjustment_approval'));
    this.applyFilters(queryBuilder, filters);
    return await queryBuilder.orderBy('stock_adjustment_approval.createdAt', 'DESC').getMany();
  }

  async findAllPaginated(
    filters: StockAdjustmentApprovalFilters,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<{ data: StockAdjustmentApproval[]; total: number }> {
    const queryBuilder = this.withRelations(this.repository.createQueryBuilder('stock_adjustment_approval'));
    this.applyFilters(queryBuilder, filters);

    const total = await queryBuilder.getCount();

    const sortField = this.sortableFields.has(sortBy) ? sortBy : 'createdAt';

    const data = await queryBuilder
      .orderBy(`stock_adjustment_approval.${sortField}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total };
  }

  async findOne(id: string): Promise<StockAdjustmentApproval | null> {
    const queryBuilder = this.withRelations(this.repository.createQueryBuilder('stock_adjustment_approval'));
    queryBuilder.where('stock_adjustment_approval.id = :id', { id });
    return await queryBuilder.getOne();
  }

  async update(id: string, data: Partial<StockAdjustmentApproval>): Promise<void> {
    const result = await this.repository.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException('Stock adjustment approval not found');
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.repository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Stock adjustment approval not found');
    }
  }
}

