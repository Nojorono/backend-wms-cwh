import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { RcvReceiptTransactionType } from 'src/core/domain/entities/inbound-integration.entity';

export class CreateRcvReceiptLinesDto {
  @ApiProperty({ example: 'LINE-2026-0001' })
  @IsString()
  SOURCE_LINE_ID: string;

  @ApiProperty({ example: 'HDR-2026-0001' })
  @IsString()
  SOURCE_HEADER_ID: string;

  @ApiProperty({ example: 'PO26040001' })
  @IsOptional()
  @IsString()
  PO_NUMBER?: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsNumber()
  PO_LINE_NUMBER?: number;

  @ApiProperty({ example: 'ISO26040001', required: false })
  @IsOptional()
  @IsString()
  ISO_NUMBER?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  ISO_LINE_NUMBER?: number;

  @ApiProperty({ example: 123456 })
  @IsNumber()
  INVENTORY_ITEM_ID: number;

  @ApiProperty({ example: 'PCS' })
  @IsString()
  UOM_CODE: string;

  @ApiProperty({ example: 25 })
  @IsNumber()
  QUANTITY: number;

  @ApiProperty({ example: 'GOOD-RK-1' })
  @IsString()
  SUBINVENTORY: string;

  @ApiProperty({ example: 100200300 })
  @IsNumber()
  LOCATOR_ID: number;
}

export class CreateRcvReceiptDto {
  @ApiProperty({
    enum: RcvReceiptTransactionType,
    example: RcvReceiptTransactionType.INBOUND_GS_PRINCIPAL,
  })
  @IsEnum(RcvReceiptTransactionType)
  TRANSACTION_TYPE: RcvReceiptTransactionType;

  @ApiProperty({ example: 'WMS' })
  @IsString()
  SOURCE_SYSTEM: string;

  @ApiProperty({ example: 'INTERNAL ORDER' })
  @IsString()
  RECEIPT_SOURCE_CODE: string;

  @ApiProperty({ example: 'DO-2026-0001' })
  @IsString()
  SOURCE_HEADER_ID: string;

  @ApiProperty({ example: 'DO000123', required: false })
  @IsOptional()
  @IsString()
  DO_NUMBER?: string;

  @ApiProperty({ example: 1001 })
  @IsOptional()
  @IsNumber()
  VENDOR_ID?: number;

  @ApiProperty({ example: 2001 })
  @IsOptional()
  @IsNumber()
  VENDOR_SITE_ID?: number;

  @ApiProperty({ example: 'B1234CD', required: false })
  @IsOptional()
  @IsString()
  RSH_ATTRIBUTE1?: string;

  @ApiProperty({ example: 'John Driver', required: false })
  @IsOptional()
  @IsString()
  RSH_ATTRIBUTE2?: string;

  @ApiProperty({ example: 'Ekspedisi Maju', required: false })
  @IsOptional()
  @IsString()
  RSH_ATTRIBUTE3?: string;

  @ApiProperty({ example: 'RCV26040001' })
  @IsOptional()
  @IsString()
  RECEIPT_NUMBER?: string;

  @ApiProperty({ example: 3 })
  @IsNumber()
  TOTAL_LINES: number;

  @ApiProperty({ type: [CreateRcvReceiptLinesDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRcvReceiptLinesDto)
  LINES: CreateRcvReceiptLinesDto[];
}
