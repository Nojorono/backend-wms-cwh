import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MovementStatus } from '../../core/domain/entities/inventory-movement.entity';

export class CreateInventoryMovementPalletDto {
  @ApiProperty({
    description: 'ID pallet',
    type: String,
    example: 'uuid-pallet-1',
  })
  @IsNotEmpty()
  @IsString()
  pallet_id: string;

  @ApiProperty({
    description: 'ID inventory tracking',
    type: String,
    example: 'uuid-inventory-tracking-1',
  })
  @IsNotEmpty()
  @IsString()
  inventory_tracking_id: string;
}

export class CreateInventoryMovementUserDto {
  @ApiProperty({
    description: 'ID user',
    type: String,
    example: 'uuid-user-1',
  })
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @ApiProperty({
    description: 'Nama user',
    type: String,
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  user_name: string;

  @ApiProperty({
    description: 'Nomor telepon user',
    type: String,
    example: '+6281234567890',
  })
  @IsOptional()
  @IsString()
  user_phone: string;
}

export class CreateInventoryMovementDto {
  @ApiPropertyOptional({
    description: 'Nomor movement (auto-generated if not provided)',
    type: String,
    example: 'MOV-20240101-0001',
  })
  @IsOptional()
  @IsString()
  movement_number?: string;

  @ApiProperty({
    description: 'Array of pallet objects to move',
    type: [CreateInventoryMovementPalletDto],
    example: [
      { pallet_id: 'uuid-pallet-1', inventory_tracking_id: 'uuid-tracking-1' },
      { pallet_id: 'uuid-pallet-2', inventory_tracking_id: 'uuid-tracking-2' },
    ],
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInventoryMovementPalletDto)
  pallets: CreateInventoryMovementPalletDto[];

  @ApiProperty({
    description: 'Array of user objects to move',
    type: [CreateInventoryMovementUserDto],
    example: [
      { user_id: 'uuid-user-1', user_name: 'John Doe', user_phone: '+6281234567890' },
    ],
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInventoryMovementUserDto)
  users: CreateInventoryMovementUserDto[];

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

  @ApiPropertyOptional({ description: 'Catatan movement' })
  @IsOptional()
  @IsString()
  notes?: string;
}

