import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsArray, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { BasePaginationQueryDto } from '../../core/dto/base-pagination.dto';
import { NotificationStatus } from '../../core/domain/entities/notification-history.entity';
import { NotificationType, NotificationPriority } from './websocket.dto';

export class NotificationHistoryQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by notification type',
    enum: NotificationType,
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({
    description: 'Filter by notification status',
    enum: NotificationStatus,
  })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiPropertyOptional({
    description: 'Filter by priority',
    enum: NotificationPriority,
  })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({
    description: 'Filter by entity type',
    example: 'inbound',
  })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({
    description: 'Filter by entity ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Filter by warehouse ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiPropertyOptional({
    description: 'Filter by organization ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({
    description: 'Filter unread notifications only',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  unreadOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by role',
    example: 'WAREHOUSE_MANAGER',
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    description: 'Start date for filtering (ISO 8601)',
    example: '2025-11-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering (ISO 8601)',
    example: '2025-11-30T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class MarkAsReadDto {
  @ApiProperty({
    description: 'Notification ID to mark as read',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  notificationId: string;

  @ApiProperty({
    description: 'User ID who read the notification',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  userId: string;

  @ApiPropertyOptional({
    description: 'Username who read the notification',
    example: 'john_doe',
  })
  @IsOptional()
  @IsString()
  username?: string;
}

export class BulkMarkAsReadDto {
  @ApiProperty({
    description: 'Array of notification IDs to mark as read',
    example: ['550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001'],
  })
  @IsArray()
  @IsString({ each: true })
  notificationIds: string[];

  @ApiProperty({
    description: 'User ID who read the notifications',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  userId: string;

  @ApiPropertyOptional({
    description: 'Username who read the notifications',
    example: 'john_doe',
  })
  @IsOptional()
  @IsString()
  username?: string;
}

export class NotificationHistoryResponseDto {
  @ApiProperty({
    description: 'Notification ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Notification type',
    example: 'INBOUND_CREATED',
  })
  type: string;

  @ApiProperty({
    description: 'Notification title',
    example: 'Inbound Baru Dibuat',
  })
  title: string;

  @ApiProperty({
    description: 'Notification message',
    example: 'Inbound INB-2025-001 dari JNE telah dibuat',
  })
  message: string;

  @ApiProperty({
    description: 'Priority',
    example: 'MEDIUM',
  })
  priority: string;

  @ApiPropertyOptional({
    description: 'Entity ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  entity_id?: string;

  @ApiPropertyOptional({
    description: 'Entity type',
    example: 'inbound',
  })
  entity_type?: string;

  @ApiPropertyOptional({
    description: 'Metadata',
  })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  user_id?: string;

  @ApiPropertyOptional({
    description: 'Username',
    example: 'john_doe',
  })
  username?: string;

  @ApiPropertyOptional({
    description: 'Target rooms',
    example: ['warehouse_123'],
  })
  rooms?: string[];

  @ApiProperty({
    description: 'Notification status',
    example: 'SENT',
  })
  status: NotificationStatus;

  @ApiProperty({
    description: 'Sent timestamp',
    example: '2025-11-11T08:30:00.000Z',
  })
  sent_at: Date;

  @ApiPropertyOptional({
    description: 'Delivered timestamp',
    example: '2025-11-11T08:30:05.000Z',
  })
  delivered_at?: Date;

  @ApiPropertyOptional({
    description: 'Read timestamp',
    example: '2025-11-11T08:35:00.000Z',
  })
  read_at?: Date;

  @ApiPropertyOptional({
    description: 'Read by user ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  read_by?: string;

  @ApiProperty({
    description: 'Is broadcast notification',
    example: false,
  })
  is_broadcast: boolean;

  @ApiPropertyOptional({
    description: 'Organization ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  organization_id?: string;

  @ApiPropertyOptional({
    description: 'Warehouse ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  warehouse_id?: string;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2025-11-11T08:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated timestamp',
    example: '2025-11-11T08:30:00.000Z',
  })
  updatedAt: Date;
}

export class NotificationStatsDto {
  @ApiProperty({
    description: 'Total notifications',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Unread notifications',
    example: 25,
  })
  unread: number;

  @ApiProperty({
    description: 'Read notifications',
    example: 125,
  })
  read: number;

  @ApiProperty({
    description: 'Count by priority',
    example: { LOW: 50, MEDIUM: 70, HIGH: 25, URGENT: 5 },
  })
  byPriority: Record<string, number>;

  @ApiProperty({
    description: 'Count by type',
    example: { INBOUND_CREATED: 30, PICKING_ASSIGNED: 45 },
  })
  byType: Record<string, number>;

  @ApiProperty({
    description: 'Count by status',
    example: { SENT: 100, DELIVERED: 90, READ: 125, FAILED: 5 },
  })
  byStatus: Record<string, number>;
}

