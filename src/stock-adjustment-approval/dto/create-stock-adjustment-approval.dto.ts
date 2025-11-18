import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsNumber,
  IsInt,
  IsOptional,
  IsNotEmpty,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateStockAdjustmentApprovalDto {
  @ApiProperty({
    example: 'uuid-pallet-123',
    description: 'Pallet ID for the stock adjustment',
  })
  @IsUUID(4, { message: 'pallet_id must be a valid UUID' })
  @IsNotEmpty({ message: 'pallet_id is required' })
  pallet_id: string;

  @ApiProperty({
    example: 'uuid-item-123',
    description: 'Item ID for the stock adjustment',
  })
  @IsUUID(4, { message: 'item_id must be a valid UUID' })
  @IsNotEmpty({ message: 'item_id is required' })
  item_id: string;

  @ApiProperty({
    example: 50,
    description: 'New quantity to adjust to',
  })
  @IsNumber({}, { message: 'requested_quantity must be a number' })
  @IsInt({ message: 'requested_quantity must be an integer' })
  @Min(0, { message: 'requested_quantity must be greater than or equal to 0' })
  requested_quantity: number;

  @ApiPropertyOptional({
    example: 'PCS',
    description: 'Unit of measure for the item',
  })
  @IsOptional()
  @IsString({ message: 'uom must be a string' })
  uom?: string;

  @ApiPropertyOptional({
    example: '2025-01-01T00:00:00.000Z',
    description: 'Production date of the item lot',
  })
  @IsOptional()
  @IsDateString({}, { message: 'production_date must be a valid ISO date string' })
  production_date?: string;

  @ApiPropertyOptional({
    example: 42,
    description: 'Production week number',
  })
  @IsOptional()
  @IsNumber({}, { message: 'week_number must be a number' })
  @IsInt({ message: 'week_number must be an integer' })
  week_number?: number;

  @ApiProperty({
    example: 'Inventory correction due to physical count discrepancy',
    description: 'Reason for the stock adjustment request',
  })
  @IsString({ message: 'reason must be a string' })
  @IsNotEmpty({ message: 'reason is required' })
  reason: string;

  @ApiPropertyOptional({
    example: 'Additional notes about the adjustment',
    description: 'Additional notes',
  })
  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  notes?: string;

  @ApiPropertyOptional({
    example: 'uuid-user-123',
    description: 'User ID who requested the adjustment',
  })
  @IsOptional()
  @IsUUID(4, { message: 'requested_by must be a valid UUID' })
  requested_by?: string;

  @ApiPropertyOptional({
    example: 'uuid-target-pallet-123',
    description: 'Target pallet ID to move excess quantity to. If provided, the difference between current and requested quantity will be moved to this pallet.',
  })
  @IsOptional()
  @IsUUID(4, { message: 'target_pallet_id must be a valid UUID' })
  target_pallet_id?: string;
}

