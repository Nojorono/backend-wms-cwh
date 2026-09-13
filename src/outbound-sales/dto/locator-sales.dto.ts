import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LocatorSalesParamsDto {
  @ApiProperty({
    description: 'Organization code filter',
    example: 'JAT',
  })
  @IsString()
  @IsNotEmpty()
  organization_code: string;

  @ApiProperty({
    description: 'Sales representative number filter',
    example: '241116.00003BI',
  })
  @IsString()
  @IsNotEmpty()
  salesrep_number: string;
}

/** Oracle locator sales row (`get_locator_sales`). */
export class LocatorSalesItemDto {
  @ApiPropertyOptional({ example: '241116.00003BI' })
  SALESREP_NUMBER?: string;

  @ApiPropertyOptional({ example: null })
  SALESREP_NAME?: string | null;

  @ApiPropertyOptional({ example: 'KUSUMA ARDYOGI' })
  EMPLOYEE_NAME?: string;

  @ApiPropertyOptional({ example: '080513.01758B0' })
  SUPERVISOR_NUMBER?: string;

  @ApiPropertyOptional({ example: 100290040 })
  SALESREP_ID?: number;

  @ApiPropertyOptional({ example: 1 })
  SALES_CREDIT_TYPE_ID?: number;

  @ApiPropertyOptional({ example: 'CANVAS' })
  SUBINVENTORY_CODE?: string;

  @ApiPropertyOptional({ example: 8661 })
  LOCATOR_ID?: number;

  @ApiPropertyOptional({ example: 'KUSUMA ARDYOGI,' })
  VENDOR_NAME?: string;

  @ApiPropertyOptional({ example: '6295' })
  VENDOR_NUM?: string;

  @ApiPropertyOptional({ example: 'OFFICE' })
  VENDOR_SITE_CODE?: string;

  @ApiPropertyOptional({ example: 500001 })
  VENDOR_ID?: number;

  @ApiPropertyOptional({ example: 640002 })
  VENDOR_SITE_ID?: number;

  @ApiPropertyOptional({ example: 'A' })
  STATUS?: string;

  @ApiPropertyOptional({ example: '2024-11-17T17:00:00.000Z' })
  START_DATE_ACTIVE?: string;

  @ApiPropertyOptional({ example: null })
  END_DATE_ACTIVE?: string | null;

  @ApiPropertyOptional({ example: 'JAT' })
  ORGANIZATION_CODE?: string;

  @ApiPropertyOptional({ example: 'JAKARTA TIMUR' })
  ORGANIZATION_NAME?: string;

  @ApiPropertyOptional({ example: 111 })
  ORGANIZATION_ID?: number;

  @ApiPropertyOptional({ example: 'NNA_JAT_OU' })
  ORG_NAME?: string;

  @ApiPropertyOptional({ example: '101' })
  ORG_ID?: string;

  @ApiPropertyOptional({ example: '2026-05-08T11:13:07.000Z' })
  LAST_UPDATE_DATE?: string;
}

export class LocatorSalesResponseDto {
  @ApiPropertyOptional({ example: true })
  status?: boolean;

  @ApiProperty({ example: 'OK' })
  message: string;

  @ApiProperty({ type: [LocatorSalesItemDto] })
  data: LocatorSalesItemDto[];

  @ApiPropertyOptional({ example: 1 })
  count?: number;

  @ApiPropertyOptional({ example: 200 })
  statusCode?: number;
}
