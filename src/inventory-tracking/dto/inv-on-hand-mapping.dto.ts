import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class InvOnHandMappingDetailQueryDto {
  @ApiPropertyOptional({ example: 'CWH' })
  @IsOptional()
  @IsString()
  organization_code?: string;

  @ApiPropertyOptional({ example: 'SELISIH' })
  @IsOptional()
  @IsString()
  subinventory_code?: string;
}

export class InvOnHandMappingLineDto {
  @ApiProperty({ example: 'CWH' })
  ORGANIZATION_CODE: string;

  @ApiProperty({ example: 'DC CENTRAL WAREHOUSE JATI' })
  ORGANIZATION_NAME: string;

  @ApiPropertyOptional({ example: 'PLP' })
  FROM_ORGANIZATION_CODE?: string;

  @ApiProperty({ example: 'RK.BHM.200000' })
  ITEM_CODE: string;

  @ApiProperty({ example: 'BAHAMAS 20 BATANG' })
  ITEM_DESC: string;

  @ApiProperty({ example: 381 })
  ORGANIZATION_ID: number;

  @ApiProperty({ example: 847002 })
  INVENTORY_ITEM_ID: number;

  @ApiProperty({ example: 381 })
  ORGANIZATION_ID_1: number;

  @ApiPropertyOptional({ example: '2026-05-12T08:08:46.000Z' })
  DATE_RECEIVED?: string;

  @ApiPropertyOptional({ example: '2026-05-12T08:20:02.000Z' })
  LAST_UPDATE_DATE?: string;

  @ApiPropertyOptional({ example: 1628 })
  LAST_UPDATED_BY?: number;

  @ApiPropertyOptional({ example: '2026-05-12T08:20:02.000Z' })
  CREATION_DATE?: string;

  @ApiPropertyOptional({ example: 1628 })
  CREATED_BY?: number;

  @ApiPropertyOptional({ example: 1628 })
  LAST_UPDATE_LOGIN?: number;

  @ApiProperty({ example: 180 })
  PRIMARY_TRANSACTION_QUANTITY: number;

  @ApiProperty({ example: 'SELISIH' })
  SUBINVENTORY_CODE: string;

  @ApiPropertyOptional({ example: null })
  REVISION?: number | null;

  @ApiPropertyOptional({ example: null })
  LOCATOR_ID?: number | null;

  @ApiPropertyOptional({ example: null })
  CREATE_TRANSACTION_ID?: number;

  @ApiPropertyOptional({ example: 146361356 })
  UPDATE_TRANSACTION_ID?: number;

  @ApiPropertyOptional({ example: null })
  LOT_NUMBER?: string | null;

  @ApiPropertyOptional({ example: '2026-05-12T08:08:46.000Z' })
  ORIG_DATE_RECEIVED?: string;

  @ApiPropertyOptional({ example: 17046 })
  COST_GROUP_ID?: number;

  @ApiPropertyOptional({ example: 2 })
  CONTAINERIZED_FLAG?: number;

  @ApiPropertyOptional({ example: null })
  PROJECT_ID?: number | null;

  @ApiPropertyOptional({ example: null })
  TASK_ID?: number | null;

  @ApiPropertyOptional({ example: 17282358 })
  ONHAND_QUANTITIES_ID?: number;

  @ApiPropertyOptional({ example: 2 })
  ORGANIZATION_TYPE?: number;

  @ApiPropertyOptional({ example: 381 })
  OWNING_ORGANIZATION_ID?: number;

  @ApiPropertyOptional({ example: 2 })
  OWNING_TP_TYPE?: number;

  @ApiPropertyOptional({ example: 381 })
  PLANNING_ORGANIZATION_ID?: number;

  @ApiPropertyOptional({ example: 2 })
  PLANNING_TP_TYPE?: number;

  @ApiPropertyOptional({ example: 'BKS' })
  TRANSACTION_UOM_CODE?: string;

  @ApiProperty({ example: 180 })
  TRANSACTION_QUANTITY?: number;

  @ApiPropertyOptional({ example: null })
  SECONDARY_UOM_CODE?: string | null;

  @ApiPropertyOptional({ example: null })
  SECONDARY_TRANSACTION_QUANTITY?: number | null;

  @ApiPropertyOptional({ example: 2 })
  IS_CONSIGNED?: number;

  @ApiPropertyOptional({ example: null })
  LPN_ID?: string | null;

  @ApiPropertyOptional({ example: null })
  STATUS_ID?: number | null;

  @ApiPropertyOptional({ example: null })
  MCC_CODE?: string | null;
}

export class InvOnHandMappingDetailItemDto {
  @ApiProperty({ example: 'BHM20' })
  ITEM_CODE: string;

  @ApiProperty({ example: 'RK.BHM.200000' })
  ITEM_NUMBER: string;

  @ApiProperty({ example: 'BAHAMAS 20 BATANG' })
  ITEM_DESCRIPTION: string;

  @ApiProperty({ example: 847002 })
  INVENTORY_ITEM_ID: number;

  @ApiProperty({ example: 381 })
  ORGANIZATION_ID: number;

  @ApiProperty({ example: 'CWH' })
  ORGANIZATION_CODE: string;

  @ApiProperty({ example: 'DC CENTRAL WAREHOUSE JATI' })
  ORGANIZATION_NAME: string;

  @ApiProperty({ example: 'SELISIH' })
  SUBINVENTORY_CODE: string;

  @ApiPropertyOptional({ example: null })
  LOCATOR_ID?: number | null;

  @ApiPropertyOptional({ example: null })
  LOCATOR?: string | null;

  @ApiPropertyOptional({ example: null })
  LOCATOR_NAME?: string | null;

  @ApiProperty({ example: 180 })
  QUANTITY: number;

  @ApiProperty({ example: 1 })
  LINE_COUNT: number;

  @ApiProperty({ type: [InvOnHandMappingLineDto] })
  LINES: InvOnHandMappingLineDto[];
}

export class InvOnHandMappingDetailResponseDto {
  @ApiProperty({ example: true })
  status: boolean;

  @ApiProperty({ example: 'OK' })
  message: string;

  @ApiProperty({ type: [InvOnHandMappingDetailItemDto] })
  data: InvOnHandMappingDetailItemDto[];

  @ApiProperty({ example: 0 })
  count: number;

  @ApiProperty({ example: 200 })
  statusCode: number;
}
