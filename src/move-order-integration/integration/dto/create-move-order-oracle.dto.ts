import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateMoveOrderOracleDto {
  @ApiProperty({
    description: 'Request Number',
    example: 'JAT/SPB/2024/01/000002',
  })
  @IsString()
  @IsNotEmpty()
  REQUEST_NUMBER: string;

  @ApiProperty({ description: 'Transaction Type ID', example: 121 })
  @IsNumber()
  @IsNotEmpty()
  TRANSACTION_TYPE_ID: number;

  @ApiProperty({ description: 'Move Order Type', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  MOVE_ORDER_TYPE: number;

  @ApiProperty({ description: 'Organization ID', example: 241 })
  @IsNumber()
  @IsNotEmpty()
  ORGANIZATION_ID: number;

  @ApiProperty({ description: 'Date Required', example: '2024-01-01' })
  @IsDateString()
  @IsNotEmpty()
  DATE_REQUIRED: string;

  @ApiProperty({
    description: 'From Subinventory Code',
    example: 'KECIL',
    maxLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  FROM_SUBINVENTORY_CODE: string;

  @ApiProperty({
    description: 'To Subinventory Code',
    example: 'CANVAS',
    maxLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  TO_SUBINVENTORY_CODE: string;

  @ApiProperty({ description: 'Header Status', example: 7 })
  @IsNumber()
  @IsNotEmpty()
  HEADER_STATUS: number;

  @ApiProperty({ description: 'Status Date', example: '2024-01-01' })
  @IsDateString()
  @IsNotEmpty()
  STATUS_DATE: string;

  @ApiPropertyOptional({
    description: 'Attribute Category',
    example: 'FPPR Tambahan',
    maxLength: 30,
  })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  ATTRIBUTE_CATEGORY?: string;

  @ApiPropertyOptional({ description: 'Attribute 7', maxLength: 150 })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  ATTRIBUTE7?: string;

  @ApiPropertyOptional({ description: 'Attribute 8', maxLength: 150 })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  ATTRIBUTE8?: string;

  @ApiPropertyOptional({ description: 'Attribute 9', maxLength: 150 })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  ATTRIBUTE9?: string;

  @ApiPropertyOptional({ description: 'Attribute 10', maxLength: 150 })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  ATTRIBUTE10?: string;

  @ApiPropertyOptional({ description: 'Attribute 11', maxLength: 150 })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  ATTRIBUTE11?: string;

  @ApiPropertyOptional({ description: 'Attribute 12', maxLength: 150 })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  ATTRIBUTE12?: string;

  @ApiPropertyOptional({
    description: 'Attribute 13 - Call Plan Number',
    example: 'JAT/CP/2024/01/000001',
    maxLength: 150,
  })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  ATTRIBUTE13?: string;

  @ApiPropertyOptional({
    description: 'Attribute 14 - SPB Number (Source Document)',
    example: 'JAT/SPB/2024/01/000002',
    maxLength: 150,
  })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  ATTRIBUTE14?: string;

  @ApiPropertyOptional({
    description: 'Operation',
    example: 'CREATE',
    maxLength: 30,
  })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  OPERATION?: string;

  @ApiPropertyOptional({
    description: 'Database Flag',
    example: 'T',
    maxLength: 1,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1)
  DB_FLAG?: string;

  @ApiPropertyOptional({
    description: 'Source System',
    example: 'WMS',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  SOURCE_SYSTEM?: string;

  @ApiPropertyOptional({
    description: 'Source Header ID',
    example: '1234567890',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  SOURCE_HEADER_ID?: string;

  @ApiPropertyOptional({
    description: 'Source Line ID',
    example: '1234567890',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  SOURCE_LINE_ID?: string;

  @ApiPropertyOptional({
    description: 'Source Batch ID',
    example: '1234567890',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  SOURCE_BATCH_ID?: string;

  @ApiPropertyOptional({
    description: 'Interface Status',
    example: 'READY',
    maxLength: 10,
  })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  IFACE_STATUS?: string;

  @ApiPropertyOptional({
    description: 'Interface Mode',
    example: 'MOVE_ORDER',
    maxLength: 30,
  })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  IFACE_MODE?: string;

  @ApiPropertyOptional({ description: 'Total Lines', example: 1 })
  @IsNumber()
  @IsOptional()
  TOTAL_LINES?: number;

  @ApiPropertyOptional({
    description: 'Creation Date (defaults to current date if omitted)',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsOptional()
  CREATION_DATE?: string;

  @ApiPropertyOptional({ description: 'Created By', example: 1234 })
  @IsNumber()
  @IsOptional()
  CREATED_BY?: number;

  @ApiPropertyOptional({
    description: 'Last Update Date (defaults to current date if omitted)',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsOptional()
  LAST_UPDATE_DATE?: string;

  @ApiPropertyOptional({ description: 'Last Updated By', example: 1234 })
  @IsNumber()
  @IsOptional()
  LAST_UPDATED_BY?: number;
}
