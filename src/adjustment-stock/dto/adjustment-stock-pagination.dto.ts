import { IsOptional, IsString, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { AdjustmentStockType, AdjustmentStockApprovalStatus, AdjustmentStockIsInventory } from '../../core/domain/entities/adjustment_stock.entity';

export class AdjustmentStockPaginationDto {
  @ApiPropertyOptional({ 
    example: 'ADJ-2025', 
    description: 'Search term for code, document, or notes',
    required: false 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    enum: AdjustmentStockType,
    description: 'Filter by adjustment type',
    required: false 
  })
  @IsOptional()
  @IsEnum(AdjustmentStockType)
  type?: AdjustmentStockType;

  @ApiPropertyOptional({ 
    enum: AdjustmentStockApprovalStatus,
    description: 'Filter by approval status',
    required: false 
  })
  @IsOptional()
  @IsEnum(AdjustmentStockApprovalStatus)
  status?: AdjustmentStockApprovalStatus;

  @ApiPropertyOptional({ 
    enum: AdjustmentStockIsInventory,
    description: 'Filter by inventory type',
    required: false 
  })
  @IsOptional()
  @IsEnum(AdjustmentStockIsInventory)
  is_inventory?: AdjustmentStockIsInventory;

  @ApiPropertyOptional({ 
    example: 'uuid-pallet-123', 
    description: 'Filter by pallet ID',
    required: false 
  })
  @IsOptional()
  @IsString()
  pallet_id?: string;

  @ApiPropertyOptional({ 
    example: 'uuid-item-123', 
    description: 'Filter by item ID',
    required: false 
  })
  @IsOptional()
  @IsString()
  item_id?: string;

  @ApiPropertyOptional({ 
    example: 1, 
    description: 'Page number',
    minimum: 1,
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    example: 10, 
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ 
    example: 'createdAt', 
    description: 'Field to sort by',
    required: false 
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ 
    example: 'desc', 
    description: 'Sort order',
    enum: ['asc', 'desc'],
    required: false 
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
