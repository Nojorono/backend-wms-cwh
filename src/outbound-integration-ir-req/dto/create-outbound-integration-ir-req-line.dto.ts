import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOutboundIntegrationIrReqLineDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  outbound_integration_ir_req_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  outbound_memo_item_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  iface_header_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  iface_line_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  source_header_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  source_line_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  inventory_item_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  item?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  transaction_uom?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  ir_line_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  ir_line_number?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  so_line_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  so_line_number?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  iface_line_status_ir?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  iface_line_message_ir?: string;

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
