import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsObject,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';
import { UserActivityAction, UserActivityStatus } from '../../core/domain/entities/users-activity.entity';

export class CreateUsersActivityDto {
  @ApiProperty({ example: 'user-uuid-123' })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiProperty({ example: 'john.doe' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ enum: UserActivityAction, example: UserActivityAction.CREATE })
  @IsNotEmpty()
  @IsEnum(UserActivityAction)
  action: UserActivityAction;

  @ApiPropertyOptional({ example: 'inbound' })
  @IsOptional()
  @IsString()
  entity_type?: string;

  @ApiPropertyOptional({ example: 'entity-uuid-123' })
  @IsOptional()
  @IsString()
  entity_id?: string;

  @ApiPropertyOptional({ example: 'User created a new inbound record' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: { field1: 'value1', field2: 'value2' } })
  @IsOptional()
  @IsObject()
  request_data?: Record<string, any>;

  @ApiPropertyOptional({ example: { success: true, data: {} } })
  @IsOptional()
  @IsObject()
  response_data?: Record<string, any>;

  @ApiPropertyOptional({ example: { additional_info: 'value' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ example: '192.168.1.1' })
  @IsOptional()
  @IsString()
  ip_address?: string;

  @ApiPropertyOptional({ example: 'Mozilla/5.0...' })
  @IsOptional()
  @IsString()
  user_agent?: string;

  @ApiPropertyOptional({ enum: UserActivityStatus, example: UserActivityStatus.SUCCESS })
  @IsOptional()
  @IsEnum(UserActivityStatus)
  status?: UserActivityStatus;

  @ApiPropertyOptional({ example: 'Error message if failed' })
  @IsOptional()
  @IsString()
  error_message?: string;

  @ApiPropertyOptional({ example: '/api/inbound' })
  @IsOptional()
  @IsString()
  endpoint?: string;

  @ApiPropertyOptional({ example: 'POST' })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsNumber()
  response_time_ms?: number;

  @ApiPropertyOptional({ example: 'org-uuid-123' })
  @IsOptional()
  @IsString()
  organization_id?: string;

  @ApiPropertyOptional({ example: 'warehouse-uuid-123' })
  @IsOptional()
  @IsString()
  warehouse_id?: string;
}

