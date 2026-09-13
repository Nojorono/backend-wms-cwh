import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMasterIODto {
  @ApiProperty({ example: 'BAU', required: false })
  @IsString()
  @IsOptional()
  organization_code?: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  organization_id?: number;

  @ApiProperty({ example: 'Organization Name', required: false })
  @IsString()
  @IsOptional()
  organization_name?: string;

  @ApiProperty({ example: 'NNA_BAU_OU', required: false })
  @IsString()
  @IsOptional()
  org_name?: string;

  @ApiProperty({ example: '238', required: false })
  @IsString()
  @IsOptional()
  org_id?: string;

  @ApiProperty({ example: 'SUBBRANCH', required: false })
  @IsString()
  @IsOptional()
  organization_type?: string;

  @ApiProperty({ example: '204301', required: false })
  @IsString()
  @IsOptional()
  region_code?: string;

  @ApiProperty({ example: 340, required: false })
  @IsNumber()
  @IsOptional()
  location_id?: number;

  @ApiProperty({ example: '1899-12-31T17:17:56.000Z', required: false })
  @IsDateString()
  @IsOptional()
  start_date_active?: Date;

  @ApiProperty({ example: '2026-02-03T17:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  end_date_active?: Date;

  @ApiProperty({ example: 'Address', required: false })
  @IsString()
  @IsOptional()
  address?: string;
}
