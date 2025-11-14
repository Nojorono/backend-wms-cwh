import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BasePaginationQueryDto } from '../../core/dto/base-pagination.dto';

export class InventoryTrackingPaginationQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by inventory status',
    example: 'IN_INVENTORY',
  })
  @IsOptional()
  @IsString()
  inventory_status?: string;

  @ApiPropertyOptional({
    description: 'Filter by warehouse ID',
    example: 'uuid-warehouse-123',
  })
  @IsOptional()
  @IsString()
  warehouse_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by warehouse sub ID',
    example: 'uuid-warehouse-sub-123',
  })
  @IsOptional()
  @IsString()
  warehouse_sub_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by warehouse bin ID',
    example: 'uuid-warehouse-bin-123',
  })
  @IsOptional()
  @IsString()
  warehouse_bin_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by pallet ID',
    example: 'uuid-pallet-123',
  })
  @IsOptional()
  @IsString()
  pallet_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by progression status',
    example: 'IN_PROGRESS',
  })
  @IsOptional()
  @IsString()
  progression_status?: string;
}

