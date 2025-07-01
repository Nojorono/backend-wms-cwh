import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateInboundTransporterDto {
  @ApiProperty({ example: '1', required: false })
  @IsString()
  @IsOptional()
  inbound_plan_id?: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  organization_id?: number;

  @ApiProperty({ example: '1', required: false })
  @IsString()
  @IsOptional()
  vehicle_id?: string;

  @ApiProperty({ example: '1', required: false })
  @IsString()
  @IsOptional()
  transporter_code_number?: string;

  @ApiProperty({ example: '1', required: false })
  @IsString()
  @IsOptional()
  transporter_name?: string;

  @ApiProperty({ example: '1', required: false })
  @IsString()
  @IsOptional()
  transporter_phone?: string;

  @ApiProperty({ example: '1', required: false })
  @IsString()
  @IsOptional()
  transporter_email?: string;

  @ApiProperty({ example: '1', required: false })
  @IsString()
  @IsOptional()
  updated_by?: string;
} 