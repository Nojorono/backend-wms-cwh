import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateOpeningBalanceStockItemDto {
  @ApiProperty({
    example: 'ITM-0001',
    description: 'Item business code (m_item.item_number or sku)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  item_code: string;

  @ApiPropertyOptional({
    example: 'WHS-A1',
    description: 'Warehouse sub location code (m_warehouse_sub.code)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  warehouse_sub_code?: string;

  @ApiPropertyOptional({
    example: 'BIN-A1-01',
    description: 'Warehouse bin code (m_warehouse_bin.code)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  warehouse_bin_code?: string;

  @ApiPropertyOptional({
    example: 'PLT-0001',
    description: 'Pallet code (m_pallet.pallet_code)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  pallet_code?: string;

  @ApiProperty({ example: 100, description: 'Opening balance quantity' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional({ example: 'PCS', description: 'Unit of measure', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  uom?: string;

  @ApiPropertyOptional({ example: '2026-01-15', description: 'Production date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  production_date?: string;

  @ApiPropertyOptional({ example: 3, description: 'Production week number' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  week_number?: number;

  @ApiPropertyOptional({ example: 'Initial stock', description: 'Line note', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
