import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

/** Line payload for PO internal requisition (Oracle-style keys). All listed fields are mandatory per line. */
export class CreatePoInternalReqLinesDto {
  @ApiProperty({ example: 'HDR-2026-0001' })
  @IsString()
  @IsNotEmpty()
  SOURCE_HEADER_ID: string;

  @ApiProperty({ example: 'LINE-2026-0001' })
  @IsString()
  @IsNotEmpty()
  SOURCE_LINE_ID: string;

  @ApiProperty({ example: 123456 })
  @IsNumber()
  INVENTORY_ITEM_ID: number;

  @ApiProperty({ example: 'ITEM-CODE-001' })
  @IsString()
  @IsNotEmpty()
  ITEM: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  QUANTITY: number;

  @ApiProperty({ example: 'PCS' })
  @IsString()
  @IsNotEmpty()
  TRANSACTION_UOM: string;
}

/**
 * Header payload for PO internal requisition (Oracle-style keys).
 * Mandatory/optional flags match integration contract; any future optional columns
 * can be added here without breaking validators on existing fields.
 */
export class CreatePoInternalReqDto {
  @ApiProperty({ example: 'INTERNAL REQUISITION' })
  @IsString()
  @IsNotEmpty()
  TRANSACTION_TYPE: string;

  @ApiProperty({ example: 'WMS' })
  @IsString()
  @IsNotEmpty()
  SOURCE_CODE: string;

  @ApiProperty({ example: 'HDR-2026-0001' })
  @IsString()
  @IsNotEmpty()
  SOURCE_HEADER_ID: string;

  @ApiProperty({ example: '2026-05-06T00:00:00.000Z' })
  @IsDateString()
  NEED_BY_DATE: string;

  @ApiProperty({ example: 'EMP001' })
  @IsString()
  @IsNotEmpty()
  PREPARER_NUMBER: string;

  @ApiProperty({ example: '1001', required: false })
  @IsOptional()
  @IsString()
  PREPARER_ID?: string;

  @ApiProperty({ example: 'EMP002' })
  @IsString()
  @IsNotEmpty()
  REQUESTOR_NUMBER: string;

  @ApiProperty({ example: '1002', required: false })
  @IsOptional()
  @IsString()
  REQUESTOR_ID?: string;

  @ApiProperty({ example: 'MAIN OU' })
  @IsString()
  @IsNotEmpty()
  ORG_NAME: string;

  @ApiProperty({ example: 204, required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ORG_ID?: number;

  @ApiProperty({ example: 'WH SOURCE' })
  @IsString()
  @IsNotEmpty()
  IO_SOURCE_NAME: string;

  @ApiProperty({ example: 3001, required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  IO_SOURCE_ID?: number;

  @ApiProperty({ example: 'WH DEST' })
  @IsString()
  @IsNotEmpty()
  IO_DEST_NAME: string;

  @ApiProperty({ example: 3002, required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  IO_DEST_ID?: number;

  @ApiProperty({ example: 'WMS-INT-REQ' })
  @IsString()
  @IsNotEmpty()
  HEADER_ATTRIBUTE_CATEGORY: string;

  @ApiProperty({ example: 'batch-001' })
  @IsString()
  @IsNotEmpty()
  HEADER_ATTRIBUTE7: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  TOTAL_LINES: number;

  @ApiProperty({ type: [CreatePoInternalReqLinesDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePoInternalReqLinesDto)
  LINES: CreatePoInternalReqLinesDto[];
}
