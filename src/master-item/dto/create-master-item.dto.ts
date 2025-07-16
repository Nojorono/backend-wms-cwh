import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMasterItemDto {
  @ApiProperty({ example: 'SKU123', required: false })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiProperty({ example: 'Item Number', required: false })
  @IsString()
  @IsOptional()
  item_number?: string;

  @ApiProperty({ example: 'Item description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  organization_id?: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  inventory_item_id?: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  dus_per_stack?: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  bal_per_dus?: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  press_per_bal?: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  bks_per_press?: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  btg_per_bks?: number;
} 