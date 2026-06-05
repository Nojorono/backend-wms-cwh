import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  IsDateString,
  ArrayMinSize,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  OpeningBalanceStockStatus,
  OpeningBalanceStockSource,
} from '../../core/domain/entities/opening-balance-stock.entity';
import { CreateOpeningBalanceStockItemDto } from './create-opening-balance-stock-item.dto';

export class CreateOpeningBalanceStockDto {
  @ApiPropertyOptional({
    example: 'OBS-2026-0001',
    description: 'Opening balance code (auto-generated if not provided)',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  code?: string;

  @ApiPropertyOptional({ example: 'DOC-2026-001', description: 'Document reference number' })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({ example: 'GS-JKT', description: 'Organization / branch identifier' })
  @IsOptional()
  @IsString()
  organization_id?: string;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Opening balance period date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  period_date?: string;

  @ApiPropertyOptional({ example: 1, description: 'Period week number' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  week_number?: number;

  @ApiPropertyOptional({ example: 'Year start opening balance', description: 'Notes', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({
    enum: OpeningBalanceStockStatus,
    example: OpeningBalanceStockStatus.DRAFT,
    default: OpeningBalanceStockStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(OpeningBalanceStockStatus)
  status?: OpeningBalanceStockStatus;

  @ApiPropertyOptional({
    enum: OpeningBalanceStockSource,
    example: OpeningBalanceStockSource.MANUAL,
    default: OpeningBalanceStockSource.MANUAL,
  })
  @IsOptional()
  @IsEnum(OpeningBalanceStockSource)
  source?: OpeningBalanceStockSource;

  @ApiProperty({
    type: [CreateOpeningBalanceStockItemDto],
    description: 'Opening balance line items (at least one required)',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one item is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateOpeningBalanceStockItemDto)
  items: CreateOpeningBalanceStockItemDto[];
}
