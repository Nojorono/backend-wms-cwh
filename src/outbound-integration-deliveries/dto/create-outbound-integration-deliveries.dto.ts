import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  DeliveryAttributeCategory,
  ShipConfirmInternalTransactionType,
} from 'src/core/domain/entities/outbound-integration-deliveries.entity';

export class CreateOutboundIntegrationDeliveriesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  organization_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  outbound_do_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  outbound_memo_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  outbound_memo_item_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  iface_id?: number;

  @ApiPropertyOptional({ enum: ShipConfirmInternalTransactionType })
  @IsOptional()
  @IsEnum(ShipConfirmInternalTransactionType)
  transaction_type?: ShipConfirmInternalTransactionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  source_system?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  batch_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  batch_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  source_header_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  source_line_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  iso_header_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  iso_line_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  iso_inventory_item_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  iso_organization_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  delivery_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  delivery_name?: string;

  @ApiPropertyOptional({ enum: DeliveryAttributeCategory })
  @IsOptional()
  @IsEnum(DeliveryAttributeCategory)
  delivery_attribute_category?: DeliveryAttributeCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  delivery_attribute6?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  delivery_attribute7?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  delivery_attribute8?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  delivery_attribute9?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  delivery_attribute10?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  delivery_attribute11?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  delivery_attribute12?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  delivery_attribute13?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  delivery_attribute14?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  delivery_attribute15?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  shipped_quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  create_delivery_status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(240)
  create_delivery_message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  update_delivery_status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(240)
  update_delivery_message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  pick_release_request_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  pick_release_status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(240)
  pick_release_message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  ship_confirm_request_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  ship_confirm_status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(240)
  ship_confirm_message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  creation_date?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  last_updated_date?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  created_by?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  last_updated_by?: number;
}
