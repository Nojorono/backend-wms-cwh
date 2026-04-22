import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateInboundIntegrationLineDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  inbound_integration_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  iface_line_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  iface_header_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  source_line_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  source_header_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  po_number?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  po_line_number?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  iso_number?: string; // for inbound_type SO_INTERNAL, SO_SUBDIST

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  iso_line_number?: number; // for inbound_type SO_INTERNAL, SO_SUBDIST

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  inventory_item_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  uom_code?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subinventory?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  locator_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  shipment_line_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  interface_transaction_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  created_by?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  creation_date?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  last_updated_by?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  last_updated_date?: Date;
}
