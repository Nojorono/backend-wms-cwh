import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOnHandAtrDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  organization_id?: string;

  @ApiPropertyOptional({ example: 'SAJ12' })
  @IsOptional()
  @IsString()
  item_code?: string;

  @ApiPropertyOptional({ example: 'RK.SAJ.120000' })
  @IsOptional()
  @IsString()
  item_number?: string;

  @ApiPropertyOptional({ example: 'SARJA 12' })
  @IsOptional()
  @IsString()
  item_description?: string;

  @ApiPropertyOptional({ example: 559001 })
  @IsOptional()
  @IsNumber()
  inventory_item_id?: number;

  @ApiPropertyOptional({ example: 111 })
  @IsOptional()
  @IsInt()
  oracle_organization_id?: number;

  @ApiPropertyOptional({ example: 'JAT' })
  @IsOptional()
  @IsString()
  organization_code?: string;

  @ApiPropertyOptional({ example: 'JAKARTA TIMUR' })
  @IsOptional()
  @IsString()
  organization_name?: string;

  @ApiPropertyOptional({ example: 'KECIL' })
  @IsOptional()
  @IsString()
  subinventory_code?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  locator_id?: number;

  @ApiPropertyOptional({ example: 'KECIL' })
  @IsOptional()
  @IsString()
  locator?: string;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @IsString()
  locator_name?: string;

  @ApiPropertyOptional({ example: 5538 })
  @IsOptional()
  @IsInt()
  quantity?: number;

  @ApiPropertyOptional({ example: 5538 })
  @IsOptional()
  @IsInt()
  avail_to_reserve?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  created_by?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  updated_by?: string;
}
