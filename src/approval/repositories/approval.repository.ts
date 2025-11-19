import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Approval, ApprovalStatus, EntityType } from '../../core/domain/entities/approval.entity';

export interface ApprovalFilters {
  status?: ApprovalStatus;
  entity_type?: EntityType;
  entity_id?: string;
  search?: string;
}

@Injectable()
export class ApprovalRepository {
  private readonly sortableFields = new Set(['createdAt', 'updatedAt', 'current_level', 'status']);

  constructor(
    @InjectRepository(Approval)
    private readonly repository: Repository<Approval>,
  ) {}

  private withRelations(queryBuilder: SelectQueryBuilder<Approval>): SelectQueryBuilder<Approval> {
    return queryBuilder
      .leftJoinAndSelect('approval.approval_setup', 'approval_setup')
      .leftJoinAndSelect('approval_setup.approval_levels', 'approval_levels')
      .leftJoinAndSelect('approval_levels.role', 'role');
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Approval>,
    filters?: ApprovalFilters,
  ): SelectQueryBuilder<Approval> {
    if (!filters) {
      return queryBuilder;
    }

    if (filters.status) {
      queryBuilder.andWhere('approval.status = :status', { status: filters.status });
    }

    if (filters.entity_type) {
      queryBuilder.andWhere('approval.entity_type = :entity_type', { entity_type: filters.entity_type });
    }

    if (filters.entity_id) {
      queryBuilder.andWhere('approval.entity_id = :entity_id', { entity_id: filters.entity_id });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(approval.reason ILIKE :search OR approval.notes ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    return queryBuilder;
  }

  async create(data: Partial<Approval>): Promise<Approval> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  async findAll(filters?: ApprovalFilters): Promise<Approval[]> {
    const queryBuilder = this.withRelations(this.repository.createQueryBuilder('approval'));
    this.applyFilters(queryBuilder, filters);
    return await queryBuilder.orderBy('approval.createdAt', 'DESC').getMany();
  }

  async findAllPaginated(
    filters: ApprovalFilters,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<{ data: Approval[]; total: number }> {
    const queryBuilder = this.withRelations(this.repository.createQueryBuilder('approval'));
    this.applyFilters(queryBuilder, filters);

    const total = await queryBuilder.getCount();

    const sortField = this.sortableFields.has(sortBy) ? sortBy : 'createdAt';

    const data = await queryBuilder
      .orderBy(`approval.${sortField}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total };
  }

  async findOne(id: string): Promise<Approval | null> {
    const queryBuilder = this.withRelations(this.repository.createQueryBuilder('approval'));
    queryBuilder.where('approval.id = :id', { id });
    return await queryBuilder.getOne();
  }

  async findByEntity(entityType: EntityType, entityId: string): Promise<Approval | null> {
    const queryBuilder = this.withRelations(this.repository.createQueryBuilder('approval'));
    queryBuilder
      .where('approval.entity_type = :entityType', { entityType })
      .andWhere('approval.entity_id = :entityId', { entityId })
      .andWhere('approval.status IN (:...statuses)', { statuses: [ApprovalStatus.PENDING, ApprovalStatus.PARTIALLY_APPROVED] });
    return await queryBuilder.getOne();
  }

  async update(id: string, data: Partial<Approval>): Promise<void> {
    const result = await this.repository.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException('Approval not found');
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.repository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Approval not found');
    }
  }
}

