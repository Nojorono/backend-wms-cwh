import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { BasePaginationQueryDto } from '../../core/dto/base-pagination.dto';

export class MasterItemPaginationQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter items by name',
    example: 'Product A',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter items by code',
    example: 'ITEM-001',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'Filter items by category',
    example: 'Electronics',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter items by supplier ID',
    example: 'uuid-supplier-123',
  })
  @IsOptional()
  @IsString()
  supplier_id?: string;

  @ApiPropertyOptional({
    description: 'Filter items by minimum price',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  min_price?: number;

  @ApiPropertyOptional({
    description: 'Filter items by maximum price',
    example: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  max_price?: number;

  @ApiPropertyOptional({
    description: 'Filter items by active status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  is_active?: boolean;
}
