import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
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
