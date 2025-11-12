import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject, IsArray } from 'class-validator';

export enum NotificationType {
  // Inbound notifications
  INBOUND_CREATED = 'INBOUND_CREATED',
  INBOUND_UPDATED = 'INBOUND_UPDATED',
  INBOUND_STATUS_CHANGED = 'INBOUND_STATUS_CHANGED',
  INBOUND_DO_VALIDATED = 'INBOUND_DO_VALIDATED',
  INBOUND_INSPECTION_READY = 'INBOUND_INSPECTION_READY',
  INBOUND_INSPECTION_APPROVED = 'INBOUND_INSPECTION_APPROVED',
  
  // Scan Inbound notifications
  SCAN_INBOUND_COMPLETED = 'SCAN_INBOUND_COMPLETED',
  SCAN_INBOUND_PENDING = 'SCAN_INBOUND_PENDING',
  
  // Put Away notifications
  PUT_AWAY_ASSIGNED = 'PUT_AWAY_ASSIGNED',
  PUT_AWAY_COMPLETED = 'PUT_AWAY_COMPLETED',
  PUT_AWAY_IN_PROGRESS = 'PUT_AWAY_IN_PROGRESS',
  
  // Inventory notifications
  INVENTORY_UPDATED = 'INVENTORY_UPDATED',
  INVENTORY_LOW_STOCK = 'INVENTORY_LOW_STOCK',
  INVENTORY_LOCATION_CHANGED = 'INVENTORY_LOCATION_CHANGED',
  
  // Outbound Memo notifications
  OUTBOUND_MEMO_CREATED = 'OUTBOUND_MEMO_CREATED',
  OUTBOUND_MEMO_APPROVED = 'OUTBOUND_MEMO_APPROVED',
  OUTBOUND_MEMO_REJECTED = 'OUTBOUND_MEMO_REJECTED',
  OUTBOUND_MEMO_COMPLETED = 'OUTBOUND_MEMO_COMPLETED',
  
  // Outbound DO notifications
  OUTBOUND_DO_CREATED = 'OUTBOUND_DO_CREATED',
  OUTBOUND_DO_UPDATED = 'OUTBOUND_DO_UPDATED',
  OUTBOUND_DO_STATUS_CHANGED = 'OUTBOUND_DO_STATUS_CHANGED',
  OUTBOUND_DO_READY = 'OUTBOUND_DO_READY',
  
  // Picking notifications
  PICKING_ASSIGNED = 'PICKING_ASSIGNED',
  PICKING_STARTED = 'PICKING_STARTED',
  PICKING_COMPLETED = 'PICKING_COMPLETED',
  PICKING_SUGGESTION_READY = 'PICKING_SUGGESTION_READY',
  
  // Scan Picking notifications
  SCAN_PICKING_COMPLETED = 'SCAN_PICKING_COMPLETED',
  SCAN_PICKING_INSPECTION_READY = 'SCAN_PICKING_INSPECTION_READY',
  
  // Pallet notifications
  PALLET_QUANTITY_UPDATED = 'PALLET_QUANTITY_UPDATED',
  PALLET_FULL = 'PALLET_FULL',
  PALLET_EMPTY = 'PALLET_EMPTY',
  PALLET_MOVED = 'PALLET_MOVED',
  
  // System notifications
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  SYSTEM_WARNING = 'SYSTEM_WARNING',
  SYSTEM_INFO = 'SYSTEM_INFO',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class JoinRoomDto {
  @ApiProperty({
    description: 'Room identifier (e.g., warehouse_id, user_id, organization_id)',
    example: 'warehouse_123',
  })
  @IsString()
  room: string;
}

export class LeaveRoomDto {
  @ApiProperty({
    description: 'Room identifier to leave',
    example: 'warehouse_123',
  })
  @IsString()
  room: string;
}

export class JoinRolesDto {
  @ApiProperty({
    description: 'List of roles to join',
    example: ['WAREHOUSE_MANAGER', 'PICKER_LEAD'],
  })
  @IsArray()
  @IsString({ each: true })
  roles: string[];
}

export class LeaveRolesDto {
  @ApiProperty({
    description: 'List of roles to leave',
    example: ['WAREHOUSE_MANAGER'],
  })
  @IsArray()
  @IsString({ each: true })
  roles: string[];
}

export class BaseNotificationDto {
  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
    example: NotificationType.INBOUND_CREATED,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'Notification title',
    example: 'New Inbound Created',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Notification message',
    example: 'A new inbound shipment has been created',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Notification priority',
    enum: NotificationPriority,
    example: NotificationPriority.MEDIUM,
  })
  @IsEnum(NotificationPriority)
  priority: NotificationPriority;

  @ApiPropertyOptional({
    description: 'Entity ID related to this notification',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Entity type (e.g., inbound, outbound_memo, picking)',
    example: 'inbound',
  })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Timestamp when notification was created',
    example: '2025-11-11T08:30:00.000Z',
  })
  timestamp: string;

  @ApiPropertyOptional({
    description: 'User ID who triggered this notification',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Username who triggered this notification',
    example: 'john_doe',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    description: 'Target rooms to send notification to',
    example: ['warehouse_123', 'organization_456'],
  })
  @IsOptional()
  @IsArray()
  rooms?: string[];

}

// Specific notification DTOs for different entities

export class InboundNotificationDto extends BaseNotificationDto {
  @ApiPropertyOptional({
    description: 'Inbound number',
    example: 'INB-2025-001',
  })
  @IsOptional()
  @IsString()
  inboundNumber?: string;

  @ApiPropertyOptional({
    description: 'Inbound status',
    example: 'CREATED',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Expedition name',
    example: 'JNE',
  })
  @IsOptional()
  @IsString()
  expedition?: string;
}

export class OutboundMemoNotificationDto extends BaseNotificationDto {
  @ApiPropertyOptional({
    description: 'Requestor name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  requestor?: string;

  @ApiPropertyOptional({
    description: 'Destination',
    example: 'Warehouse B',
  })
  @IsOptional()
  @IsString()
  destination?: string;

  @ApiPropertyOptional({
    description: 'Memo status',
    example: 'APPROVED',
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class OutboundDoNotificationDto extends BaseNotificationDto {
  @ApiPropertyOptional({
    description: 'Outbound DO number',
    example: 'DO-2025-001',
  })
  @IsOptional()
  @IsString()
  outboundDoNumber?: string;

  @ApiPropertyOptional({
    description: 'Expedition name',
    example: 'J&T',
  })
  @IsOptional()
  @IsString()
  expedition?: string;

  @ApiPropertyOptional({
    description: 'Driver name',
    example: 'Ahmad',
  })
  @IsOptional()
  @IsString()
  driverName?: string;

  @ApiPropertyOptional({
    description: 'DO status',
    example: 'IN_PROGRESS',
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class PickingNotificationDto extends BaseNotificationDto {
  @ApiPropertyOptional({
    description: 'Item SKU',
    example: 'ITEM-001',
  })
  @IsOptional()
  @IsString()
  itemSku?: string;

  @ApiPropertyOptional({
    description: 'Quantity',
    example: 100,
  })
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Source warehouse sub',
    example: 'Zone A',
  })
  @IsOptional()
  @IsString()
  sourceWarehouseSub?: string;

  @ApiPropertyOptional({
    description: 'Source bin',
    example: 'A1-01',
  })
  @IsOptional()
  @IsString()
  sourceBin?: string;
}

export class PalletNotificationDto extends BaseNotificationDto {
  @ApiPropertyOptional({
    description: 'Pallet code',
    example: 'PLT-001',
  })
  @IsOptional()
  @IsString()
  palletCode?: string;

  @ApiPropertyOptional({
    description: 'Current quantity',
    example: 500,
  })
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Capacity',
    example: 1000,
  })
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({
    description: 'Location',
    example: 'Zone A - Bin A1-01',
  })
  @IsOptional()
  @IsString()
  location?: string;
}

export class InventoryNotificationDto extends BaseNotificationDto {
  @ApiPropertyOptional({
    description: 'Item description',
    example: 'Product A',
  })
  @IsOptional()
  @IsString()
  itemDescription?: string;

  @ApiPropertyOptional({
    description: 'Current stock',
    example: 150,
  })
  @IsOptional()
  currentStock?: number;

  @ApiPropertyOptional({
    description: 'Minimum stock level',
    example: 50,
  })
  @IsOptional()
  minimumStock?: number;

  @ApiPropertyOptional({
    description: 'Warehouse location',
    example: 'Zone A - Bin A1-01',
  })
  @IsOptional()
  @IsString()
  location?: string;
}

export class SystemNotificationDto extends BaseNotificationDto {
  @ApiPropertyOptional({
    description: 'Error code if applicable',
    example: 'ERR_001',
  })
  @IsOptional()
  @IsString()
  errorCode?: string;

  @ApiPropertyOptional({
    description: 'Stack trace for errors',
  })
  @IsOptional()
  @IsString()
  stackTrace?: string;
}

