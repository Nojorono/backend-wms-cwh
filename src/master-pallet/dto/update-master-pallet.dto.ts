import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMasterPalletDto {
  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  organization_id?: number;

  @ApiProperty({ example: 'PALLET001', required: false })
  @IsString()
  @IsOptional()
  pallet_code?: string;

  @ApiProperty({ example: 100, required: false })
  @IsNumber()
  @IsOptional()
  capacity?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isEmpty?: boolean;

  @ApiProperty({ example: 'https://example.com/pallet.png', required: false })
  @IsString()
  @IsOptional()
  barcode_image_url?: string;
} 