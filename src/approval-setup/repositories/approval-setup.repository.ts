import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ApprovalSetup } from '../../core/domain/entities/approval-setup.entity';
import { CreateApprovalSetupDto } from '../dto/create-approval-setup.dto';
import { UpdateApprovalSetupDto } from '../dto/update-approval-setup.dto';
import { EntityType } from '../../core/domain/entities/approval.entity';

export interface ApprovalSetupFilters {
  entity_type?: EntityType;
  is_active?: boolean;
  search?: string;
}

@Injectable()
export class ApprovalSetupRepository {
  private readonly sortableFields = new Set(['createdAt', 'updatedAt', 'name', 'total_levels']);

  constructor(
    @InjectRepository(ApprovalSetup)
    private readonly repository: Repository<ApprovalSetup>,
  ) {}

  private withRelations(queryBuilder: SelectQueryBuilder<ApprovalSetup>): SelectQueryBuilder<ApprovalSetup> {
    return queryBuilder
      .leftJoinAndSelect('approval_setup.approval_levels', 'approval_levels')
      .leftJoinAndSelect('approval_levels.role', 'role')
      .orderBy('approval_levels.level', 'ASC');
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<ApprovalSetup>,
    filters?: ApprovalSetupFilters,
  ): SelectQueryBuilder<ApprovalSetup> {
    if (!filters) {
      return queryBuilder;
    }

    if (filters.entity_type) {
      queryBuilder.andWhere('approval_setup.entity_type = :entity_type', { entity_type: filters.entity_type });
    }

    if (filters.is_active !== undefined) {
      queryBuilder.andWhere('approval_setup.is_active = :is_active', { is_active: filters.is_active });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(approval_setup.name ILIKE :search OR approval_setup.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    return queryBuilder;
  }

  async create(data: Partial<ApprovalSetup>): Promise<ApprovalSetup> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  async findAll(filters?: ApprovalSetupFilters): Promise<ApprovalSetup[]> {
    const queryBuilder = this.withRelations(this.repository.createQueryBuilder('approval_setup'));
    this.applyFilters(queryBuilder, filters);
    return await queryBuilder.orderBy('approval_setup.createdAt', 'DESC').getMany();
  }

  async findAllPaginated(
    filters: ApprovalSetupFilters,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<{ data: ApprovalSetup[]; total: number }> {
    const queryBuilder = this.withRelations(this.repository.createQueryBuilder('approval_setup'));
    this.applyFilters(queryBuilder, filters);

    const total = await queryBuilder.getCount();

    const sortField = this.sortableFields.has(sortBy) ? sortBy : 'createdAt';

    const data = await queryBuilder
      .orderBy(`approval_setup.${sortField}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total };
  }

  async findOne(id: string): Promise<ApprovalSetup | null> {
    const queryBuilder = this.withRelations(this.repository.createQueryBuilder('approval_setup'));
    queryBuilder.where('approval_setup.id = :id', { id });
    return await queryBuilder.getOne();
  }

  async findByEntityType(entityType: EntityType, activeOnly: boolean = true): Promise<ApprovalSetup | null> {
    const queryBuilder = this.withRelations(this.repository.createQueryBuilder('approval_setup'));
    queryBuilder.where('approval_setup.entity_type = :entityType', { entityType });
    if (activeOnly) {
      queryBuilder.andWhere('approval_setup.is_active = :is_active', { is_active: true });
    }
    queryBuilder.orderBy('approval_setup.createdAt', 'DESC');
    return await queryBuilder.getOne();
  }

  async update(id: string, data: Partial<ApprovalSetup>): Promise<void> {
    const result = await this.repository.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException('Approval setup not found');
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.repository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Approval setup not found');
    }
  }
}

