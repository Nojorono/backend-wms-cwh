import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateMoveOrderIntegrationLineDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  move_order_integration_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  line_iface_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  header_iface_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  line_number?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  organization_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  inventory_item_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  revision?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  from_subinventory_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  from_subinventory_code?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  from_locator_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  to_organization_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  to_subinventory_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  to_subinventory_code?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  to_locator_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  to_account_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  lot_number?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  serial_number_start?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  serial_number_end?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  uom_code?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  quantity_delivered?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  quantity_detailed?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  date_required?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  reason_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  reference_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  reference?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  reference_type_code?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  project_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  task_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  transaction_header_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  txn_source_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  txn_source_line_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  txn_source_line_detail_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  transaction_type_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  transaction_source_type_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  primary_quantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  put_away_strategy_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  pick_strategy_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  unit_number?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  ship_to_location_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  from_cost_group_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  to_cost_group_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  lpn_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  to_lpn_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  pick_methodology_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  container_item_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  carton_grouping_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  line_status?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  status_date?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  inspection_status?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  wms_process_flag?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  pick_slip_number?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  pick_slip_date?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  ship_set_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  ship_model_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  model_quantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  required_quantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  secondary_uom?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  secondary_quantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  secondary_quantity_detailed?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  secondary_quantity_delivered?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  secondary_required_quantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  grade_code?: string;

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
  line_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  header_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  transaction_temp_id?: number;

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
