import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInboundItemDto {
  @ApiPropertyOptional({ example: 'uuid-inbound-123' })
  @IsOptional()
  @IsString()
  inbound_id?: string;

  @ApiPropertyOptional({ example: 'uuid-inbound-do-123' })
  @IsOptional()
  @IsString()
  inbound_do_id?: string;

  @ApiProperty({ example: 'uuid-item-1' })
  @IsString()
  item_id: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ example: 'uuid-classification-1' })
  @IsOptional()
  @IsString()
  classification_id?: string;

  @ApiPropertyOptional({ example: 'PCS' })
  @IsOptional()
  @IsString()
  uom?: string;
}

export class CreateInboundDoDto {
  @ApiPropertyOptional({ example: 'uuid-inbound-123' })
  @IsOptional()
  @IsString()
  inbound_id?: string;

  @ApiPropertyOptional({ example: 'DO-001' })
  @IsOptional()
  @IsString()
  inbound_do_number?: string;

  @ApiPropertyOptional({ example: '2025-09-01T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  inbound_do_date?: string;

  @ApiPropertyOptional({ example: 's3://bucket/path/to/attachment.pdf' })
  @IsOptional()
  @IsString()
  attachment?: string;

  @ApiPropertyOptional({ example: 'PO-123' })
  @IsOptional()
  @IsString()
  inbound_po_number?: string;

  @ApiPropertyOptional({ example: '2025-08-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  inbound_po_date?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  flag_validated?: boolean;

  @ApiPropertyOptional({
    type: [CreateInboundItemDto],
    example: [
      { item_id: 'uuid-item-1', quantity: 10, uom: 'PCS' },
      { item_id: 'uuid-item-2', quantity: 5, uom: 'BOX' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInboundItemDto)
  inbound_items?: CreateInboundItemDto[];
}

export class CreateInboundDto {

  @ApiPropertyOptional({ example: 'Carrier A' })
  @IsOptional()
  @IsString()
  expedition?: string;

  @ApiPropertyOptional({ example: 'Factory 1' })
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiPropertyOptional({ example: 'B 1234 XYZ' })
  @IsOptional()
  @IsString()
  license_plate?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  driver_name?: string;

  @ApiPropertyOptional({ example: '+6281234567890' })
  @IsOptional()
  @IsString()
  driver_phone?: string;

  @ApiPropertyOptional({ example: 'CREATED' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'PO' })
  @IsOptional()
  @IsString()
  inbound_type?: string;

  @ApiPropertyOptional({ example: '2025-09-01T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  arrival_date?: string;

  @ApiPropertyOptional({
    type: [CreateInboundDoDto],
    example: [
      {
        inbound_do_number: 'DO-001',
        inbound_do_date: '2025-09-01T10:00:00.000Z',
        inbound_items: [
          { item_id: 'uuid-item-1', quantity: 10, uom: 'DUS' },
          { item_id: 'uuid-item-2', quantity: 5, uom: 'DUS' },
        ],
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInboundDoDto)
  inbound_dos?: CreateInboundDoDto[];
}


