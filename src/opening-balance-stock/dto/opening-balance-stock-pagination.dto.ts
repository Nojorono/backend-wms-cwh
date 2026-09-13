import { IsOptional, IsString, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  OpeningBalanceStockStatus,
  OpeningBalanceStockSource,
} from '../../core/domain/entities/opening-balance-stock.entity';

export class OpeningBalanceStockPaginationDto {
  @ApiPropertyOptional({
    example: 'OBS-2026',
    description: 'Search term for code, document, or notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: OpeningBalanceStockStatus,
    description: 'Filter by status',
    required: false,
  })
  @IsOptional()
  @IsEnum(OpeningBalanceStockStatus)
  status?: OpeningBalanceStockStatus;

  @ApiPropertyOptional({
    enum: OpeningBalanceStockSource,
    description: 'Filter by source',
    required: false,
  })
  @IsOptional()
  @IsEnum(OpeningBalanceStockSource)
  source?: OpeningBalanceStockSource;

  @ApiPropertyOptional({ example: 'GS-JKT', description: 'Filter by organization', required: false })
  @IsOptional()
  @IsString()
  organization_id?: string;

  @ApiPropertyOptional({ example: 1, description: 'Page number', minimum: 1, required: false })
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
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'createdAt', description: 'Field to sort by', required: false })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    example: 'desc',
    description: 'Sort order',
    enum: ['asc', 'desc'],
    required: false,
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
