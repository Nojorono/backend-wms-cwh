import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** YYYY-MM-DD for Swagger / examples (today). */
export const onHandAtrDateNowExample = (): string =>
  new Date().toISOString().split('T')[0];

export class InvOnHandQtyWithAtrDto {
  @ApiProperty({
    description: 'Organization code (inventory org) to filter',
    example: 'CWH',
  })
  @IsString()
  @IsNotEmpty()
  organization_code: string;

  @ApiProperty({
    description: 'Subinventory code(s) to filter. Single value, comma-separated, or repeated query param',
    example: 'GOOD-RK-1',
    isArray: true,
    type: String,
  })
  subinventory_code: string | string[];
}

export class InvOnHandQtyWithAtrParamsDto {
  @ApiProperty({
    description: 'Organization code (inventory org) to filter',
    example: 'CWH',
  })
  @IsString()
  @IsNotEmpty()
  organization_code: string;

  @ApiProperty({
    description:
      'Subinventory code(s) to filter. Single value, comma-separated, or repeated query param',
    example: 'GOOD-RK-1',
    isArray: true,
    type: String,
  })
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map(String);
    }
    return String(value);
  })
  subinventory_code: string | string[];

  // date only (YYYY-MM-DD), no time — filter by when on-hand data was saved (created_at)
  @ApiProperty({
    description: 'Saved date (YYYY-MM-DD) — returns on-hand rows stored on this date (WIB)',
    example: onHandAtrDateNowExample(),
  })
  @IsNotEmpty()
  @IsDateString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().split('T')[0] : value))
  date: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  created_by: string;
}

/** Oracle on-hand row with attributes (`get_inv_on_hand_qty_with_atr`). */
export class InvOnHandQtyWithAtrItemDto {
  @ApiPropertyOptional({ example: 'ABC12' })
  ITEM_CODE?: string;

  @ApiPropertyOptional({ example: 'RK.ABC.120000' })
  ITEM_NUMBER?: string;

  @ApiPropertyOptional({ example: 'AROMA BOLD COFFEE 12' })
  ITEM_DESCRIPTION?: string;

  @ApiPropertyOptional({ example: 547001 })
  INVENTORY_ITEM_ID?: number;

  @ApiPropertyOptional({ example: 111 })
  ORGANIZATION_ID?: number;

  @ApiPropertyOptional({ example: 'JAT' })
  ORGANIZATION_CODE?: string;

  @ApiPropertyOptional({ example: 'JAKARTA TIMUR' })
  ORGANIZATION_NAME?: string;

  @ApiPropertyOptional({ example: 'KECIL' })
  SUBINVENTORY_CODE?: string;

  @ApiPropertyOptional({ example: 30 })
  LOCATOR_ID?: number | null;

  @ApiPropertyOptional({ example: 'KECIL' })
  LOCATOR?: string | null;

  @ApiPropertyOptional({ example: null })
  LOCATOR_NAME?: string | null;

  @ApiPropertyOptional({ example: 780 })
  QUANTITY?: number;

  @ApiPropertyOptional({ example: 780 })
  AVAIL_TO_RESERVE?: number;
}

export class InvOnHandQtyWithAtrResponseDto {
  @ApiProperty({ example: true })
  status: boolean;

  @ApiProperty({ example: 'OK' })
  message: string;

  @ApiProperty({ type: [InvOnHandQtyWithAtrItemDto] })
  data: InvOnHandQtyWithAtrItemDto[];

  @ApiProperty({ example: 0 })
  count: number;

  @ApiPropertyOptional({ example: 200 })
  statusCode?: number;
}
