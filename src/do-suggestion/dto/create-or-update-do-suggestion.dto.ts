import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { DoSuggestionStatus } from '../../core/domain/entities/do-suggestion.entity';
import { DoSuggestionDetailDto } from './do-suggestion-detail.dto';

export class CreateOrUpdateDoSuggestionDto {
  @ApiPropertyOptional({ description: 'Header ID — omit for create, include for update' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({ description: 'Organization (m_io) ID' })
  @IsOptional()
  @IsUUID()
  organization_id?: string;

  @ApiProperty({ example: 'CP-2026-0001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  callplan_number: string;

  @ApiPropertyOptional({ example: '2026-06-08' })
  @IsOptional()
  @IsDateString()
  callplan_date_start?: string;

  @ApiPropertyOptional({ example: '2026-06-10' })
  @IsOptional()
  @IsDateString()
  callplan_date_end?: string;

  @ApiPropertyOptional({ example: 'RT-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  route_number?: string;

  @ApiPropertyOptional({ example: 'REGULAR' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  trip_type?: string;

  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sales_nik?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  sales_name?: string;

  @ApiPropertyOptional({ example: 'Supervisor Name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  sales_spv?: string;

  @ApiPropertyOptional({ enum: DoSuggestionStatus, default: DoSuggestionStatus.PENDING })
  @IsOptional()
  @IsEnum(DoSuggestionStatus)
  status?: DoSuggestionStatus;

  @ApiPropertyOptional({ example: 1001 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  created_by?: number;

  @ApiPropertyOptional({ example: 1001 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  updated_by?: number;

  @ApiProperty({ type: [DoSuggestionDetailDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DoSuggestionDetailDto)
  lines: DoSuggestionDetailDto[];
}
