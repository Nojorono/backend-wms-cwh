import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMasterPalletDto {
  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  organization_id?: number;

  @ApiProperty({ example: 'PALLET001' })
  @IsString()
  pallet_code: string;

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
  isFull?: boolean;

  @ApiProperty({ example: 'DUS', required: false })
  @IsString()
  @IsOptional()
  uom?: string;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  currentQuantity?: number;
}
