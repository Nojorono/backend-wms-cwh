import { IsString, IsOptional, IsNumber, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WarehouseSubStagingType } from 'src/core/domain/entities/master-warehouse-sub.entity';

export class CreateMasterWarehouseSubDto {
  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  organization_id?: number;

  @ApiProperty({ example: '1234567890', required: false })
  @IsUUID()
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

  @ApiProperty({ example: 'https://example.com/barcode.png', required: false })
  @IsString()
  @IsOptional()
  barcode_image_url?: string;

  @ApiProperty({ example: WarehouseSubStagingType.INBOUND, required: false })
  @IsEnum(WarehouseSubStagingType)
  @IsOptional()
  is_staging?: WarehouseSubStagingType;
}
