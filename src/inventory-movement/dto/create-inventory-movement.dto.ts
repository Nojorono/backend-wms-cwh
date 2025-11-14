import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsDateString, IsArray, ArrayMinSize } from 'class-validator';
import { MovementStatus } from '../../core/domain/entities/inventory-movement.entity';

export class CreateInventoryMovementDto {
  @ApiProperty({
    description: 'Array of pallet IDs to move',
    type: [String],
    example: ['uuid-pallet-1', 'uuid-pallet-2'],
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  pallet_ids: string[];

  @ApiPropertyOptional({
    description: 'Array of inventory tracking IDs (optional, will be fetched from pallet if not provided)',
    type: [String],
  })
  @IsOptional()
  inventory_tracking_ids?: string[];

  @ApiProperty({ description: 'ID warehouse sumber' })
  @IsNotEmpty()
  @IsString()
  source_warehouse_id: string;

  @ApiProperty({ description: 'ID warehouse sub sumber' })
  @IsNotEmpty()
  @IsString()
  source_warehouse_sub_id: string;

  @ApiPropertyOptional({ description: 'ID bin sumber' })
  @IsOptional()
  @IsString()
  source_bin_id?: string;

  @ApiProperty({ description: 'ID warehouse tujuan' })
  @IsNotEmpty()
  @IsString()
  destination_warehouse_id: string;

  @ApiProperty({ description: 'ID warehouse sub tujuan' })
  @IsNotEmpty()
  @IsString()
  destination_warehouse_sub_id: string;

  @ApiPropertyOptional({ description: 'ID bin tujuan' })
  @IsOptional()
  @IsString()
  destination_bin_id?: string;

  @ApiPropertyOptional({
    description: 'Status movement',
    enum: MovementStatus,
    default: MovementStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(MovementStatus)
  status?: MovementStatus;

  @ApiPropertyOptional({ description: 'ID user yang ditugaskan untuk melakukan movement' })
  @IsOptional()
  @IsString()
  assigned_user_id?: string;

  @ApiPropertyOptional({ description: 'Nama user yang ditugaskan' })
  @IsOptional()
  @IsString()
  assigned_user_name?: string;

  @ApiPropertyOptional({ description: 'Tanggal movement', example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  movement_date?: string;

  @ApiPropertyOptional({ description: 'Catatan movement' })
  @IsOptional()
  @IsString()
  notes?: string;
}

