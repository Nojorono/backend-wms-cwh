import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ScheduledSpbSubmittedSubmitPayloadDto {
  @ApiPropertyOptional({
    description: 'Only submit DO suggestions for this call plan start date (YYYY-MM-DD)',
    example: '2026-06-19',
  })
  @IsOptional()
  @IsDateString()
  callplan_date_start?: string;

  @ApiPropertyOptional({ description: 'Audit user for updated_by on DO suggestion headers', default: 'SYSTEM' })
  @IsOptional()
  @IsString()
  updated_by?: string;
}
