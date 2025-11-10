import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, IsOptional } from 'class-validator';

export class CreateInventoryReservationDto {
  @ApiProperty({
    description: 'Transaction picking ID',
    example: 'uuid-transaction-picking-1',
  })
  @IsString()
  transaction_picking_id: string;

  @ApiProperty({
    description: 'Item ID',
    example: 'uuid-item-1',
  })
  @IsString()
  item_id: string;

  @ApiProperty({
    description: 'Quantity to reserve',
    example: 100,
  })
  @IsNumber()
  @IsPositive()
  quantity_reserved: number;

  @ApiProperty({
    description: 'Unit of measurement',
    example: 'DUS',
  })
  @IsString()
  uom: string;

  @ApiProperty({
    description: 'Warehouse sub ID',
    example: 'uuid-warehouse-sub-1',
  })
  @IsString()
  warehouse_sub_id: string;

  @ApiPropertyOptional({
    description: 'Warehouse bin ID (optional, for bin-level locations)',
    example: 'uuid-warehouse-bin-1',
  })
  @IsOptional()
  @IsString()
  warehouse_bin_id?: string;

  @ApiPropertyOptional({
    description: 'Week number for FIFO tracking',
    example: 43,
  })
  @IsOptional()
  @IsNumber()
  week_number?: number;
}

