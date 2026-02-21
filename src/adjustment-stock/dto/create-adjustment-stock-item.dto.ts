import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAdjustmentStockItemDto {
  @ApiPropertyOptional({
    example: 'uuid-warehouse-sub-123',
    description: 'Warehouse sub location ID',
  })
  @IsOptional()
  @IsUUID(4, { message: 'warehouse_sub_id must be a valid UUID' })
  warehouse_sub_id?: string;

  @ApiPropertyOptional({
    example: 'uuid-warehouse-bin-123',
    description: 'Warehouse bin location ID',
  })
  @IsOptional()
  @IsUUID(4, { message: 'warehouse_bin_id must be a valid UUID' })
  warehouse_bin_id?: string;

  @ApiPropertyOptional({
    example: 'uuid-pallet-123',
    description: 'Pallet ID',
  })
  @IsOptional()
  @IsUUID(4, { message: 'pallet_id must be a valid UUID' })
  pallet_id?: string;

  @ApiProperty({
    example: 'uuid-item-123',
    description: 'Item ID',
  })
  @IsUUID(4, { message: 'item_id must be a valid UUID' })
  item_id: string;

  @ApiProperty({
    example: 100,
    description: 'Quantity to adjust',
  })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({
    example: 'PCS',
    description: 'Unit of measure',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  uom?: string;
}
