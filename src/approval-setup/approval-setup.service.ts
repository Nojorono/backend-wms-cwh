import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ApprovalSetup } from '../core/domain/entities/approval-setup.entity';
import { ApprovalLevel } from '../core/domain/entities/approval-level.entity';
import { ApprovalSetupRepository } from './repositories/approval-setup.repository';
import { CreateApprovalSetupDto } from './dto/create-approval-setup.dto';
import { UpdateApprovalSetupDto } from './dto/update-approval-setup.dto';
import { ApprovalSetupPaginationDto } from './dto/approval-setup-pagination.dto';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { PaginationService } from '../core/services/pagination.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ApprovalSetupService {
  constructor(
    private readonly repository: ApprovalSetupRepository,
    private readonly paginationService: PaginationService,
    private readonly dataSource: DataSource,
    @InjectRepository(ApprovalLevel)
    private readonly approvalLevelRepository: Repository<ApprovalLevel>,
  ) {}

  private buildFilters(query: ApprovalSetupPaginationDto) {
    return {
      entity_type: query.entity_type,
      is_active: query.is_active,
      search: query.search,
    };
  }

  async create(payload: CreateApprovalSetupDto): Promise<ApprovalSetup> {
    // Validate levels
    if (!payload.approval_levels || payload.approval_levels.length === 0) {
      throw new BadRequestException('At least one approval level is required');
    }

    // Validate level numbers are unique and sequential
    const levels = payload.approval_levels.map((l) => l.level).sort((a, b) => a - b);
    const uniqueLevels = new Set(levels);
    if (levels.length !== uniqueLevels.size) {
      throw new BadRequestException('Level numbers must be unique');
    }

    // Check for gaps in level sequence
    for (let i = 0; i < levels.length; i++) {
      if (levels[i] !== i + 1) {
        throw new BadRequestException('Level numbers must be sequential starting from 1');
      }
    }

    return await this.dataSource.transaction(async (manager) => {
      // Create and save approval setup using transaction manager
      const setup = manager.create(ApprovalSetup, {
        name: payload.name,
        description: payload.description,
        entity_type: payload.entity_type,
        is_active: payload.is_active ?? true,
        require_all_levels: payload.require_all_levels ?? false,
        total_levels: payload.approval_levels.length,
      });

      const savedSetup = await manager.save(ApprovalSetup, setup);

      // Create approval levels using transaction manager
      const levelsToCreate = payload.approval_levels.map((levelDto) =>
        manager.create(ApprovalLevel, {
          approval_setup_id: savedSetup.id,
          level: levelDto.level,
          level_name: levelDto.level_name,
          description: levelDto.description,
          role_id: levelDto.role_id,
          is_required: levelDto.is_required ?? true,
          can_skip: levelDto.can_skip ?? false,
          min_approvers: levelDto.min_approvers ?? 1,
          max_approvers: levelDto.max_approvers ?? levelDto.required_approvers ?? 1,
          required_approvers: levelDto.required_approvers ?? 1,
          order: levelDto.order ?? levelDto.level - 1,
        }),
      );

      await manager.save(ApprovalLevel, levelsToCreate);

      // Reload with relations using repository
      const created = await this.repository.findOne(savedSetup.id);
      if (!created) {
        throw new NotFoundException('Failed to reload created approval setup');
      }
      return created;
    });
  }

  async findAll(query: ApprovalSetupPaginationDto): Promise<ApprovalSetup[]> {
    return await this.repository.findAll(this.buildFilters(query));
  }

  async findAllPaginated(
    query: ApprovalSetupPaginationDto,
  ): Promise<PaginatedResponseDto<ApprovalSetup>> {
    const { data, total } = await this.repository.findAllPaginated(
      this.buildFilters(query),
      query.page,
      query.limit,
      query.sortBy,
      query.sortOrder,
    );

    return this.paginationService.createPaginatedResponse(data, query, total);
  }

  async findOne(id: string): Promise<ApprovalSetup> {
    const setup = await this.repository.findOne(id);
    if (!setup) {
      throw new NotFoundException('Approval setup not found');
    }
    return setup;
  }

  async update(id: string, payload: UpdateApprovalSetupDto): Promise<ApprovalSetup> {
    const existing = await this.findOne(id);

    return await this.dataSource.transaction(async (manager) => {
      const updateData: Partial<ApprovalSetup> = {};

      if (payload.name !== undefined) {
        updateData.name = payload.name;
      }

      if (payload.description !== undefined) {
        updateData.description = payload.description;
      }

      if (payload.is_active !== undefined) {
        updateData.is_active = payload.is_active;
      }

      if (payload.require_all_levels !== undefined) {
        updateData.require_all_levels = payload.require_all_levels;
      }

      if (Object.keys(updateData).length > 0) {
        await this.repository.update(id, updateData);
      }

      // Update levels if provided
      if (payload.approval_levels && payload.approval_levels.length > 0) {
        // Validate levels
        const levels = payload.approval_levels.map((l) => l.level ?? 1).sort((a, b) => a - b);
        const uniqueLevels = new Set(levels);
        if (levels.length !== uniqueLevels.size) {
          throw new BadRequestException('Level numbers must be unique');
        }

        // Remove existing levels
        await manager.delete(ApprovalLevel, { approval_setup_id: id });

        // Create new levels using transaction manager
        const levelsToCreate = payload.approval_levels.map((levelDto) =>
          manager.create(ApprovalLevel, {
            approval_setup_id: id,
            level: levelDto.level ?? 1,
            level_name: levelDto.level_name,
            description: levelDto.description,
            role_id: levelDto.role_id,
            is_required: levelDto.is_required ?? true,
            can_skip: levelDto.can_skip ?? false,
            min_approvers: levelDto.min_approvers ?? 1,
            max_approvers: levelDto.max_approvers ?? levelDto.required_approvers ?? 1,
            required_approvers: levelDto.required_approvers ?? 1,
            order: levelDto.order ?? 0,
          }),
        );

        await manager.save(ApprovalLevel, levelsToCreate);

        // Update total_levels
        await this.repository.update(id, { total_levels: payload.approval_levels.length });
      }

      const updated = await this.repository.findOne(id);
      if (!updated) {
        throw new NotFoundException('Failed to reload updated approval setup');
      }
      return updated;
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }

  async findByEntityType(entityType: string, activeOnly: boolean = true): Promise<ApprovalSetup | null> {
    return await this.repository.findByEntityType(entityType as any, activeOnly);
  }
}

