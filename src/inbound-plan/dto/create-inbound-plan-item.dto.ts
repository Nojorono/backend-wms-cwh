import { IsString, IsOptional, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInboundPlanItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  inbound_plan_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  item_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  expired_date?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  qty_plan?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  uom?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  classification_item_id?: string;
}