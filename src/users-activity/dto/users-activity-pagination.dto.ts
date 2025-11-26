import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UserActivityAction, UserActivityStatus } from '../../core/domain/entities/users-activity.entity';
import { PaginationQueryDto } from '../../core/dto/pagination.dto';

export class UsersActivityPaginationDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'user-uuid-123' })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiPropertyOptional({ example: 'john.doe' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ enum: UserActivityAction })
  @IsOptional()
  @IsEnum(UserActivityAction)
  action?: UserActivityAction;

  @ApiPropertyOptional({ example: 'inbound' })
  @IsOptional()
  @IsString()
  entity_type?: string;

  @ApiPropertyOptional({ example: 'entity-uuid-123' })
  @IsOptional()
  @IsString()
  entity_id?: string;

  @ApiPropertyOptional({ enum: UserActivityStatus })
  @IsOptional()
  @IsEnum(UserActivityStatus)
  declare status?: UserActivityStatus;

  @ApiPropertyOptional({ example: '192.168.1.1' })
  @IsOptional()
  @IsString()
  ip_address?: string;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ example: '2025-01-31' })
  @IsOptional()
  @IsDateString()
  date_to?: string;
}

