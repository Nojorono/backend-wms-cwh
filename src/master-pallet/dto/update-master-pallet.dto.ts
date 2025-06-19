import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMasterPalletDto {
  @ApiProperty({ example: 'CLIENT001', required: false })
  @IsString()
  @IsOptional()
  client_id?: string;

  @ApiProperty({ example: 'PALLET001', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ example: 'Standard Pallet', required: false })
  @IsString()
  @IsOptional()
  uom_name?: string;

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
} 