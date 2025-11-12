import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationHistoryService } from './notification-history.service';
import {
  NotificationHistoryQueryDto,
  NotificationHistoryResponseDto,
  MarkAsReadDto,
  BulkMarkAsReadDto,
  NotificationStatsDto,
} from './dto/notification-history.dto';
import { ApiFlexiblePaginationQuery } from '../core/decorators/flexible-pagination.decorator';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';

@ApiTags('Notification History')
@Controller('notification-history')
@ApiBearerAuth('JWT-auth')
export class NotificationHistoryController {
  constructor(private readonly service: NotificationHistoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get notification history with pagination' })
  @ApiFlexiblePaginationQuery([
    {
      name: 'userId',
      required: false,
      type: String,
      description: 'Filter by user ID',
    },
    {
      name: 'type',
      required: false,
      type: String,
      description: 'Filter by notification type',
    },
    {
      name: 'status',
      required: false,
      type: String,
      description: 'Filter by notification status',
    },
    {
      name: 'priority',
      required: false,
      type: String,
      description: 'Filter by priority',
    },
    {
      name: 'entityType',
      required: false,
      type: String,
      description: 'Filter by entity type',
    },
    {
      name: 'entityId',
      required: false,
      type: String,
      description: 'Filter by entity ID',
    },
    {
      name: 'warehouseId',
      required: false,
      type: String,
      description: 'Filter by warehouse ID',
    },
    {
      name: 'organizationId',
      required: false,
      type: String,
      description: 'Filter by organization ID',
    },
    {
      name: 'unreadOnly',
      required: false,
      type: Boolean,
      description: 'Filter unread only',
    },
    {
      name: 'startDate',
      required: false,
      type: String,
      description: 'Start date (ISO 8601)',
    },
    {
      name: 'endDate',
      required: false,
      type: String,
      description: 'End date (ISO 8601)',
    },
  ])
  @ApiResponse({
    status: 200,
    description: 'Notification history retrieved successfully',
    type: PaginatedResponseDto<NotificationHistoryResponseDto>,
  })
  async findAll(@Query() query: NotificationHistoryQueryDto) {
    const result = await this.service.findAll(query);
    return {
      success: true,
      message: 'Notification history berhasil diambil',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics' })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'warehouseId', required: false, type: String })
  @ApiQuery({ name: 'organizationId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: NotificationStatsDto,
  })
  async getStats(
    @Query('userId') userId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const stats = await this.service.getStats(userId, warehouseId, organizationId);
    return {
      success: true,
      message: 'Statistik notifikasi berhasil diambil',
      data: stats,
    };
  }

  @Get('unread-count/:userId')
  @ApiOperation({ summary: 'Get unread notification count for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
  })
  async getUnreadCount(@Param('userId') userId: string) {
    const count = await this.service.getUnreadCount(userId);
    return {
      success: true,
      message: 'Jumlah notifikasi belum dibaca berhasil diambil',
      data: { count },
    };
  }

  @Get('by-recipient/:userId')
  @ApiOperation({ summary: 'Get all notifications for a specific recipient (user)' })
  @ApiParam({ name: 'userId', description: 'User ID (recipient)' })
  @ApiFlexiblePaginationQuery([
    {
      name: 'unreadOnly',
      required: false,
      type: Boolean,
      description: 'Filter unread only',
    },
  ])
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    type: PaginatedResponseDto<NotificationHistoryResponseDto>,
  })
  async findByRecipient(
    @Param('userId') userId: string,
    @Query() query: NotificationHistoryQueryDto,
  ) {
    // Set userId filter
    const queryWithUser = { ...query, userId };
    const result = await this.service.findAll(queryWithUser);
    return {
      success: true,
      message: 'Notifikasi untuk recipient berhasil diambil',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification history detail' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification detail retrieved successfully',
    type: NotificationHistoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async findOne(@Param('id') id: string) {
    const notification = await this.service.findOne(id);
    return {
      success: true,
      message: 'Detail notifikasi berhasil diambil',
      data: notification,
    };
  }

  @Patch('mark-as-read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read successfully',
    type: NotificationHistoryResponseDto,
  })
  async markAsRead(@Body() dto: MarkAsReadDto) {
    const notification = await this.service.markAsRead(dto.notificationId, dto.userId, dto.username);
    return {
      success: true,
      message: 'Notifikasi berhasil ditandai sebagai dibaca',
      data: notification,
    };
  }

  @Patch('bulk-mark-as-read')
  @ApiOperation({ summary: 'Mark multiple notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'Notifications marked as read successfully',
  })
  async bulkMarkAsRead(@Body() dto: BulkMarkAsReadDto) {
    await this.service.bulkMarkAsRead(dto.notificationIds, dto.userId, dto.username);
    return {
      success: true,
      message: `${dto.notificationIds.length} notifikasi berhasil ditandai sebagai dibaca`,
    };
  }

  @Delete('cleanup/:days')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete old read notifications' })
  @ApiParam({
    name: 'days',
    description: 'Delete notifications older than this many days',
    example: 30,
  })
  @ApiResponse({
    status: 200,
    description: 'Old notifications cleaned up successfully',
  })
  async cleanup(@Param('days') days: string) {
    const deleted = await this.service.deleteOldNotifications(parseInt(days, 10));
    return {
      success: true,
      message: `${deleted} notifikasi lama berhasil dihapus`,
      data: { deleted },
    };
  }
}

