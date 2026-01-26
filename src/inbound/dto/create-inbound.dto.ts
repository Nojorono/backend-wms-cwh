import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsNotEmpty,
  IsUUID,
  IsPositive,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InboundStatus } from '../../core/domain/entities/inbound.entity';

export class CreateInboundItemDto {
  @ApiPropertyOptional({ example: 'uuid-inbound-123' })
  @IsOptional()
  @IsUUID(4, { message: 'inbound_id must be a valid UUID' })
  inbound_id?: string;

  @ApiPropertyOptional({ example: 'uuid-inbound-do-123' })
  @IsOptional()
  @IsUUID(4, { message: 'inbound_do_id must be a valid UUID' })
  inbound_do_id?: string;

  @ApiProperty({ example: 'uuid-item-1' })
  @IsNotEmpty({ message: 'item_id is required' })
  @IsUUID(4, { message: 'item_id must be a valid UUID' })
  item_id: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber({}, { message: 'quantity must be a number' })
  @IsPositive({ message: 'quantity must be a positive number' })
  quantity: number;

  @ApiPropertyOptional({ example: 'uuid-classification-1' })
  @IsOptional()
  @IsUUID(4, { message: 'classification_id must be a valid UUID' })
  classification_id?: string;

  @ApiPropertyOptional({ example: 'PCS' })
  @IsOptional()
  @IsString({ message: 'uom must be a string' })
  @MinLength(1, { message: 'uom must be at least 1 character' })
  @MaxLength(10, { message: 'uom must not exceed 10 characters' })
  uom?: string;
}

export class CreateInboundDoDto {
  @ApiPropertyOptional({ example: 'uuid-inbound-123' })
  @IsOptional()
  @IsUUID(4, { message: 'inbound_id must be a valid UUID' })
  inbound_id?: string;

  @ApiPropertyOptional({ example: false })
  @IsNotEmpty({ message: 'validation_surat_jalan is required' })
  @IsBoolean({ message: 'validation_surat_jalan must be a boolean' })
  validation_surat_jalan?: boolean;

  @ApiPropertyOptional({ example: 'DO-001' })
  @IsNotEmpty({ message: 'inbound_do_number is required' })
  @IsString({ message: 'inbound_do_number must be a string' })
  @MinLength(1, { message: 'inbound_do_number must be at least 1 character' })
  @MaxLength(50, { message: 'inbound_do_number must not exceed 50 characters' })
  inbound_do_number: string;

  @ApiPropertyOptional({ example: '2025-09-01T10:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'inbound_do_date must be a valid ISO date string' })
  inbound_do_date?: string;

  @ApiPropertyOptional({ example: 's3://bucket/path/to/attachment.pdf' })
  @IsOptional()
  @IsString({ message: 'attachment must be a string' })
  attachment?: string;

  @ApiPropertyOptional({ example: 'PO-123' })
  @IsNotEmpty({ message: 'inbound_po_number is required' })
  @IsString({ message: 'inbound_po_number must be a string' })
  @MinLength(1, { message: 'inbound_po_number must be at least 1 character' })
  @MaxLength(50, { message: 'inbound_po_number must not exceed 50 characters' })
  inbound_po_number: string;

  @ApiPropertyOptional({ example: '2025-08-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'inbound_po_date must be a valid ISO date string' })
  inbound_po_date?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: 'flag_validated must be a boolean' })
  flag_validated?: boolean;

  @ApiPropertyOptional({
    type: () => [CreateInboundItemDto],
    example: [
      { item_id: 'uuid-item-1', quantity: 10, uom: 'PCS' },
      { item_id: 'uuid-item-2', quantity: 5, uom: 'BOX' },
    ],
  })
  @IsOptional()
  @IsArray({ message: 'inbound_items must be an array' })
  @ValidateNested({ each: true })
  @Type(() => CreateInboundItemDto)
  inbound_items?: CreateInboundItemDto[];
}

export class CreateInboundDto {
  @ApiPropertyOptional({ example: 'uuid-inventory-movement-123' })
  @IsOptional()
  @IsString({ message: 'inbound_id_reference must be a string' })
  inbound_id_reference?: string;

  @ApiPropertyOptional({ example: 'Carrier A' })
  @IsOptional()
  @IsString({ message: 'expedition must be a string' })
  @MinLength(1, { message: 'expedition must be at least 1 character' })
  @MaxLength(100, { message: 'expedition must not exceed 100 characters' })
  expedition?: string;

  @ApiPropertyOptional({ example: 'Factory 1' })
  @IsOptional()
  @IsString({ message: 'origin must be a string' })
  @MinLength(1, { message: 'origin must be at least 1 character' })
  @MaxLength(100, { message: 'origin must not exceed 100 characters' })
  origin?: string;

  @ApiPropertyOptional({ example: 'B 1234 XYZ' })
  @IsOptional()
  @IsString({ message: 'license_plate must be a string' })
  @MinLength(1, { message: 'license_plate must be at least 1 character' })
  @MaxLength(20, { message: 'license_plate must not exceed 20 characters' })
  @Matches(/^[A-Z0-9\s]+$/, {
    message: 'license_plate must contain only uppercase letters, numbers, and spaces',
  })
  license_plate?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString({ message: 'driver_name must be a string' })
  @MinLength(1, { message: 'driver_name must be at least 1 character' })
  @MaxLength(100, { message: 'driver_name must not exceed 100 characters' })
  driver_name?: string;

  @ApiPropertyOptional({ example: '+6281234567890' })
  @IsOptional()
  @IsString({ message: 'driver_phone must be a string' })
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'driver_phone must be a valid phone number' })
  driver_phone?: string;

  @ApiPropertyOptional({ example: 'CREATED' })
  @IsOptional()
  @IsEnum(InboundStatus, { message: 'status must be a valid InboundStatus' })
  status?: InboundStatus;

  @ApiPropertyOptional({ example: 'PO' })
  @IsOptional()
  @IsString({ message: 'inbound_type must be a string' })
  @MinLength(1, { message: 'inbound_type must be at least 1 character' })
  @MaxLength(20, { message: 'inbound_type must not exceed 20 characters' })
  inbound_type?: string;

  @ApiPropertyOptional({ example: '2025-09-01T10:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'arrival_date must be a valid ISO date string' })
  arrival_date?: string;

  @ApiPropertyOptional({
    type: () => [CreateInboundDoDto],
    example: [
      {
        inbound_do_number: 'DO-001',
        inbound_do_date: '2025-09-01T10:00:00.000Z',
        attachment: 's3://bucket/path/to/attachment.pdf',
        inbound_po_number: 'PO-123',
        inbound_po_date: '2025-08-31T00:00:00.000Z',
        flag_validated: false,
        validation_surat_jalan: false,
        inbound_items: [
          { item_id: 'uuid-item-1', quantity: 10, uom: 'DUS' },
          { item_id: 'uuid-item-2', quantity: 5, uom: 'DUS' },
        ],
      },
    ],
  })
  @IsOptional()
  @IsArray({ message: 'inbound_dos must be an array' })
  @ValidateNested({ each: true })
  @Type(() => CreateInboundDoDto)
  inbound_dos?: CreateInboundDoDto[];
}
