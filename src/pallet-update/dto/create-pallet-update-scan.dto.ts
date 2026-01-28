import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsDateString,
  IsPositive,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePalletUpdateScanDto {
  @ApiPropertyOptional({ example: 'uuid-pallet-update-123' })
  @IsOptional()
  @IsUUID(4, { message: 'palletUpdateId must be a valid UUID' })
  palletUpdateId?: string;

  @ApiPropertyOptional({ example: 'SCAN-001' })
  @IsOptional()
  @IsString({ message: 'scanNumber must be a string' })
  @MaxLength(100, { message: 'scanNumber must not exceed 100 characters' })
  scanNumber?: string;

  @ApiPropertyOptional({ example: '2025-01-26T10:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'scanDate must be a valid ISO date string' })
  scanDate?: string;

  @ApiPropertyOptional({ example: 'uuid-user-123' })
  @IsOptional()
  @IsUUID(4, { message: 'scanByUserId must be a valid UUID' })
  scanByUserId?: string;

  @ApiPropertyOptional({ example: 'uuid-pallet-123' })
  @IsOptional()
  @IsUUID(4, { message: 'palletId must be a valid UUID' })
  palletId?: string;

  @ApiPropertyOptional({ example: 'uuid-item-123' })
  @IsOptional()
  @IsUUID(4, { message: 'itemId must be a valid UUID' })
  itemId?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'quantity must be a number' })
  @IsPositive({ message: 'quantity must be a positive number' })
  quantity?: number;

  @ApiPropertyOptional({ example: 'PCS' })
  @IsOptional()
  @IsString({ message: 'uom must be a string' })
  @MaxLength(50, { message: 'uom must not exceed 50 characters' })
  uom?: string;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'productionDate must be a valid ISO date string' })
  productionDate?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'weekNumber must be a number' })
  @IsPositive({ message: 'weekNumber must be a positive number' })
  weekNumber?: number;

  @ApiPropertyOptional({ example: 'Additional notes about the scan' })
  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  @MaxLength(1000, { message: 'notes must not exceed 1000 characters' })
  notes?: string;

  @ApiPropertyOptional({ example: 'PENDING' })
  @IsOptional()
  @IsString({ message: 'status must be a string' })
  @MaxLength(50, { message: 'status must not exceed 50 characters' })
  status?: string;
}
