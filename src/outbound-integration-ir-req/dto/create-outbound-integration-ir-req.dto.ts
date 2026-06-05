import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOutboundIntegrationIrReqDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  organization_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  outbound_do_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  outbound_memo_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  iface_header_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  transaction_type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  source_code?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  source_header_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  need_by_date?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  preparer_number?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  preparer_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  requestor_number?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  requestor_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  org_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  org_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  io_source_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  io_source_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  io_dest_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  io_dest_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  header_attribute_category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  header_attribute7?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  ir_header_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  ir_number?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  so_header_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  so_number?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  total_lines?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  batch_number?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  iface_status_ir?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  iface_message_ir?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  iface_status_io?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  iface_message_io?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  iface_status_oi?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  iface_message_oi?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  request_id_ir?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  request_id_io?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  request_id_oi?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  creation_date?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  last_updated_date?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  created_by?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  last_updated_by?: number;
}
