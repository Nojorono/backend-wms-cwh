import { IsString, IsNumber, IsOptional, IsEnum, Min, Max, IsDate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuantityOperationType } from '../../core/domain/entities/transaction-pallet-history.entity';

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
    description: 'Type of quantity operation'
  })
  @IsEnum(QuantityOperationType)
  operation_type: QuantityOperationType;

  @ApiPropertyOptional({ example: 'uuid-reference-123', description: 'Reference ID for tracking' })
  @IsOptional()
  @IsString()
  reference_id?: string;

  @ApiPropertyOptional({ example: 'INBOUND', description: 'Reference type (INBOUND, OUTBOUND, etc.)' })
  @IsOptional()
  @IsString()
  reference_type?: string;

  @ApiPropertyOptional({ example: 'Added items from inbound DO-001', description: 'Notes about the operation' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'uuid-user-123', description: 'User who performed the operation' })
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
}

export class PalletQuantityHistoryResponseDto {
  @ApiProperty({ example: 'uuid-history-123' })
  id: string;

  @ApiProperty({ example: 'uuid-pallet-123' })
  pallet_id: string;

  @ApiProperty({ example: 'uuid-item-123' })
  item_id: string;

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
}

export class PalletItemQuantityDto {
  @ApiProperty({ example: 'uuid-item-123' })
  item_id: string;

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
