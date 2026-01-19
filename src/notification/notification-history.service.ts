import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationHistoryRepository } from './notification-history.repository';
import { NotificationHistoryQueryDto } from './dto/notification-history.dto';
import { NotificationHistory } from '../core/domain/entities/notification-history.entity';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { PaginationService } from '../core/services/pagination.service';

@Injectable()
export class NotificationHistoryService {
  constructor(
    private readonly repository: NotificationHistoryRepository,
    private readonly paginationService: PaginationService,
  ) {}

  async findAll(
    query: NotificationHistoryQueryDto,
  ): Promise<PaginatedResponseDto<NotificationHistory>> {
    const { data, total } = await this.repository.findAllPaginated(query);
    return this.paginationService.createPaginatedResponse(data, query, total);
  }

  async findOne(id: string): Promise<NotificationHistory> {
    const notification = await this.repository.findOne(id);
    if (!notification) {
      throw new NotFoundException('Notifikasi tidak ditemukan');
    }
    return notification;
  }

  async markAsRead(
    notificationId: string,
    userId: string,
    username?: string,
  ): Promise<NotificationHistory> {
    const notification = await this.findOne(notificationId);
    return await this.repository.markAsRead(notificationId, userId, username);
  }

  async bulkMarkAsRead(
    notificationIds: string[],
    userId: string,
    username?: string,
  ): Promise<void> {
    // Validate all notifications exist
    for (const id of notificationIds) {
      await this.findOne(id);
    }
    
    await this.repository.bulkMarkAsRead(notificationIds, userId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.repository.getUnreadCount(userId);
  }

  async getStats(userId?: string, warehouseId?: string, organizationId?: string): Promise<any> {
    return await this.repository.getStats(userId, warehouseId, organizationId);
  }

  async deleteOldNotifications(daysOld: number): Promise<number> {
    if (daysOld < 1) {
      throw new Error('Days must be at least 1');
    }
    return await this.repository.deleteOldNotifications(daysOld);
  }
}

