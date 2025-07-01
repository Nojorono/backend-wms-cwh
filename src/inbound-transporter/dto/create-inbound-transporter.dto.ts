import { IsString, IsOptional, IsNumber, IsNotEmpty, IsDate } from 'class-validator';
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
  transporter_name?: string;

  @ApiProperty({ example: '1' })
  @IsString()
  transporter_phone?: string;

  @ApiProperty({ example: '1' })
  @IsDate()
  unloading_start_time?: Date | string;

  @ApiProperty({ example: '1' })
  @IsDate()
  unloading_end_time?: Date | string;

  @ApiProperty({ example: '1', required: true })
  @IsString()
  @IsNotEmpty()
  created_by: string;

  @ApiProperty({ example: '2021-01-01T00:00:00Z' })
  @IsDate()
  arrival_time?: Date | string;

  @ApiProperty({ example: '2021-01-01T00:00:00Z' })
  @IsDate()
  departure_time?: Date | string;
  }   