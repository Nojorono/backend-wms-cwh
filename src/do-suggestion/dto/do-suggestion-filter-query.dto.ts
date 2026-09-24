import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { DoSuggestionStatus } from '../../core/domain/entities/do-suggestion.entity';
import {
  DO_SUGGESTION_MO_TYPE_VALUES,
  DoSuggestionMoType,
} from './create-dummy-data-do-suggestion-query.dto';

export class DoSuggestionFilterQueryDto {
  @ApiPropertyOptional({ enum: DoSuggestionStatus, example: DoSuggestionStatus.REVISED })
  @IsOptional()
  @IsEnum(DoSuggestionStatus)
  status?: DoSuggestionStatus;
}

export class DoSuggestionCallplanFilterQueryDto extends DoSuggestionFilterQueryDto {
  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sales_spv_nik?: string;

  @ApiPropertyOptional({
    example: 'FPPR Awal',
    enum: DO_SUGGESTION_MO_TYPE_VALUES,
    description: 'Filter by move order type',
  })
  @IsOptional()
  @IsString()
  @IsIn([...DO_SUGGESTION_MO_TYPE_VALUES])
  mo_type?: DoSuggestionMoType;
}

export class DoSuggestionReturnQueryDto {
  @ApiProperty({
    name: 'callplanDateStart',
    example: '2026-09-01',
    description: 'Filter by callplan_date_start (YYYY-MM-DD)',
  })
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  callplanDateStart: string;
}
