import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMasterWarehouseBinDto {
  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  organization_id?: number;

  @ApiProperty({ example: '1234567890', required: false })
  @IsUUID()
  @IsOptional()
  warehouse_sub_id?: string;

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
  name?: string;

  @ApiProperty({
    example: 'Primary warehouse for storing inventory',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 3, required: false })
  @IsNumber()
  @IsOptional()
  capacity_pallet?: number;

  @ApiProperty({ example: 'https://example.com/barcode.png', required: false })
  @IsString()
  @IsOptional()
  barcode_image_url?: string;
}
