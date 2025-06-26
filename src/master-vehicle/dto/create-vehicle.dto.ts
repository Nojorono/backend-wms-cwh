import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVehicleIODto {
  @ApiProperty({ example: 'Vehicle Type', required: false })
  @IsString()
  @IsOptional()
  vehicle_type?: string;

  @ApiProperty({ example: 'Vehicle Brand', required: false })
  @IsString()
  @IsOptional()
  vehicle_brand?: string;

  @ApiProperty({ example: 'Is Active', required: false })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
} 