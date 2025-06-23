import { IsString, IsOptional, IsDateString, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateInboundPlanItemDto } from './create-inbound-plan-item.dto';
import { PlanStatus } from '../../core/domain/entities/inbound-plan.entity';


export class CreateInboundPlanDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  inbound_planning_no?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  organization_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  delivery_no?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  po_no?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  client_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  order_type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  task_type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, type: String })
  @IsOptional()
  @IsString()
  supplier_id?: string;

  @ApiProperty({ required: false, type: String })
  @IsOptional()
  @IsString()
  warehouse_id?: string;

  @ApiProperty({ required: false, type: [CreateInboundPlanItemDto] })
  @IsOptional()
  @IsArray()
  items?: CreateInboundPlanItemDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  plan_delivery_date?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  plan_status?: PlanStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  plan_type?: string;
} 