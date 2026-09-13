import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class InventoryLocatorParamsDto {
  @ApiPropertyOptional({
    description: 'Item code to filter',
    example: 'CLM16',
  })
  @IsString()
  @IsOptional()
  item_code?: string;

  @ApiPropertyOptional({
    description:
      'Subinventory code(s) to filter. Single value, comma-separated, or repeated query param',
    example: 'GOOD-RK-1',
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map(String);
    }
    return String(value);
  })
  subinventory_code?: string | string[];

  @ApiPropertyOptional({
    description: 'Organization code (inventory org) to filter',
    example: 'CWH',
  })
  @IsString()
  @IsOptional()
  organization_code?: string;

  @ApiPropertyOptional({
    description: 'Locator segment1 to filter',
    example: 'A.01.01',
  })
  @IsString()
  @IsOptional()
  locator?: string;
}

/** Oracle inventory locator row (`get_inv_locator`). */
export class InventoryLocatorItemDto {
  @ApiPropertyOptional({ example: 111 })
  ORGANIZATION_ID?: number;

  @ApiPropertyOptional({ example: 'JAKARTA TIMUR' })
  NAME?: string;

  @ApiPropertyOptional({ example: 'JAT', name: 'Org Code' })
  'Org Code'?: string;

  @ApiPropertyOptional({ example: 'JAKARTA TIMUR', name: 'Organization Name' })
  'Organization Name'?: string;

  @ApiPropertyOptional({ example: 'CANVAS' })
  Subinventory?: string;

  @ApiPropertyOptional({
    example: 'On Hand Salesman / Stock Unit',
    name: 'Subinventory Description',
  })
  'Subinventory Description'?: string;

  @ApiPropertyOptional({ example: 16081 })
  locator_id?: number;

  @ApiPropertyOptional({ example: 'GIT' })
  Locator?: string;

  @ApiPropertyOptional({ example: 'GOOD IN TRANSIT', name: 'Locator Description' })
  'Locator Description'?: string;

  @ApiPropertyOptional({ example: 'Prespecified', name: 'Locator Control Type' })
  'Locator Control Type'?: string;

  /** Legacy uppercase aliases from other Oracle integrations. */
  @ApiPropertyOptional({ example: 'GOOD-RK-1' })
  SUBINVENTORY_CODE?: string;

  @ApiPropertyOptional({ example: 1001 })
  LOCATOR_ID?: number;

  @ApiPropertyOptional({ example: 'A.01.01' })
  LOCATOR?: string;

  @ApiPropertyOptional({ example: 'CLM16' })
  ITEM_CODE?: string;

  @ApiPropertyOptional({ example: 'CWH' })
  ORGANIZATION_CODE?: string;
}

export class InventoryLocatorResponseDto {
  @ApiPropertyOptional({ example: true })
  status?: boolean;

  @ApiProperty({ example: 'OK' })
  message: string;

  @ApiProperty({ type: [InventoryLocatorItemDto] })
  data: InventoryLocatorItemDto[];

  @ApiPropertyOptional({ example: 0 })
  count?: number;

  @ApiPropertyOptional({ example: 200 })
  statusCode?: number;
}
