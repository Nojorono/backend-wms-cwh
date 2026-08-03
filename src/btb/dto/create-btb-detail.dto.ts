import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

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

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber()
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
