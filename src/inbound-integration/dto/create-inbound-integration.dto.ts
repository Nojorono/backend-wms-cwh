import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { RcvReceiptTransactionType } from 'src/core/domain/entities/inbound-integration.entity';

export class CreateInboundIntegrationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  organization_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  inbound_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  inbound_do_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  iface_header_id?: number;

  @ApiProperty({ enum: RcvReceiptTransactionType, required: false })
  @IsOptional()
  @IsEnum(RcvReceiptTransactionType)
  transaction_type?: RcvReceiptTransactionType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  source_system?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  receipt_source_code?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  source_header_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  do_number?: string; // for inbound_type SO_INTERNAL, SO_SUBDIST

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  vendor_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  vendor_site_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  shipment_header_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  org_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rsh_attribute1?: string; // RCV Shipment Header DFF Attribute "Plat Nomor" / "Plate Number"

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rsh_attribute2?: string; // RCV Shipment Header DFF Attribute "Nama Driver" / "Driver Name"

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rsh_attribute3?: string; // RCV Shipment Header DFF Attribute "Ekspedisi" / "Expedition"

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  receipt_number?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  group_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  total_lines?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  header_interface_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  request_id?: number;

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
