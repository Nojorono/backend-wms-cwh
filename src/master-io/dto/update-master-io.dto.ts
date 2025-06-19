import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMasterIODto {
  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  organization_id?: number;

  @ApiProperty({ example: 'Organization Name', required: false })
  @IsString()
  @IsOptional()
  organization_name?: string;

  @ApiProperty({ example: 'Operating Unit', required: false })
  @IsString()
  @IsOptional()
  operating_unit?: string;
} 