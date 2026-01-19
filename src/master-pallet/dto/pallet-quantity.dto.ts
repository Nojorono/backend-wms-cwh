import { IsString, IsNumber, IsOptional, IsEnum, Min, Max, IsDate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuantityOperationType, StatusInventory } from '../../core/domain/entities/transaction-pallet-history.entity';

export class UpdatePalletQuantityDto {
  @ApiProperty({ example: 'uuid-item-123', description: 'Item ID being tracked' })
  @IsString()
  item_id: string;

  @ApiProperty({ example: 10, description: 'Quantity to add/remove/adjust' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({
    enum: QuantityOperationType,
    example: QuantityOperationType.ADD,
    description: 'Type of quantity operation',
  })
  @IsEnum(QuantityOperationType)
  operation_type: QuantityOperationType;

  @ApiPropertyOptional({ example: 'uuid-reference-123', description: 'Reference ID for tracking' })
  @IsOptional()
  @IsString()
  reference_id?: string;

  @ApiPropertyOptional({ example: 'uuid-inbound-123', description: 'Inbound ID for tracking' })
  @IsOptional()
  @IsString()
  inbound_id?: string;

  @ApiPropertyOptional({ example: 'uuid-outbound-do-123', description: 'Outbound DO ID for tracking' })
  @IsOptional()
  @IsString()
  outbound_do_id?: string;

  @ApiPropertyOptional({
    example: 'INBOUND',
    description: 'Reference type (INBOUND, OUTBOUND, etc.)',
  })
  @IsOptional()
  @IsString()
  reference_type?: string;

  @ApiPropertyOptional({
    example: 'Added items from inbound DO-001',
    description: 'Notes about the operation',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: 'uuid-user-123',
    description: 'User who performed the operation',
  })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiPropertyOptional({ example: 'PCS', description: 'Unit of measure for the item' })
  @IsOptional()
  @IsString()
  uom?: string;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDate()
  production_date?: Date;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  week_number?: number;

  @ApiPropertyOptional({
    enum: StatusInventory,
    example: StatusInventory.READY,
    description: 'Status inventory (READY or PENDING)',
  })
  @IsOptional()
  @IsEnum(StatusInventory)
  status_inventory?: StatusInventory;
}

export class PalletQuantityHistoryResponseDto {
  @ApiProperty({ example: 'uuid-history-123' })
  id: string;

  @ApiProperty({ example: 'uuid-pallet-123' })
  pallet_id: string;

  @ApiProperty({ example: 'uuid-item-123' })
  item_id: string;

  @ApiProperty({ example: 'Item Name' })
  item_name: string;

  @ApiProperty({ example: 5 })
  previous_quantity: number;

  @ApiProperty({ example: 10 })
  quantity_change: number;

  @ApiProperty({ example: 15 })
  new_quantity: number;

  @ApiProperty({ enum: QuantityOperationType, example: QuantityOperationType.ADD })
  operation_type: QuantityOperationType;

  @ApiPropertyOptional({ example: 'uuid-reference-123' })
  reference_id?: string;

  @ApiPropertyOptional({ example: 'INBOUND' })
  reference_type?: string;

  @ApiPropertyOptional({ example: 'Added items from inbound DO-001' })
  notes?: string;

  @ApiPropertyOptional({ example: 'uuid-user-123' })
  user_id?: string;

  @ApiPropertyOptional({ example: 'PCS' })
  uom?: string;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDate()
  production_date?: Date;

  @ApiProperty({ example: '2025-01-01T10:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  week_number?: number;
}

export class PalletItemQuantityDto {
  @ApiPropertyOptional({ example: 'uuid-pallet-123' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ example: 'uuid-item-123' })
  @IsOptional()
  @IsString()
  item_id?: string;

  @ApiPropertyOptional({ example: 'JAZY-KRETEK', description: 'Item name/SKU' })
  item_name?: string;

  @ApiProperty({ example: 50, description: 'Current quantity of this item on the pallet' })
  current_quantity: number;

  @ApiProperty({ example: 'PCS', description: 'Unit of measure for the item' })
  uom: string;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDate()
  production_date?: Date;

  @ApiProperty({ example: '2025-01-01T10:00:00.000Z', description: 'Last updated timestamp' })
  last_updated: Date;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  week_number?: number;

  @ApiPropertyOptional({ example: 'uuid-warehouse-sub-123', description: 'Warehouse sub ID' })
  warehouse_sub_id?: string;

  @ApiPropertyOptional({ example: 'Zone A', description: 'Warehouse sub name/code' })
  warehouse_sub_name?: string;

  @ApiPropertyOptional({ example: 'uuid-bin-123', description: 'Warehouse bin ID' })
  warehouse_bin_id?: string;

  @ApiPropertyOptional({ example: 'BIN-001', description: 'Warehouse bin name/code' })
  warehouse_bin_name?: string;

  @ApiPropertyOptional({ example: 'uuid-memo-123', description: 'Outbound memo ID' })
  @IsOptional()
  @IsString()
  memo_id?: string;

  @ApiPropertyOptional({
    enum: StatusInventory,
    example: StatusInventory.READY,
    description: 'Status inventory for the item (READY or PENDING)',
  })
  @IsOptional()
  @IsEnum(StatusInventory)
  status_inventory?: StatusInventory;
}

export class PalletCapacityValidationDto {
  @ApiProperty({ example: 100, description: 'Current pallet capacity' })
  capacity: number;

  @ApiProperty({ example: 75, description: 'Current quantity on pallet' })
  current_quantity: number;

  @ApiProperty({ example: 25, description: 'Available capacity' })
  available_capacity: number;

  @ApiProperty({ example: true, description: 'Whether pallet has available capacity' })
  has_capacity: boolean;

  @ApiProperty({ example: 0.75, description: 'Capacity utilization percentage' })
  utilization_percentage: number;
}

export class UpdatePalletItemStockDto {
  @ApiProperty({ 
    example: 10, 
    description: 'New quantity for the item on the pallet (will adjust to this value)' 
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ example: 'PCS', description: 'Unit of measure for the item' })
  @IsOptional()
  @IsString()
  uom?: string;

  @ApiPropertyOptional({ 
    example: '2025-01-01',
    description: 'Production date of the item lot' 
  })
  @IsOptional()
  @IsDate()
  production_date?: Date;

  @ApiPropertyOptional({ 
    example: 42,
    description: 'Production week number associated with the lot' 
  })
  @IsOptional()
  @IsNumber()
  week_number?: number;

  @ApiPropertyOptional({
    example: 'Stock adjustment for inventory correction',
    description: 'Notes about the stock adjustment operation',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: 'uuid-user-123',
    description: 'User who performed the stock adjustment',
  })
  @IsOptional()
  @IsString()
  user_id?: string;
}
