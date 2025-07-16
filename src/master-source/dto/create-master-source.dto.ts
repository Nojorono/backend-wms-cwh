import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMasterSourceDto {
  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  organization_id?: number;

  @ApiProperty({ example: 'Source Name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Source Code', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ example: 'Source Type', required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ example: 'Source URL', required: false })
  @IsString()
  @IsOptional()
  url?: string;
} 