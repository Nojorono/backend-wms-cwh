import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateInboundDeliveryOrderItemDto } from './create-inbound-do-item.dto';


export class CreateInboundDeliveryOrderDto {

  @ApiProperty({ required: true })
  @IsString()
  inbound_plan_id: string;

  @ApiProperty({ required: true })
  @IsString()
  inbound_transporter_id: string;

  @ApiProperty({ required: true })
  @IsString()
  number_delivery_order: string;

  @ApiProperty({ required: false, type: [CreateInboundDeliveryOrderItemDto] })
  @IsOptional()
  @IsArray()
  items?: CreateInboundDeliveryOrderItemDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  created_by?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  updated_by?: string;
} 