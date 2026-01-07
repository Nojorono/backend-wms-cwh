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
  isFull?: boolean;

  @ApiProperty({ example: 'DUS', required: false })
  @IsString()
  @IsOptional()
  uom?: string;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  currentQuantity?: number;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  currentWeekNumber?: number;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', required: false, nullable: true })
  @IsOptional()
  memo_id?: string | null;
}
