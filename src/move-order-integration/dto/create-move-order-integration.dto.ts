import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateMoveOrderIntegrationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  master_io_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  header_iface_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  request_number?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  transaction_type_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  move_order_type?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  organization_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  date_required?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  from_subinventory_code?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  to_subinventory_code?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  to_account_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  grouping_rule_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  ship_to_location_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  reference_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  header_status?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  status_date?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  attribute_category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  attribute1?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  attribute2?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  attribute3?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  attribute4?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  attribute5?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  attribute6?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  attribute7?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  attribute8?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  attribute9?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  attribute10?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  attribute11?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  attribute12?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  attribute13?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  attribute14?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  attribute15?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  program_application_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  program_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  program_update_date?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  operation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1)
  db_flag?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  header_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  request_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  source_system?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  source_header_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  source_line_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  source_batch_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  iface_status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  iface_message?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  iface_mode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  total_lines?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  creation_date?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  created_by?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  last_update_login?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  last_update_date?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  last_updated_by?: number;
}
