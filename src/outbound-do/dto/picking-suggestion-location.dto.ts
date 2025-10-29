import { ApiProperty } from '@nestjs/swagger';

export class PickingSuggestionLocationDto {
  @ApiProperty({
    description: 'Available quantity in this location',
    example: 24
  })
  available_quantity: number;

  @ApiProperty({
    description: 'Quantity ready to pick from this location',
    example: 24
  })
  quantity_ready_to_pick: number;

  @ApiProperty({
    description: 'Unit of measurement',
    example: 'DUS'
  })
  uom: string;

  @ApiProperty({
    description: 'Warehouse name',
    example: 'CHW-01'
  })
  warehouse_name: string;

  @ApiProperty({
    description: 'Warehouse sub name',
    example: 'JT-06'
  })
  warehouse_sub_name: string;

  @ApiProperty({
    description: 'Warehouse sub code',
    example: 'JT-06'
  })
  warehouse_sub_code: string;

  @ApiProperty({
    description: 'Warehouse sub ID',
    example: 'cb6d96df-fbb5-4fd0-8cc4-295c7fbf91fd'
  })
  warehouse_sub_id: string;

  @ApiProperty({
    description: 'Bin ID',
    example: 'abc123-def456-ghi789'
  })
  bin_id: string;

  @ApiProperty({
    description: 'Bin code',
    example: 'ABC'
  })
  bin_code: string;

  @ApiProperty({
    description: 'Bin name',
    example: 'ABC'
  })
  bin_name: string;

  @ApiProperty({
    description: 'Search level for inventory location',
    enum: ['BIN_LEVEL', 'SUB_LEVEL', 'WAREHOUSE_LEVEL'],
    example: 'BIN_LEVEL'
  })
  search_level: string;

  @ApiProperty({
    description: 'Location type',
    enum: ['BIN', 'WAREHOUSE_SUB', 'WAREHOUSE'],
    example: 'BIN'
  })
  location_type: string;

  @ApiProperty({
    description: 'Location priority (1=bin, 2=sub, 3=warehouse)',
    example: 1
  })
  location_priority: number;

  @ApiProperty({
    description: 'Week number for FIFO',
    example: 43
  })
  week_number: number;

  @ApiProperty({
    description: 'Production date',
    example: '2024-10-21'
  })
  production_date: string;

  @ApiProperty({
    description: 'Human readable place description',
    example: 'JT-06 - ABC'
  })
  place: string;
}
