import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInboundDeliveryOrderItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  inbound_delivery_order_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  item_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  qty_plan?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  uom?: string;
}