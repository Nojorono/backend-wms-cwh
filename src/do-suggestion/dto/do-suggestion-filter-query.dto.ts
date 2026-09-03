import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { DoSuggestionStatus } from '../../core/domain/entities/do-suggestion.entity';

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
