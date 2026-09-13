import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ItemInventoryTrackingDto {
  @ApiProperty({ example: 'uuid-inventory-tracking-123' })
  inventory_tracking_id: string;

  @ApiProperty({ example: 'uuid-pallet-123' })
  pallet_id: string;

  @ApiPropertyOptional({ example: 'PAL-001' })
  pallet_code?: string;

  @ApiProperty({ example: 'uuid-warehouse-123' })
  warehouse_id: string;

  @ApiPropertyOptional({ example: 'uuid-warehouse-sub-123' })
  warehouse_sub_id?: string;

  @ApiPropertyOptional({ example: 'uuid-warehouse-bin-123' })
  warehouse_bin_id?: string;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z' })
  inventory_date?: Date;

  @ApiPropertyOptional({ example: 'IN_INVENTORY' })
  inventory_status?: string;

  @ApiPropertyOptional({ example: 'Inventory note' })
  inventory_note?: string;

  @ApiPropertyOptional({ example: 1 })
  week_number?: number;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z' })
  production_date?: Date;

  @ApiProperty({ example: 'uuid-item-123' })
  item_id: string;

  @ApiProperty({ example: 100 })
  quantity: number;

  @ApiPropertyOptional({ example: 'PCS' })
  uom?: string;

  @ApiPropertyOptional({ example: 'Main Warehouse' })
  warehouse_name?: string;

  @ApiPropertyOptional({ example: 'Sub Warehouse A' })
  warehouse_sub_name?: string;

  @ApiPropertyOptional({ example: 'Bin 01' })
  bin_name?: string;

  @ApiPropertyOptional({ example: 'BIN-01' })
  bin_code?: string;

  @ApiPropertyOptional({ example: 75.5 })
  pallet_utilization?: number;
}
