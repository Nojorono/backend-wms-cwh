import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, Between, In } from 'typeorm';
import { NotificationHistory, NotificationStatus } from '../core/domain/entities/notification-history.entity';
import { NotificationHistoryQueryDto } from './dto/notification-history.dto';
import { BaseNotificationDto } from './dto/websocket.dto';

@Injectable()
export class NotificationHistoryRepository {
  constructor(
    @InjectRepository(NotificationHistory)
    private readonly repository: Repository<NotificationHistory>,
  ) {}

  async create(notification: BaseNotificationDto & {
    recipients?: string[];
    isBroadcast?: boolean;
    organizationId?: string;
    warehouseId?: string;

  }): Promise<NotificationHistory> {
    const history = this.repository.create({
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      entity_id: notification.entityId,
      entity_type: notification.entityType,
      metadata: notification.metadata,
      user_id: notification.userId,
      username: notification.username,
      rooms: notification.rooms,
      recipients: notification.recipients,
      status: NotificationStatus.SENT,
      sent_at: new Date(),
      is_broadcast: notification.isBroadcast || false,
      organization_id: notification.organizationId,
      warehouse_id: notification.warehouseId,
    });

    return await this.repository.save(history);
  }

  async findAllPaginated(
    query: NotificationHistoryQueryDto,
  ): Promise<{ data: NotificationHistory[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      userId,
      type,
      status,
      priority,
      entityType,
      entityId,
      warehouseId,
      organizationId,
      unreadOnly,
      role,
      startDate,
      endDate,
    } = query;

    const queryBuilder = this.repository
      .createQueryBuilder('notification')
      .where('notification.deletedAt IS NULL');

    // Filter by user ID (check both user_id and recipients array)
    if (userId) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('notification.user_id = :userId', { userId })
            .orWhere(':userId = ANY(notification.recipients)', { userId });
        }),
      );
    }

    // Filter by type
    if (type) {
      queryBuilder.andWhere('notification.type = :type', { type });
    }

    // Filter by status
    if (status) {
      queryBuilder.andWhere('notification.status = :status', { status });
    }

    // Filter by priority
    if (priority) {
      queryBuilder.andWhere('notification.priority = :priority', { priority });
    }

    // Filter by entity type
    if (entityType) {
      queryBuilder.andWhere('notification.entity_type = :entityType', { entityType });
    }

    // Filter by entity ID
    if (entityId) {
      queryBuilder.andWhere('notification.entity_id = :entityId', { entityId });
    }

    // Filter by warehouse
    if (warehouseId) {
      queryBuilder.andWhere('notification.warehouse_id = :warehouseId', { warehouseId });
    }

    // Filter by organization
    if (organizationId) {
      queryBuilder.andWhere('notification.organization_id = :organizationId', { organizationId });
    }

    // Filter by role
    if (role) {
      const roleRoom = `role:${role}`;
      queryBuilder.andWhere(':roleRoom = ANY(notification.rooms)', { roleRoom });
    }

    // Filter unread only
    if (unreadOnly) {
      queryBuilder.andWhere('notification.status != :readStatus', { readStatus: NotificationStatus.READ });
    }

    // Filter by date range
    if (startDate && endDate) {
      queryBuilder.andWhere('notification.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      queryBuilder.andWhere('notification.createdAt >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('notification.createdAt <= :endDate', { endDate });
    }

    // Search
    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(notification.title) LIKE LOWER(:search)', { search: `%${search}%` })
            .orWhere('LOWER(notification.message) LIKE LOWER(:search)', { search: `%${search}%` })
            .orWhere('LOWER(notification.type) LIKE LOWER(:search)', { search: `%${search}%` });
        }),
      );
    }

    // Sorting
    const sortableFields: Record<string, string> = {
      createdAt: 'notification.createdAt',
      sentAt: 'notification.sent_at',
      readAt: 'notification.read_at',
      type: 'notification.type',
      priority: 'notification.priority',
      status: 'notification.status',
    };

    const orderByField = sortableFields[sortBy] || 'notification.createdAt';
    queryBuilder.orderBy(orderByField, sortOrder === 'ASC' ? 'ASC' : 'DESC');

    // Pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<NotificationHistory | null> {
    return await this.repository.findOne({
      where: { id },
    });
  }

  async markAsRead(id: string, userId: string, username?: string): Promise<NotificationHistory> {
    await this.repository.update(id, {
      status: NotificationStatus.READ,
      read_at: new Date(),
      read_by: userId,
    });

    const updated = await this.findOne(id);
    if (!updated) {
      throw new Error('Notification not found after update');
    }
    return updated;
  }

  async bulkMarkAsRead(ids: string[], userId: string): Promise<void> {
    await this.repository.update(
      { id: In(ids) },
      {
        status: NotificationStatus.READ,
        read_at: new Date(),
        read_by: userId,
      },
    );
  }

  async markAsDelivered(id: string): Promise<void> {
    await this.repository.update(id, {
      status: NotificationStatus.DELIVERED,
      delivered_at: new Date(),
    });
  }

  async markAsFailed(id: string, errorMessage: string): Promise<void> {
    await this.repository.update(id, {
      status: NotificationStatus.FAILED,
      error_message: errorMessage,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.repository.count({
      where: [
        { user_id: userId, status: NotificationStatus.SENT },
        { user_id: userId, status: NotificationStatus.DELIVERED },
      ],
    });
  }

  async getStats(userId?: string, warehouseId?: string, organizationId?: string): Promise<any> {
    const queryBuilder = this.repository.createQueryBuilder('notification');

    if (userId) {
      queryBuilder.where(
        new Brackets((qb) => {
          qb.where('notification.user_id = :userId', { userId })
            .orWhere(':userId = ANY(notification.recipients)', { userId });
        }),
      );
    }

    if (warehouseId) {
      queryBuilder.andWhere('notification.warehouse_id = :warehouseId', { warehouseId });
    }

    if (organizationId) {
      queryBuilder.andWhere('notification.organization_id = :organizationId', { organizationId });
    }

    const [total, unread, read] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder.andWhere('notification.status != :readStatus', { readStatus: NotificationStatus.READ }).getCount(),
      queryBuilder.andWhere('notification.status = :readStatus', { readStatus: NotificationStatus.READ }).getCount(),
    ]);

    // Get counts by priority
    const byPriorityQuery = this.repository
      .createQueryBuilder('notification')
      .select('notification.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('notification.priority');

    if (userId) {
      byPriorityQuery.where(
        new Brackets((qb) => {
          qb.where('notification.user_id = :userId', { userId })
            .orWhere(':userId = ANY(notification.recipients)', { userId });
        }),
      );
    }

    const byPriority = await byPriorityQuery.getRawMany();
    const byPriorityMap = byPriority.reduce((acc, item) => {
      acc[item.priority] = parseInt(item.count, 10);
      return acc;
    }, {});

    // Get counts by type
    const byTypeQuery = this.repository
      .createQueryBuilder('notification')
      .select('notification.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('notification.type')
      .orderBy('COUNT(*)', 'DESC')
      .limit(10);

    if (userId) {
      byTypeQuery.where(
        new Brackets((qb) => {
          qb.where('notification.user_id = :userId', { userId })
            .orWhere(':userId = ANY(notification.recipients)', { userId });
        }),
      );
    }

    const byType = await byTypeQuery.getRawMany();
    const byTypeMap = byType.reduce((acc, item) => {
      acc[item.type] = parseInt(item.count, 10);
      return acc;
    }, {});

    // Get counts by status
    const byStatusQuery = this.repository
      .createQueryBuilder('notification')
      .select('notification.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('notification.status');

    if (userId) {
      byStatusQuery.where(
        new Brackets((qb) => {
          qb.where('notification.user_id = :userId', { userId })
            .orWhere(':userId = ANY(notification.recipients)', { userId });
        }),
      );
    }

    const byStatus = await byStatusQuery.getRawMany();
    const byStatusMap = byStatus.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count, 10);
      return acc;
    }, {});

    return {
      total,
      unread,
      read,
      byPriority: byPriorityMap,
      byType: byTypeMap,
      byStatus: byStatusMap,
    };
  }

  async deleteOldNotifications(daysOld: number): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - daysOld);

    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :date', { date })
      .andWhere('status = :status', { status: NotificationStatus.READ })
      .execute();

    return result.affected || 0;
  }
}

