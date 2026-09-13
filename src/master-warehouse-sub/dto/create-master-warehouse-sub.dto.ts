import { IsString, IsOptional, IsNumber, IsUUID, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WarehouseSubStagingType } from 'src/core/domain/entities/master-warehouse-sub.entity';

export class CreateMasterWarehouseSubDto {
  @ApiProperty({ example: '1234567890', required: false })
  @IsUUID(4, { message: 'warehouse_id must be a valid UUID' })
  @IsOptional()
  warehouse_id?: string;

  @ApiProperty({
    example: 'Primary warehouse for storing inventory',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'WH001', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({
    example: 'Primary warehouse for storing inventory',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 2, required: false })
  @IsNumber()
  @IsOptional()
  capacity_bin?: number;

  @ApiProperty({ example: WarehouseSubStagingType.INBOUND, required: false })
  @IsEnum(WarehouseSubStagingType)
  @IsOptional()
  is_staging?: WarehouseSubStagingType;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  is_good_stock?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  is_gate?: boolean;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  locator_id?: number;

  @ApiProperty({ example: 'Locator Name', required: false })
  @IsString()
  @IsOptional()
  locator_name?: string;
}
