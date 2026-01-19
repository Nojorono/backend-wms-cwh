import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsObject,
} from 'class-validator';
import { EntityType } from '../../core/domain/entities/approval.entity';

export class CreateApprovalDto {
  @ApiProperty({
    enum: EntityType,
    example: EntityType.STOCK_ADJUSTMENT,
    description: 'Type of entity being approved',
  })
  @IsEnum(EntityType, { message: 'entity_type must be a valid EntityType' })
  entity_type: EntityType;

  @ApiProperty({
    example: 'uuid-entity-123',
    description: 'ID of the entity being approved',
  })
  @IsUUID(4, { message: 'entity_id must be a valid UUID' })
  @IsNotEmpty({ message: 'entity_id is required' })
  entity_id: string;

  @ApiPropertyOptional({
    example: { pallet_id: 'uuid-pallet', item_id: 'uuid-item' },
    description: 'Additional entity data stored as JSON',
  })
  @IsOptional()
  @IsObject({ message: 'entity_data must be an object' })
  entity_data?: Record<string, any>;

  @ApiPropertyOptional({
    example: 'uuid-approval-setup-123',
    description: 'Approval setup ID to use. If not provided, will use default for entity_type',
  })
  @IsOptional()
  @IsUUID(4, { message: 'approval_setup_id must be a valid UUID' })
  approval_setup_id?: string;

  @ApiProperty({
    example: 'Stock adjustment request for inventory correction',
    description: 'Reason for the approval request',
  })
  @IsString({ message: 'reason must be a string' })
  @IsNotEmpty({ message: 'reason is required' })
  reason: string;

  @ApiPropertyOptional({
    example: 'Additional notes about the request',
    description: 'Additional notes',
  })
  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  notes?: string;

  @ApiPropertyOptional({
    example: 'uuid-user-123',
    description: 'User ID who requested the approval',
  })
  @IsOptional()
  @IsUUID(4, { message: 'requested_by must be a valid UUID' })
  requested_by?: string;
}

