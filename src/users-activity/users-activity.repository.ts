import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { UsersActivity } from '../core/domain/entities/users-activity.entity';
import { CreateUsersActivityDto } from './dto/create-users-activity.dto';
import { UsersActivityPaginationDto } from './dto/users-activity-pagination.dto';

@Injectable()
export class UsersActivityRepository {
  constructor(
    @InjectRepository(UsersActivity)
    private readonly repository: Repository<UsersActivity>,
  ) {}

  async create(data: CreateUsersActivityDto): Promise<UsersActivity> {
    const activity = this.repository.create(data);
    return this.repository.save(activity);
  }

  async findAll(): Promise<UsersActivity[]> {
    return this.repository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<UsersActivity | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async findAllPaginated(
    filters: {
      user_id?: string;
      username?: string;
      action?: string;
      entity_type?: string;
      entity_id?: string;
      status?: string;
      ip_address?: string;
      date_from?: string;
      date_to?: string;
      search?: string;
    },
    page: number = 1,
    limit: number = 10,
    sortBy?: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<{ data: UsersActivity[]; total: number }> {
    const queryBuilder = this.repository.createQueryBuilder('users_activity');

    // Apply filters
    if (filters.user_id) {
      queryBuilder.andWhere('users_activity.user_id = :user_id', { user_id: filters.user_id });
    }

    if (filters.username) {
      queryBuilder.andWhere('users_activity.username LIKE :username', {
        username: `%${filters.username}%`,
      });
    }

    if (filters.action) {
      queryBuilder.andWhere('users_activity.action = :action', { action: filters.action });
    }

    if (filters.entity_type) {
      queryBuilder.andWhere('users_activity.entity_type = :entity_type', {
        entity_type: filters.entity_type,
      });
    }

    if (filters.entity_id) {
      queryBuilder.andWhere('users_activity.entity_id = :entity_id', {
        entity_id: filters.entity_id,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('users_activity.status = :status', { status: filters.status });
    }

    if (filters.ip_address) {
      queryBuilder.andWhere('users_activity.ip_address = :ip_address', {
        ip_address: filters.ip_address,
      });
    }

    if (filters.date_from && filters.date_to) {
      queryBuilder.andWhere('users_activity.createdAt BETWEEN :date_from AND :date_to', {
        date_from: filters.date_from,
        date_to: filters.date_to,
      });
    } else if (filters.date_from) {
      queryBuilder.andWhere('users_activity.createdAt >= :date_from', {
        date_from: filters.date_from,
      });
    } else if (filters.date_to) {
      queryBuilder.andWhere('users_activity.createdAt <= :date_to', {
        date_to: filters.date_to,
      });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(LOWER(users_activity.username) LIKE :search OR LOWER(users_activity.description) LIKE :search OR LOWER(users_activity.entity_type) LIKE :search)',
        { search: `%${filters.search.toLowerCase()}%` },
      );
    }

    // Apply sorting
    const sortableFields: Record<string, string> = {
      createdAt: 'users_activity.createdAt',
      action: 'users_activity.action',
      status: 'users_activity.status',
      username: 'users_activity.username',
      entity_type: 'users_activity.entity_type',
    };

    const orderField = sortBy && sortableFields[sortBy] ? sortableFields[sortBy] : 'users_activity.createdAt';
    queryBuilder.orderBy(orderField, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async findByUserId(userId: string, limit: number = 50): Promise<UsersActivity[]> {
    return this.repository.find({
      where: { user_id: userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByEntity(entityType: string, entityId: string): Promise<UsersActivity[]> {
    return this.repository.find({
      where: {
        entity_type: entityType,
        entity_id: entityId,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findByAction(action: string, limit: number = 100): Promise<UsersActivity[]> {
    return this.repository.find({
      where: { action: action as any },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByDateRange(dateFrom: Date, dateTo: Date): Promise<UsersActivity[]> {
    return this.repository.find({
      where: {
        createdAt: Between(dateFrom, dateTo),
      },
      order: { createdAt: 'DESC' },
    });
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
    const queryBuilder = this.repository.createQueryBuilder('users_activity');

    if (userId) {
      queryBuilder.andWhere('users_activity.user_id = :userId', { userId });
    }

    if (dateFrom && dateTo) {
      queryBuilder.andWhere('users_activity.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      });
    }

    const allActivities = await queryBuilder.getMany();

    const stats = {
      total_activities: allActivities.length,
      success_count: allActivities.filter((a) => a.status === 'SUCCESS').length,
      failed_count: allActivities.filter((a) => a.status === 'FAILED').length,
      actions_breakdown: {} as Record<string, number>,
    };

    allActivities.forEach((activity) => {
      stats.actions_breakdown[activity.action] =
        (stats.actions_breakdown[activity.action] || 0) + 1;
    });

    return stats;
  }
}

