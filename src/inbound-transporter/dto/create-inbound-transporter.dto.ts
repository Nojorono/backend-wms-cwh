import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInboundTransporterDto {
  @ApiProperty({ example: '1', required: true })
  @IsString()
  @IsNotEmpty()
  inbound_plan_id: string;

  @ApiProperty({ example: '1', required: true })
  @IsNumber()
  @IsNotEmpty()
  organization_id: number;

  @ApiProperty({ example: '1', required: true })
  @IsString()
  @IsNotEmpty()
  vehicle_id: string;

  @ApiProperty({ example: '1' })
  @IsString()
  transporter_code_number?: string;

  @ApiProperty({ example: '1' })
  @IsString()
  transporter_seal_number?: string;

  @ApiProperty({ example: '1' })
  @IsString()
  transporter_name?: string;

  @ApiProperty({ example: '1' })
  @IsString()
  transporter_phone?: string;

  @ApiProperty({ example: new Date().toISOString() })
  @IsString()
  unloading_start_time?: string;

  @ApiProperty({ example: new Date().toISOString() })
  @IsString()
  unloading_end_time?: string;

  @ApiProperty({ example: '1', required: true })
  @IsString()
  @IsNotEmpty()
  created_by: string;

  @ApiProperty({ example: new Date().toISOString() })
  @IsString()
  arrival_time?: string;

  @ApiProperty({ example: new Date().toISOString() })
  @IsString()
  departure_time?: string;
  }   