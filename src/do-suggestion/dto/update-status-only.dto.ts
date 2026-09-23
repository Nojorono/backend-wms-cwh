import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { DoSuggestionStatus } from '../../core/domain/entities/do-suggestion.entity';

export class UpdateStatusOnlyDto {
  @ApiProperty({ description: 'DO suggestion header ID' })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ enum: DoSuggestionStatus, example: DoSuggestionStatus.COMPLETED })
  @IsEnum(DoSuggestionStatus)
  @IsNotEmpty()
  status: DoSuggestionStatus;

  @ApiPropertyOptional({ description: 'Employee NIK of updater', example: '07052300162DC' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  updated_by?: string;
}
