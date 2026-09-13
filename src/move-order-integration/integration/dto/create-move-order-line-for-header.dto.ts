import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateMoveOrderLineForHeaderDto {
  @ApiProperty({ description: 'Line Number', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  LINE_NUMBER: number;

  @ApiProperty({ description: 'Organization ID', example: 241 })
  @IsNumber()
  @IsNotEmpty()
  ORGANIZATION_ID: number;

  @ApiProperty({ description: 'Inventory Item ID', example: 21001 })
  @IsNumber()
  @IsNotEmpty()
  INVENTORY_ITEM_ID: number;

  @ApiProperty({ description: 'From Subinventory Code', example: 'KECIL', maxLength: 10 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  FROM_SUBINVENTORY_CODE: string;

  @ApiProperty({ description: 'To Subinventory Code', example: 'CANVAS', maxLength: 10 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  TO_SUBINVENTORY_CODE: string;

  @ApiProperty({ description: 'UOM Code', example: 'BKS', maxLength: 3 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  UOM_CODE: string;

  @ApiProperty({ description: 'Quantity', example: 1000 })
  @IsNumber()
  @IsNotEmpty()
  QUANTITY: number;

  @ApiProperty({ description: 'Date Required', example: '2024-01-01' })
  @IsDateString()
  @IsNotEmpty()
  DATE_REQUIRED: string;

  @ApiProperty({ description: 'Transaction Type ID', example: 121 })
  @IsNumber()
  @IsNotEmpty()
  TRANSACTION_TYPE_ID: number;

  @ApiProperty({ description: 'Transaction Source Type ID', example: 4 })
  @IsNumber()
  @IsNotEmpty()
  TRANSACTION_SOURCE_TYPE_ID: number;

  @ApiProperty({ description: 'Line Status', example: 7 })
  @IsNumber()
  @IsNotEmpty()
  LINE_STATUS: number;

  @ApiProperty({ description: 'Status Date', example: '2024-01-01' })
  @IsDateString()
  @IsNotEmpty()
  STATUS_DATE: string;

  @ApiPropertyOptional({ description: 'From Locator ID' })
  @IsOptional()
  @IsNumber()
  FROM_LOCATOR_ID?: number;

  @ApiPropertyOptional({ description: 'To Locator ID' })
  @IsOptional()
  @IsNumber()
  TO_LOCATOR_ID?: number;

  @ApiPropertyOptional({ description: 'Lot Number', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  LOT_NUMBER?: string;

  @ApiPropertyOptional({ description: 'Source Line ID', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  SOURCE_LINE_ID?: string;

  @ApiPropertyOptional({ description: 'Interface Status', maxLength: 10 })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  IFACE_STATUS?: string;

  @ApiPropertyOptional({ description: 'Operation', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  OPERATION?: string;

  @ApiPropertyOptional({ description: 'Database Flag', maxLength: 1 })
  @IsOptional()
  @IsString()
  @MaxLength(1)
  DB_FLAG?: string;
}
