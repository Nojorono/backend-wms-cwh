import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { UsersActivityRepository } from './users-activity.repository';
import { CreateUsersActivityDto } from './dto/create-users-activity.dto';
import { UsersActivityPaginationDto } from './dto/users-activity-pagination.dto';
import { UsersActivity, UserActivityAction, UserActivityStatus } from '../core/domain/entities/users-activity.entity';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { PaginationService } from '../core/services/pagination.service';

@Injectable()
export class UsersActivityService {
  constructor(
    private readonly repository: UsersActivityRepository,
    private readonly paginationService: PaginationService,
  ) {}

  async create(data: CreateUsersActivityDto): Promise<UsersActivity> {
    // Validate required fields
    if (!data.action) {
      throw new BadRequestException('Action is required');
    }

    // Set default status if not provided
    if (!data.status) {
      data.status = UserActivityStatus.SUCCESS;
    }

    return this.repository.create(data);
  }

  async logActivity(
    action: UserActivityAction,
    options: {
      user_id?: string;
      username?: string;
      entity_type?: string;
      entity_id?: string;
      description?: string;
      request_data?: Record<string, any>;
      response_data?: Record<string, any>;
      metadata?: Record<string, any>;
      ip_address?: string;
      user_agent?: string;
      status?: UserActivityStatus;
      error_message?: string;
      endpoint?: string;
      method?: string;
      response_time_ms?: number;
      organization_id?: string;
      warehouse_id?: string;
    } = {},
  ): Promise<UsersActivity> {
    const activityData: CreateUsersActivityDto = {
      action,
      ...options,
    };

    return this.create(activityData);
  }

  async findAll(): Promise<UsersActivity[]> {
    return this.repository.findAll();
  }

  async findAllPaginated(
    paginationDto: UsersActivityPaginationDto,
  ): Promise<PaginatedResponseDto<UsersActivity>> {
    const filters = {
      user_id: paginationDto.user_id,
      username: paginationDto.username,
      action: paginationDto.action,
      entity_type: paginationDto.entity_type,
      entity_id: paginationDto.entity_id,
      status: paginationDto.status,
      ip_address: paginationDto.ip_address,
      date_from: paginationDto.date_from,
      date_to: paginationDto.date_to,
      search: paginationDto.search,
    };

    const { data, total } = await this.repository.findAllPaginated(
      filters,
      paginationDto.page || 1,
      paginationDto.limit || 10,
      paginationDto.sortBy,
      paginationDto.sortOrder || 'DESC',
    );

    return this.paginationService.createPaginatedResponse(
      data,
      paginationDto,
      total,
    );
  }

  async findOne(id: string): Promise<UsersActivity> {
    const activity = await this.repository.findOne(id);
    if (!activity) {
      throw new NotFoundException('User activity not found');
    }
    return activity;
  }

  async findByUserId(userId: string, limit: number = 50): Promise<UsersActivity[]> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    return this.repository.findByUserId(userId, limit);
  }

  async findByEntity(entityType: string, entityId: string): Promise<UsersActivity[]> {
    if (!entityType || !entityId) {
      throw new BadRequestException('Entity type and entity ID are required');
    }
    return this.repository.findByEntity(entityType, entityId);
  }

  async findByAction(action: UserActivityAction, limit: number = 100): Promise<UsersActivity[]> {
    if (!action) {
      throw new BadRequestException('Action is required');
    }
    return this.repository.findByAction(action, limit);
  }

  async getActivityStats(
    userId?: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<{
    total_activities: number;
    success_count: number;
    failed_count: number;
    actions_breakdown: Record<string, number>;
  }> {
    return this.repository.getActivityStats(userId, dateFrom, dateTo);
  }

  async findByDateRange(dateFrom: Date, dateTo: Date): Promise<UsersActivity[]> {
    if (!dateFrom || !dateTo) {
      throw new BadRequestException('Date from and date to are required');
    }

    if (dateFrom > dateTo) {
      throw new BadRequestException('Date from must be before date to');
    }

    return this.repository.findByDateRange(dateFrom, dateTo);
  }
}

