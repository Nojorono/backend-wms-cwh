import { IsString, IsOptional, IsNumber, IsDateString, IsEnum, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OpeningBalanceStockStatus } from '../../core/domain/entities/opening-balance-stock.entity';

/** Header fields sent alongside the uploaded Excel file (multipart/form-data). */
export class UploadOpeningBalanceStockExcelDto {
  @ApiPropertyOptional({ example: 'OBS-2026-0001', description: 'Code (auto-generated if omitted)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  code?: string;

  @ApiPropertyOptional({ example: 'DOC-2026-001' })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({ example: 'GS-JKT' })
  @IsOptional()
  @IsString()
  organization_id?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  period_date?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  week_number?: number;

  @ApiPropertyOptional({ example: 'Imported from Excel' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ enum: OpeningBalanceStockStatus })
  @IsOptional()
  @IsEnum(OpeningBalanceStockStatus)
  status?: OpeningBalanceStockStatus;
}
