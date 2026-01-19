import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { BasePaginationQueryDto } from '../../core/dto/base-pagination.dto';
import { MovementStatus } from '../../core/domain/entities/inventory-movement.entity';

export class InventoryMovementPaginationQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by movement status',
    enum: MovementStatus,
    example: MovementStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(MovementStatus)
  status?: MovementStatus;

  @ApiPropertyOptional({
    description: 'Filter by assigned user ID',
    example: 'uuid-user-123',
  })
  @IsOptional()
  @IsString()
  assigned_user_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by source warehouse ID',
    example: 'uuid-warehouse-123',
  })
  @IsOptional()
  @IsString()
  source_warehouse_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by source warehouse sub ID',
    example: 'uuid-warehouse-sub-123',
  })
  @IsOptional()
  @IsString()
  source_warehouse_sub_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by destination warehouse ID',
    example: 'uuid-warehouse-123',
  })
  @IsOptional()
  @IsString()
  destination_warehouse_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by destination warehouse sub ID',
    example: 'uuid-warehouse-sub-123',
  })
  @IsOptional()
  @IsString()
  destination_warehouse_sub_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by pallet ID',
    example: 'uuid-pallet-123',
  })
  @IsOptional()
  @IsString()
  pallet_id?: string;
}

