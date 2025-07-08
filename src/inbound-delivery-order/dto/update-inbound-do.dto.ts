import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateInboundDeliveryOrderItemDto } from './create-inbound-do-item.dto';

export class UpdateInboundDeliveryOrderDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  inbound_plan_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  inbound_transporter_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  number_delivery_order?: string;

  @ApiProperty({ required: false, type: [CreateInboundDeliveryOrderItemDto] })
  @IsOptional()
  @IsArray()
  items?: CreateInboundDeliveryOrderItemDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  created_by?: string;

  @ApiProperty({ required: true })
  @IsString()
  updated_by: string;
} 