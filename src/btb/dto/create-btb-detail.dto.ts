import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export const BTB_DETAIL_TYPE_VALUES = ['GS', 'BS'] as const;
export type BtbDetailType = (typeof BTB_DETAIL_TYPE_VALUES)[number];

export class CreateBtbDetailDto {
  @ApiPropertyOptional({ description: 'Detail row ID — include to update an existing line' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 'RK.ARI.120000' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  item_code: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  inventory_item_id?: number;

  @ApiPropertyOptional({ example: 'AROMA INOVASI 12' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  item_name?: string;

  @ApiPropertyOptional({ example: 'RK.ABC.122025' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  item_number?: string;

  @ApiPropertyOptional({
    example: 'GS',
    enum: BTB_DETAIL_TYPE_VALUES,
    default: 'GS',
    description: 'Item type: GS or BS (default GS)',
  })
  @IsOptional()
  @IsString()
  @IsIn(BTB_DETAIL_TYPE_VALUES, { message: 'type must be GS or BS' })
  type?: BtbDetailType;

  @ApiPropertyOptional({ example: 2025 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ example: 18000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  bandrol_price?: number;

  @ApiPropertyOptional({ example: 16400 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  bs_price?: number;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  btb_qty: number;

  @ApiProperty({ example: 'DUS' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  btb_uom: string;

  @ApiPropertyOptional({ example: '020000149' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  created_by?: string;

  @ApiPropertyOptional({ example: '020000149' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  updated_by?: string;
}
