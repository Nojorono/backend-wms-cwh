import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMasterWarehouseSubDto {
  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  organization_id?: number;

  @ApiProperty({ example: '1234567890', required: false })
  @IsUUID()
  @IsOptional()
  warehouse_id?: string;

  @ApiProperty({ example: 'WH001', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ example: 'Primary warehouse for storing inventory', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Primary warehouse for storing inventory', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 100, required: false })
  @IsNumber()
  @IsOptional()
  capacity_bin?: number;
} 